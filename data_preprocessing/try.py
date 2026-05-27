import asyncio
import requests
import time
import pandas as pd
import spacy
from SPARQLWrapper import SPARQLWrapper, JSON
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

# --- CONFIGURATION ---
WIKIDATA_API_URL = "https://www.wikidata.org/w/rest.php/wikibase/v1"
WIKIDATA_SPARQL_URL = "https://query.wikidata.org/sparql"
USER_AGENT = "SurabayaEventRecommender/1.1 (student.thesis@example.com) python-requests"

# Load spaCy once
nlp = spacy.load("en_core_web_sm")
if "entityLinker" not in nlp.pipe_names:
    nlp.add_pipe("entityLinker", last=True)

# --- UTILITIES ---

def get_q_code(keyword):
    """Fuzzy search Wikidata for a Q-Code based on a string."""
    params = {
        "action": "wbsearchentities",
        "format": "json",
        "language": "en",
        "search": keyword
    }
    headers = {"User-Agent": USER_AGENT}
    
    try:
        response = requests.get(WIKIDATA_API_URL, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get('search'):
            return data['search'][0]['id']
    except Exception as e:
        print(f"Error fetching Q-Code for {keyword}: {e}")
    return None

# --- NLP CORE ---

async def extract_keywords(text, stop_words=None, method="noun"):
    """Extracts lemmas or Wikidata IDs from text using spaCy."""
    stop_words = stop_words or set()
    doc = nlp(text)
    result = []

    if method == "wikidata":
        for entity in doc._.linkedEntities:
            span_text = entity.get_span().text
            if span_text not in stop_words:
                q_id = f"Q{entity.get_id()}"
                print(f"Linked: {span_text} -> {q_id} ({entity.get_description()})")
                result.append(q_id)

    elif method == "noun":
        for chunk in doc.noun_chunks:
            if chunk.text.lower() not in stop_words:
                lemma = chunk.root.lemma_.lower()
                result.append(lemma)
                
    return list(set(result))  # Deduplicate

# --- KNOWLEDGE GRAPH MATCHING ---

async def get_similarity_wordnet(keywords1, keywords2):
    """Neo4j WordNet Similarity Query."""
    from connection import Neo4jConnection # Assuming internal import
    
    cypher_query = """
    UNWIND $keywords1 AS kw1
    UNWIND $keywords2 AS kw2

    MATCH (le1:ns2__LexicalEntry) WHERE lower(le1.lemma) = lower(kw1)
    MATCH (le1)-[:ns2__sense]->()-[:ns2__isLexicalizedSenseOf]->(c1:ns2__LexicalConcept)

    MATCH (le2:ns2__LexicalEntry) WHERE lower(le2.lemma) = lower(kw2)
    MATCH (le2)-[:ns2__sense]->()-[:ns2__isLexicalizedSenseOf]->(c2:ns2__LexicalConcept)

    // Calculate Multi-Hop Paths (up to 3 hops)
    OPTIONAL MATCH parent_path = shortestPath((c1)-[:ns3__hypernym*1..3]->(c2))
    OPTIONAL MATCH child_path = shortestPath((c2)-[:ns3__hypernym*1..3]->(c1))

    // Sibling Path Check
    CALL {
        WITH c1, c2
        OPTIONAL MATCH (c1)-[:ns3__hypernym]->(p:ns2__LexicalConcept)<-[:ns3__hypernym]-(c2)
        WHERE c1 <> c2
        OPTIONAL MATCH (p)<-[:ns2__isLexicalizedSenseOf]-()<-[:ns2__sense]-(parentWord:ns2__LexicalEntry)
        RETURN collect(DISTINCT parentWord.lemma) AS parentWords
    }

    // Extract human-readable lemmas for every concept node traversed in the paths
    WITH kw1, kw2, c1, c2, parentWords, parent_path, child_path,
         [n IN nodes(parent_path) | 
            coalesce([(n)<-[:ns2__isLexicalizedSenseOf]-()<-[:ns2__sense]-(le:ns2__LexicalEntry) | le.lemma][0], "Unknown")
         ] AS p_path_nodes,
         [n IN nodes(child_path) | 
            coalesce([(n)<-[:ns2__isLexicalizedSenseOf]-()<-[:ns2__sense]-(le:ns2__LexicalEntry) | le.lemma][0], "Unknown")
         ] AS c_path_nodes

    WITH kw1, kw2, c1, c2, parentWords, parent_path, child_path, p_path_nodes, c_path_nodes,
    CASE
        WHEN c1 = c2 THEN "Exact Concept Match (Synonym)"
        
        // Output the full string joining the path nodes (e.g., "Word1 -> Word2 -> Word3")
        WHEN parent_path IS NOT NULL THEN "Parent (" + length(parent_path) + " hops): " + apoc.text.join(p_path_nodes, " -> ")
        WHEN child_path IS NOT NULL THEN "Child (" + length(child_path) + " hops): " + apoc.text.join(c_path_nodes, " -> ")
        
        WHEN size(parentWords) > 0 THEN "Sibling (Shared Parent: " + apoc.text.join(parentWords, ", ") + ")" 
        ELSE NULL
    END AS match_through

    WHERE match_through IS NOT NULL
    RETURN kw1 AS keyword1, kw2 AS keyword2, collect(DISTINCT match_through) AS match_through
    ORDER BY keyword1, keyword2
    """
    params = {"keywords1": keywords1, "keywords2": keywords2}
    raw_data = await Neo4jConnection.query(cypher_query, params)
    return pd.DataFrame(raw_data) if raw_data else pd.DataFrame()

async def get_similarity_wikidata(q_codes1, q_codes2):
    """Wikidata SPARQL Hierarchy Query."""
    vals1 = " ".join([f'wd:{q}' for q in q_codes1])
    vals2 = " ".join([f'wd:{q}' for q in q_codes2])
    
    sparql_query = f"""
    SELECT (STR(?kw1L) AS ?keyword1) (STR(?kw2L) AS ?keyword2) (GROUP_CONCAT(DISTINCT ?m; separator=" | ") AS ?match_through)
    WHERE {{
      VALUES ?c1 {{ {vals1} }}
      VALUES ?c2 {{ {vals2} }}
      ?c1 rdfs:label ?kw1L . FILTER(LANG(?kw1L) = "en")
      ?c2 rdfs:label ?kw2L . FILTER(LANG(?kw2L) = "en")

      {{ FILTER(?c1 = ?c2) BIND("Exact Match" AS ?m) }}
 
      UNION
      {{ 
        VALUES (?p1 ?p1L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        ?c1 ?p1 ?c2 . 
        BIND(CONCAT("Parent (1 hop via ", ?p1L, ")") AS ?m) 
      }}
      # 1 Hop DOWN (Inverse: KW2 "has part" KW1)
      UNION
      {{ 
        VALUES (?p1 ?p1L) {{ (wdt:P527 "has part") }}
        ?c2 ?p1 ?c1 . 
        BIND(CONCAT("Parent (1 hop via inverse ", ?p1L, ")") AS ?m) 
      }}
 
      UNION
      {{ 
        VALUES (?p1 ?p1L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        VALUES (?p2 ?p2L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        ?c1 ?p1 ?mid1 . ?mid1 ?p2 ?c2 . 
        ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
        BIND(CONCAT("Parent (2 hops: [", ?p1L, "] -> ", STR(?mid1L), " -> [", ?p2L, "])") AS ?m) 
      }}

      UNION
      {{ 
        VALUES (?p1 ?p1L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        VALUES (?p2 ?p2L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        VALUES (?p3 ?p3L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        ?c1 ?p1 ?mid1 . ?mid1 ?p2 ?mid2 . ?mid2 ?p3 ?c2 . 
        ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
        ?mid2 rdfs:label ?mid2L . FILTER(LANG(?mid2L) = "en")
        BIND(CONCAT("Parent (3 hops: [", ?p1L, "] -> ", STR(?mid1L), " -> [", ?p2L, "] -> ", STR(?mid2L), " -> [", ?p3L, "])") AS ?m) 
      }}

      UNION
      {{ 
        VALUES (?p1 ?p1L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        ?c2 ?p1 ?c1 . 
        BIND(CONCAT("Child (1 hop via inverse ", ?p1L, ")") AS ?m) 
      }}

      UNION
      {{ 
        VALUES (?p1 ?p1L) {{ (wdt:P527 "has part") }}
        ?c1 ?p1 ?c2 . 
        BIND(CONCAT("Child (1 hop via ", ?p1L, ")") AS ?m) 
      }}
   
      UNION
      {{ 
        VALUES (?p1 ?p1L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        VALUES (?p2 ?p2L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        ?c2 ?p1 ?mid1 . ?mid1 ?p2 ?c1 . 
        ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
        BIND(CONCAT("Child (2 hops inverse: [", ?p1L, "] -> ", STR(?mid1L), " -> [", ?p2L, "])") AS ?m) 
      }}
  
      UNION
      {{ 
        VALUES (?p1 ?p1L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        VALUES (?p2 ?p2L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        VALUES (?p3 ?p3L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        ?c2 ?p1 ?mid1 . ?mid1 ?p2 ?mid2 . ?mid2 ?p3 ?c1 . 
        ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
        ?mid2 rdfs:label ?mid2L . FILTER(LANG(?mid2L) = "en")
        BIND(CONCAT("Child (3 hops inverse: [", ?p1L, "] -> ", STR(?mid1L), " -> [", ?p2L, "] -> ", STR(?mid2L), " -> [", ?p3L, "])") AS ?m) 
      }}
         
      UNION
      {{ 
        VALUES (?p1 ?p1L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        VALUES (?p2 ?p2L) {{ (wdt:P279 "subclass of") (wdt:P31 "instance of") (wdt:P361 "part of") }}
        ?c1 ?p1 ?parent . 
        ?c2 ?p2 ?parent . 
        FILTER(?c1 != ?c2)
        ?parent rdfs:label ?parentL . FILTER(LANG(?parentL) = "en")
        BIND(CONCAT("Sibling (Shared Parent: ", STR(?parentL), " via ", ?p1L, " / ", ?p2L, ")") AS ?m) 
      }}
         
    }} GROUP BY ?kw1L ?kw2L
    """
    
    # sparql_query = f"""
    # SELECT (STR(?kw1L) AS ?keyword1) (STR(?kw2L) AS ?keyword2) (GROUP_CONCAT(DISTINCT ?m; separator=" | ") AS ?match_through)
    # WHERE {{
    #   VALUES ?c1 {{ {vals1} }}
    #   VALUES ?c2 {{ {vals2} }}
    #   ?c1 rdfs:label ?kw1L . FILTER(LANG(?kw1L) = "en")
    #   ?c2 rdfs:label ?kw2L . FILTER(LANG(?kw2L) = "en")
      
    #   {{ FILTER(?c1 = ?c2) BIND("Exact Match" AS ?m) }}
      
    #   # --- PARENT CHECKS ---
    #   UNION
    #   {{ ?c1 wdt:P279 ?c2 . 
    #      BIND("Parent (1 hop)" AS ?m) }}
         
    #   UNION
    #   {{ ?c1 wdt:P279 ?mid1 . ?mid1 wdt:P279 ?c2 . 
    #      ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
    #      BIND(CONCAT("Parent (2 hops via: ", STR(?mid1L), ")") AS ?m) }}
         
    #   UNION
    #   {{ ?c1 wdt:P279 ?mid1 . ?mid1 wdt:P279 ?mid2 . ?mid2 wdt:P279 ?c2 . 
    #      ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
    #      ?mid2 rdfs:label ?mid2L . FILTER(LANG(?mid2L) = "en")
    #      BIND(CONCAT("Parent (3 hops via: ", STR(?mid1L), " -> ", STR(?mid2L), ")") AS ?m) }}
         
    #   UNION
    #   {{ ?c1 wdt:P279 ?mid1 . ?mid1 wdt:P279 ?mid2 . ?mid2 wdt:P279 ?mid3 . ?mid3 wdt:P279 ?c2 .
    #      ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
    #      ?mid2 rdfs:label ?mid2L . FILTER(LANG(?mid2L) = "en")
    #      ?mid3 rdfs:label ?mid3L . FILTER(LANG(?mid3L) = "en")
    #      BIND(CONCAT("Parent (4 hops via: ", STR(?mid1L), " -> ", STR(?mid2L), " -> ", STR(?mid3L), ")") AS ?m) }}
      
    #   UNION
    #   {{ ?c1 wdt:P279 ?mid1 . ?mid1 wdt:P279 ?mid2 . ?mid2 wdt:P279 ?mid3 . ?mid3 wdt:P279 ?mid4 . ?mid4 wdt:P279 ?c2 .
    #      ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
    #      ?mid2 rdfs:label ?mid2L . FILTER(LANG(?mid2L) = "en")
    #      ?mid3 rdfs:label ?mid3L . FILTER(LANG(?mid3L) = "en")
    #      ?mid4 rdfs:label ?mid4L . FILTER(LANG(?mid4L) = "en")
    #      BIND(CONCAT("Parent (5 hops via: ", STR(?mid1L), " -> ", STR(?mid2L), " -> ", STR(?mid3L), " -> ", STR(?mid4L), ")") AS ?m) }}
      
    #   # --- CHILD CHECKS ---
    #   UNION
    #   {{ ?c2 wdt:P279 ?c1 . 
    #      BIND("Child (1 hop)" AS ?m) }}
         
    #   UNION
    #   {{ ?c2 wdt:P279 ?mid1 . ?mid1 wdt:P279 ?c1 . 
    #      ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
    #      BIND(CONCAT("Child (2 hops via: ", STR(?mid1L), ")") AS ?m) }}
         
    #   UNION
    #   {{ ?c2 wdt:P279 ?mid1 . ?mid1 wdt:P279 ?mid2 . ?mid2 wdt:P279 ?c1 . 
    #      ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
    #      ?mid2 rdfs:label ?mid2L . FILTER(LANG(?mid2L) = "en")
    #      BIND(CONCAT("Child (3 hops via: ", STR(?mid1L), " -> ", STR(?mid2L), ")") AS ?m) }}
         
    #   UNION
    #   {{ ?c2 wdt:P279 ?mid1 . ?mid1 wdt:P279 ?mid2 . ?mid2 wdt:P279 ?mid3 . ?mid3 wdt:P279 ?c1 .
    #      ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
    #      ?mid2 rdfs:label ?mid2L . FILTER(LANG(?mid2L) = "en")
    #      ?mid3 rdfs:label ?mid3L . FILTER(LANG(?mid3L) = "en")
    #      BIND(CONCAT("Child (4 hops via: ", STR(?mid1L), " -> ", STR(?mid2L), " -> ", STR(?mid3L), ")") AS ?m) }}
         
    #   UNION
    #   {{ ?c2 wdt:P279 ?mid1 . ?mid1 wdt:P279 ?mid2 . ?mid2 wdt:P279 ?mid3 . ?mid3 wdt:P279 ?mid4 . ?mid4 wdt:P279 ?c1 .
    #      ?mid1 rdfs:label ?mid1L . FILTER(LANG(?mid1L) = "en")
    #      ?mid2 rdfs:label ?mid2L . FILTER(LANG(?mid2L) = "en")
    #      ?mid3 rdfs:label ?mid3L . FILTER(LANG(?mid3L) = "en")
    #      ?mid4 rdfs:label ?mid4L . FILTER(LANG(?mid4L) = "en")
    #      BIND(CONCAT("Child (5 hops via: ", STR(?mid1L), " -> ", STR(?mid2L), " -> ", STR(?mid3L), " -> ", STR(?mid4L), ")") AS ?m) }}
         
    #   # --- SIBLING CHECK ---
    #   UNION
    #   {{ ?c1 wdt:P279 ?p . ?c2 wdt:P279 ?p . FILTER(?c1 != ?c2)
    #      ?p rdfs:label ?pL . FILTER(LANG(?pL) = "en")
    #      BIND(CONCAT("Sibling (Parent: ", STR(?pL), ")") AS ?m) }}
         
    # }} GROUP BY ?kw1L ?kw2L
    # """
    # sparql_query = f"""
    # SELECT (STR(?kw1L) AS ?keyword1) (STR(?kw2L) AS ?keyword2) (GROUP_CONCAT(DISTINCT ?m; separator=" | ") AS ?match_through)
    # WHERE {{
    #   VALUES ?c1 {{ {vals1} }}
    #   VALUES ?c2 {{ {vals2} }}
    #   ?c1 rdfs:label ?kw1L . FILTER(LANG(?kw1L) = "en")
    #   ?c2 rdfs:label ?kw2L . FILTER(LANG(?kw2L) = "en")
    #   {{ FILTER(?c1 = ?c2) BIND("Exact Match" AS ?m) }}
    #   UNION
    #   {{ ?c1 (wdt:P279)+ ?c2 . BIND("Parent (KW2 broader)" AS ?m) }}
    #   UNION
    #   {{ ?c2 (wdt:P279)+ ?c1 . BIND("Child (KW2 narrower)" AS ?m) }}
    #   UNION
    #   {{ ?c1 wdt:P279 ?p . ?c2 wdt:P279 ?p . FILTER(?c1 != ?c2)
    #      ?p rdfs:label ?pL . FILTER(LANG(?pL) = "en")
    #      BIND(CONCAT("Sibling (Parent: ", STR(?pL), ")") AS ?m) }}
    # }} GROUP BY ?kw1L ?kw2L
    # """
    
    
    sparql = SPARQLWrapper(WIKIDATA_SPARQL_URL)
    sparql.agent = USER_AGENT
    sparql.setQuery(sparql_query)
    sparql.setReturnFormat(JSON)
    
    try:
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(None, sparql.query().convert)
        
        return [{
            "keyword1": r["keyword1"]["value"],
            "keyword2": r["keyword2"]["value"],
            "match_through": r["match_through"]["value"]
        } for r in results["results"]["bindings"]]
    except Exception as e:
        print(f"Wikidata SPARQL Failed: {e}")
        raise e

@retry(stop=stop_after_attempt(3), wait=wait_fixed(65), retry=retry_if_exception_type(Exception))
async def get_similarity_with_retry(q_codes1, q_codes2):
    return await get_similarity_wikidata(q_codes1, q_codes2)

# --- MAIN EXECUTION ---

async def main():
    # Input Data
    # desc = "In this workshop, students are taught how to use writing skills (microblog, content writing, script writing, caption) obtained from the English Literature and Communication Studies study programs, into a series of steps to understand and interpret basic ideas as a whole, analyze problems, create ideas/concepts for solutions to these problems, and express them in written form/layout. We will train them to write completely by starting from their personal reflection according to their faith in the Lord Jesus, building a common ground for basic ideas, and expressing them in writing that is grounded and easy to understand."
    desc = ("ASTOR (Assistant Tutor) is a second-year student who is trained and prepared to process holistically (WHOPE) and will later serve new students next year. ASTOR will be fostered in 3 forums, formal classes (Servant Leadership), large communal classes (Astor Fellowship) for growth in the community, as well as small classes and personal mentoring for internalization of guidance. ASTOR is also trained and prepared with interpersonal skills, group dynamics, and peer-to-peer counseling.")
    target_interests = ['Q34178', 'Q5043', 'Q9418', 'Q11024'] # Theology, Christianity, Psychology
    
    # target_interests = ['christianity', 'theology', 'psychology', 'communication']
    print("--- 1. Extracting Entities ---")
    extracted_q_codes = await extract_keywords(desc, stop_words=set(), method="wikidata")
    # extracted_keywords = await extract_keywords(desc, stop_words=set(), method="noun")
    
    if not extracted_q_codes:
        print("No entities found.")
        return

    print(f"\n--- 2. Comparing Lists ---\nSource: {extracted_q_codes}\nTargets: {target_interests}")
    
    # Similarity Match
    try:
        results = await get_similarity_with_retry(extracted_q_codes, target_interests)
        # results = await get_similarity_wordnet(extracted_keywords, target_interests)
        if results:
            df = pd.DataFrame(results)
            print("\n--- Match Results ---")
            print(df.to_string(index=False))
        else:
            print("\nNo semantic relationships found between these lists.")
    except Exception:
        print("\nFailed to retrieve data after retries. Wikidata might be down.")

if __name__ == "__main__":
    asyncio.run(main())