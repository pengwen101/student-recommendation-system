import pandas as pd
from backend.database import Neo4jConnection
import spacy
import requests
import os
import httpx
from deep_translator import GoogleTranslator
import asyncio
import re
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
import textwrap

nlp = spacy.load("en_core_web_sm")
if "entityLinker" not in nlp.pipe_names:
    nlp.add_pipe("entityLinker", last=True)
    
# kw_model = KeyBERT()
    
    
additional_stop_words = ["students", "student", "people"]

async def seed_years_and_versions():
    query = """
        MERGE (:StudyLevel {study_level_id: "1"})
        MERGE (:StudyLevel {study_level_id: "2"})
        MERGE (:StudyLevel {study_level_id: "3"})
        MERGE (:StudyLevel {study_level_id: "4"})
        
        MERGE (:CurriculumVersion {curriculum_version_id: "1"})
    """
    await Neo4jConnection.query(query)
    
async def seed_curriculum(path):
    df = pd.read_parquet(path)
    data = df.to_dict(orient="records")
    
    query = """
        UNWIND $batch as row
        MATCH (cv:CurriculumVersion {curriculum_version_id: "1"})
        MATCH (b: Batch {batch_id: "2025/2026"})
        MERGE (c:Cpl {code: row.cpl_code})
        ON CREATE SET c.cpl_id = randomUUID()
        MERGE (sc:SubCpl {code: row.sub_cpl_code})
        ON CREATE SET sc.sub_cpl_id = randomUUID()
        MERGE (q:Quality {code: row.quality_code})
        ON CREATE SET q.quality_id = randomUUID()
        MERGE (i:Indicator {code: row.indicator_code})
        ON CREATE SET i.indicator_id = randomUUID()
        MERGE (qs:Question {code: row.question_code})
        ON CREATE SET qs.question_id = randomUUID()
        SET c.name = row.cpl_name
        SET sc.name = row.sub_cpl_name
        SET q.name = row.quality_name
        SET i.name = row.indicator_name
        SET qs.name = row.question_name
        SET qs.question_scale_label = row.question_scale_label
        SET qs.flipped = row.flipped
        MERGE (b)-[:USES]->(cv)
        MERGE (cv)-[:HAS_CPL]->(c)
        MERGE (c)-[:HAS_SUB_CPL]->(sc)
        MERGE (sc)-[r:HAS_QUALITY]->(q)
        SET r.weight = toFloat(row.sub_cpl_quality_weight)
        MERGE (q)-[:HAS_INDICATOR]->(i)
        MERGE (i)-[:HAS_QUESTION]->(qs)
        """
    await Neo4jConnection.query(query, {"batch": data})
    
async def seed_students(path):
    df = pd.read_parquet(path)
    data = df.to_dict(orient="records")
    query = """
        MATCH (sl:StudyLevel {study_level_id: "1"})
        UNWIND $batch as row
        MERGE (s:Student {nrp: row.nrp})
        SET s.gender = row.gender,
            s.major = row.major,
            s.religion = row.religion,
            s.full_name = row.full_name
        MERGE (m:Major {name: row.major})
        ON CREATE SET m.major_id = randomUUID()
        MERGE (f:Faculty {name: row.faculty})
        ON CREATE SET f.faculty_id = randomUUID()
        MERGE (s)-[:MAJORS_IN]->(m)
        MERGE (m)-[:BELONGS_TO]->(f)
        WITH s, sl, row, 
            "20" + substring(row.nrp, 3, 2) + "/20" + toString(toInteger(substring(row.nrp, 3, 2)) + 1) AS calculated_batch_id
        MERGE (b:Batch {batch_id: calculated_batch_id})
        MERGE (s)-[:IS_FROM_BATCH]->(b)
        MERGE (s)-[:CURRENTLY_IN]->(sl)
    """
    
    await Neo4jConnection.query(query,{"batch": data})

async def seed_student_questions_relation(path):
    df = pd.read_parquet(path)
    data = df.to_dict(orient="records")
    
    query = """
    UNWIND $batch as row
    MATCH (s:Student {nrp: row.nrp})
    MATCH (qs: Question {name: row.question_name})
    MERGE (s)-[ra:ANSWERED]->(qs)
    SET ra.score = row.score
    SET ra.valid_score = row.valid_score
    """
    await Neo4jConnection.query(query,{"batch": data})
    
    query = """
    MATCH (s:Student)-[ra:ANSWERED]->(:Question)<-[:HAS_QUESTION]-(i:Indicator)
    WITH s, i, (avg(ra.valid_score)-1.0)/9.0 AS ind_avg_score
    MERGE (s)-[rli:HAS]->(i)
    SET rli.weight = ind_avg_score

    WITH DISTINCT s
    MATCH (s)-[ra:ANSWERED]->(:Question)<-[:HAS_QUESTION]-(:Indicator)<-[:HAS_INDICATOR]-(q:Quality)
    WITH s, q, (avg(ra.valid_score)-1.0)/9.0 AS qual_avg_score
    MERGE (s)-[rlq:HAS]->(q)
    SET rlq.weight = qual_avg_score

    WITH s, q, qual_avg_score
    MATCH (sc:SubCpl)-[sq:HAS_QUALITY]->(q)
    WITH s, sc,
        sum(qual_avg_score * sq.weight) AS weighted_score_sum,
        sum(sq.weight) AS total_weight
    WITH s, sc, weighted_score_sum / total_weight as subcpl_avg_score
    MERGE (s)-[rls:HAS]->(sc)
    SET rls.weight = subcpl_avg_score
    
    WITH s, sc, subcpl_avg_score
    MATCH (sc)<-[:HAS_SUB_CPL]-(c:Cpl)
    WITH s, c, avg(subcpl_avg_score) as cpl_avg_score
    MERGE (s)-[rlc:HAS]->(c)
    SET rlc.weight = cpl_avg_score
    """
    
    await Neo4jConnection.query(query)
    
async def seed_student_topics_relation(path):
    df = pd.read_parquet(path)
    data = df.to_dict(orient="records")
    
    query = """
    UNWIND $batch as row
    MATCH (t:Topic {name: row.topic})
    MATCH (s:Student {nrp: row.nrp})
    MERGE (s)-[ri:INTERESTED_IN]-(t)
    """
    await Neo4jConnection.query(query, {"batch": data})
    
    
async def seed_configs():
    query = """
    MERGE (cfu:Config:ScaleRule {scale: "university"})
    SET cfu.weight = 0.4
    
    MERGE (cfr:Config:ScaleRule {scale: "regional"})
    SET cfr.weight = 0.6
    
    MERGE (cfn:Config:ScaleRule {scale: "national"})
    SET cfn.weight = 0.8
    
    MERGE (cfi:Config:ScaleRule {scale: "international"})
    SET cfi.weight = 1.0
    
    MERGE (cfsu:Config:SpeakerDegreeRule {speaker_degree: "university_student"})
    SET cfsu.weight = 0.4
    
    MERGE (cfsb:Config:SpeakerDegreeRule {speaker_degree: "bachelor"})
    SET cfsb.weight = 0.6
    
    MERGE (cfsm:Config:SpeakerDegreeRule {speaker_degree: "master"})
    SET cfsm.weight = 0.8
    
    MERGE (cfsp:Config:SpeakerDegreeRule {speaker_degree: "phd"})
    SET cfsp.weight = 1.0
    
    MERGE (cfpb:Config:AuthorType {author_type: "personal_blog"})
    SET cfpb.weight=0.6

    MERGE (cfp:Config:AuthorType {author_type: "practitioner"})
    SET cfp.weight=0.8

    MERGE (cfa:Config:AuthorType {author_type: "academic"})
    SET cfa.weight=1.0
    
    MERGE (cfpo:Config:ThematicWeight {thematic_weight: "personal_opinion"})
    SET cfpo.weight=0.4

    MERGE (cfaj:Config:ThematicWeight {thematic_weight: "academic_journal"})
    SET cfaj.weight=0.6

    MERGE (cfc:Config:ThematicWeight {thematic_weight: "critique"})
    SET cfc.weight=0.8

    MERGE (cfph:Config:ThematicWeight {thematic_weight: "philosophy"})
    SET cfph.weight=1.0
    
    MERGE (cfl:Config:ImpactScale {impact_scale: "local"})
    SET cfl.weight=0.6

    MERGE (cfin:Config:ImpactScale {impact_scale: "international"})
    SET cfin.weight=0.8

    MERGE (cfw:Config:ImpactScale {impact_scale: "worldwide"})
    SET cfw.weight=1.0
    
    MERGE (cfd:Config:DurationRule {a: -8, b: 12, c: gds.util.infinity(), d: gds.util.infinity()})
    
    MERGE (cf:Config:StudentTarget {target_score: 0.7})
    
    WITH cf
    
    MERGE (b:Batch {batch_id: "2025/2026"})-[:USES]->(cf)
    
    MERGE (:Config:EventWeight {speaker_degree_weight: 0.5, scale_weight: 0.3, duration_weight: 0.2})
    
    MERGE (:Config:RecommendationWeight {need_weight: 0.7, interest_weight: 0.3})
    
    MERGE (:Config:BookVideoWeight {author_type_weight: 0.5, impact_scale_weight: 0.3, thematic_weight_weight: 0.2})
    
    MERGE (cf:Config:AddScoreConstant)
    set cf.weight=1.0
    """
    
    await Neo4jConnection.query(query)
    
async def create_vector_embedding(model_name):
    prefix=""
    if "e5" in model_name.lower():
        prefix = "passage: "
    clean_property_name = f"embedding_{re.sub(r'[^a-zA-Z0-9_]', '_', model_name)}"
    model = SentenceTransformer(model_name)
    query = """
    MATCH (r:UniResource)-[]->(t:Topic)
    RETURN r.resource_id AS resource_id, 
           r.title AS title, 
           r.description AS description, 
           apoc.text.join(collect(t.name), ", ") AS topics
    """
    resources = await Neo4jConnection.query(query)
    text_batch = []
    for resource in resources:
        body_text = textwrap.dedent(f"""\
            Title: {resource['title']}
            Description: {resource['description']}
            Topics: {resource['topics']}""").strip()
        structured_text = f"{prefix}{body_text}"
        text_batch.append(structured_text)

    print(f"Generating embeddings for {len(text_batch)} resources...")
    embeddings = model.encode(text_batch).tolist()
    payload = []
    for idx, resource in enumerate(resources):
        payload.append({
            "resource_id": resource['resource_id'],
            "embedding": embeddings[idx]
        })
        
    write_query = f"""
    UNWIND $resources as resource
    MATCH (r:UniResource {{resource_id: resource.resource_id}})
    CALL db.create.setNodeVectorProperty(r, '{clean_property_name}', resource.embedding)
    """
    await Neo4jConnection.query(write_query, {"resources": payload})
    print(f"Successfully updated embeddings using property key: {clean_property_name}")
    embedding_dim = model.get_sentence_embedding_dimension()
    index_query = f"""
    CREATE VECTOR INDEX resource_{clean_property_name} IF NOT EXISTS
        FOR (r:UniResource) ON (r.{clean_property_name})
        OPTIONS {{
        indexConfig: {{
            `vector.dimensions`: {embedding_dim}
        }}
        }};
    """
    await Neo4jConnection.query(index_query)
    
async def translate_to_english(id_text):
    try:
        en_text = await asyncio.to_thread(
            GoogleTranslator(target='en').translate, 
            id_text
        )
        return en_text
    except:
        return ""
    
    
async def get_q_code(keyword):
    headers = {
        "Authorization": f"Bearer {os.getenv('WIKIDATA_ACCESS_TOKEN')}",
        "User-Agent": "SurabayaEventRecommender/1.0 (student.thesis@example.com)",
        "Content-Type": "application/json"
    }
    params = {
        "q": keyword,
        "limit": 1,
        "language": "en"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://www.wikidata.org/w/rest.php/wikibase/v1/search/items", 
                headers=headers, 
                params=params, 
                timeout=10.0
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get('results'):
                first_result = result['results'][0]
                q_code = first_result.get('id')
                label = first_result.get('display-label', {}).get('value', 'No Label')
                description = first_result.get('description', {}).get('value', 'No Description')
                
                return q_code, label, description
            
            return None, None, None
            
        except httpx.HTTPStatusError as err:
            print(f"HTTP Error: {err}")
            print(f"Response Body: {err.response.text}")
            return None, None, None
        except Exception as e:
            print(f"A general error occurred in get_q_code: {e}")
            return None, None, None
        
async def get_noun_phrases(sentence, additional_stop_words):
    doc = nlp(sentence)
    result = []

    for chunk in doc.noun_chunks:
        is_all_stop_words = all(
            (token.text.lower() in additional_stop_words or token.is_stop) 
            for token in chunk
        )
        if not is_all_stop_words:
            lemmas = [token.lemma_.lower() for token in chunk]
            raw_phrase = " ".join(lemmas)
            clean_phrase = re.sub(r'\s*-\s*', '-', raw_phrase)
            result.append(clean_phrase)
            
    return result

async def get_wikidata_noun(sentence, additional_stop_words):
    doc=nlp(sentence)
    result = []
    for entity in doc._.linkedEntities:
        span_text = entity.get_span().text
        if span_text not in additional_stop_words:
            q_id = f"Q{entity.get_id()}"
            print(f"Linked: {span_text} -> {q_id} ({entity.get_description()})")
            result.append(q_id)
            
    return result
    
        
async def get_label_description(q_code):
    headers = {
        "Authorization": f"Bearer {os.getenv('WIKIDATA_ACCESS_TOKEN')}",
        "User-Agent": "SurabayaEventRecommender/1.0 (student.thesis@example.com)",
        "Content-Type": "application/json"
    }
    params = {
        "_fields": "labels,descriptions"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"https://www.wikidata.org/w/rest.php/wikibase/v1/entities/items/{q_code}", 
                headers=headers, 
                params=params, 
                timeout=10.0
            )
            response.raise_for_status()
            result = response.json()
            label = result.get('labels', {}).get('en', 'No English Label')
            description = result.get('descriptions', {}).get('en', 'No English Description')
            
            return label, description 
            
        except httpx.HTTPStatusError as err:
            print(f"HTTP Error: {err}")
            print(f"Response Body: {err.response.text}")
            return None, None
        except Exception as e:
            print(f"A general error occurred in get_label_description: {e}")
            return None, None
    
async def seed_topic_wikidata_id():
    query = """
    MATCH (t:Topic)
    RETURN t.name as name
    """
    result = await Neo4jConnection.query(query)
    topics = [topic['name'] for topic in result]
    
    for topic in topics:
        print(f"Processing topic {topic}...")
        topic_en = await translate_to_english(topic)
        print(f"Translated to {topic_en}")
        q_code, label, description = await get_q_code(topic_en)
        if not q_code:
            print(f"Could not find Wikidata entry for {topic_en}. Skipping.")
            continue
            
        print(f"QCode: {q_code} | Label: {label}")
        
        auto_mapping_query = """
        MATCH (t:Topic {name: $name})
        MERGE (w:WikidataLabel {wikidata_id: $id})
        SET w.name = $label
        SET w.description = $description
        MERGE (t)-[:LINKED_TO]->(w)
        """
        params = {"name": topic, "id": q_code, "label": label, "description": description}
        await Neo4jConnection.query(auto_mapping_query, params)
        
    manual_mapping = {
        "Pengembangan Diri": ["Q10998095"],
        "Keragaman & Perbedaan": ["Q1230584"],
        "Ekonomi & Bisnis": ["Q8134", "Q4830453"],
        "Teologi & Filosofi": ["Q34178", "Q5891"],
        "Keterampilan Non-Teknis": ["Q15910354"]
    }
    
    print("\n--- Starting Manual Override Mapping ---")
    
    for key, mappings in manual_mapping.items():
        delete_query = """
        MATCH (t:Topic)
        WHERE t.name = $topic_name
        OPTIONAL MATCH (t)-[r:LINKED_TO]->(d:WikidataLabel)
        DELETE r, d
        """
        
        await Neo4jConnection.query(delete_query, {"topic_name": key})
        
        for mapping in mappings:
            label, description = await get_label_description(mapping)
            
            if not label:
                print(f"Skipping manual map {mapping} for {key} due to API failure.")
                continue
                
            manual_query = """
            MATCH (t:Topic)
            WHERE t.name = $topic_name
            MERGE (w:WikidataLabel {wikidata_id: $q_code})
            SET w.name = $label
            SET w.description = $description
            MERGE (t)-[:LINKED_TO]->(w)
            """ 
            await Neo4jConnection.query(manual_query, {
                "topic_name": key, 
                "q_code": mapping, 
                "label": label, 
                "description": description
            })
        
        
async def try_link_to_wordnet(topic_name, phrase_candidate):
    
    query = """
    MATCH (t:Topic {name: $topic_name})
    MATCH (w:ns2__LexicalEntry)
    WHERE lower(w.lemma) = $phrase
    MERGE (t)-[:LINKED_TO]->(w)
    RETURN w.lemma AS matched_lemma
    """
    params = {
        "topic_name": topic_name, 
        "phrase": phrase_candidate,
    }
    
    result = await Neo4jConnection.query(query, params)
    return len(result) > 0

async def seed_topic_wordnet():
    query = """
    MATCH (t:Topic)
    RETURN t.name as name
    """
    result = await Neo4jConnection.query(query)
    topics = [topic['name'] for topic in result]
    
    for topic in topics:
        print(f"Processing topic {topic}...")
        topic_en = await translate_to_english(topic)
        print(f"Translated to {topic_en}")
        noun_phrases = await get_noun_phrases(topic_en, additional_stop_words)
        for phrase in noun_phrases:
            words = phrase.split()
            match_found = False
            
            while len(words) > 0:
                candidate = " ".join(words)
                print(f"  Trying WordNet match for: '{candidate}'")
                
                is_matched = await try_link_to_wordnet(topic, candidate)
                
                if is_matched:
                    print(f"  ✅ Match found and linked: '{candidate}'")
                    match_found = True
                    break

                dropped_word = words.pop()
                print(f"  ❌ No match. Dropping '{dropped_word}'...")
            
            if not match_found:
                print(f"  ⚠️ Could not map any part of '{phrase}' to WordNet.")
        
    manual_mapping = {
        "Pengembangan Diri": ["self-improvement"],
        "Integrasi Iman Ilmu": None,
        "Keterampilan Non-Teknis": None
    }
    
    print("\n--- Starting Manual Override Mapping ---")
    
    for key, mappings in manual_mapping.items():
        delete_query = """
        MATCH (t:Topic)
        WHERE t.name = $topic_name
        OPTIONAL MATCH (t)-[r:LINKED_TO]->(d:ns2__LexicalEntry)
        DELETE r
        """
        
        await Neo4jConnection.query(delete_query, {"topic_name": key})
        if mappings is not None:
            for phrase in mappings:
                words = phrase.split()
                match_found = False
                
                while len(words) > 0:
                    candidate = " ".join(words)
                    print(f"  Trying WordNet match for: '{candidate}'")
                    
                    is_matched = await try_link_to_wordnet(key, candidate)
                    
                    if is_matched:
                        print(f"  ✅ Match found and linked: '{candidate}'")
                        match_found = True
                        break

                    dropped_word = words.pop()
                    print(f"  ❌ No match. Dropping '{dropped_word}'...")
                
                if not match_found:
                    print(f"  ⚠️ Could not map any part of '{phrase}' to WordNet.")

async def seed_resource_eng_description():
    query = """
    MATCH (r:UniResource)
    RETURN r.resource_id as resource_id, r.title || " " || COALESCE(r.description, "") as resource_text
    """
    
    resources = await Neo4jConnection.query(query)
    print(resources)
    for resource in resources:
        resource_text = resource['resource_text'].strip()
        resource_text = await translate_to_english(resource_text)
        resource['resource_text'] = resource_text
    
    query = """
    UNWIND $resources as resource
    MATCH (r:UniResource {resource_id: resource.resource_id})
    SET r.eng_text = resource.resource_text
    """
    
    params = {"resources": resources}
    await Neo4jConnection.query(query, params)
    
    
async def link_wordnet(resource_id, noun_phrases, method):
    for phrase in noun_phrases:
        words = phrase.split()
        match_found = False
        
        while len(words) > 0:
            candidate = " ".join(words)
            print(f"  Trying WordNet match for: '{candidate}'")
            
            query = """
            MATCH (r:UniResource {resource_id: $resource_id})
            MATCH (w:ns2__LexicalEntry)
            WHERE lower(w.lemma) = $phrase AND w.partOfSpeech = "Noun"
            MERGE (r)-[rl:LINKED_TO {method: $method}]->(w)
            RETURN w.lemma AS matched_lemma
            """
            params = {
                "resource_id": resource_id, 
                "phrase": candidate,
                "method":method
            }
            
            result = await Neo4jConnection.query(query, params)
            is_matched = len(result) > 0
            
            if is_matched:
                print(f"  ✅ Match found and linked: '{candidate}'")
                match_found = True
                break

            dropped_word = words.pop()
            print(f"  ❌ No match. Dropping '{dropped_word}'...")
        
        if not match_found:
            print(f"  ⚠️ Could not map any part of '{phrase}' to WordNet.")
    
async def seed_resource_words(additional_stop_words):
    print("Starting seed...")
    query = """
    MATCH (r:UniResource)
    RETURN r.resource_id as resource_id, r.title as resource_title, r.eng_text as english_text
    """
    resources = await Neo4jConnection.query(query)
    
    for resource in resources:
        doc = nlp(resource['english_text'])
        resource["nouns"] = []
        resource["entities"] = []
        # resource['keybert'] = []
    
        # using noun
        for chunk in doc.noun_chunks:
            root = chunk.root
            if root.pos_ in ("PRON", "DET"):
                continue
            lemma = root.lemma_.lower()
            if lemma not in additional_stop_words and lemma not in resource["nouns"]:
                resource["nouns"].append(lemma)
                
        # using wikidata method
        for entity in doc._.linkedEntities:
            span_text = entity.get_span().text
            if span_text.lower() not in additional_stop_words and span_text.lower() not in resource['entities']:
                resource["entities"].append(span_text.lower())
        
        print("title:", resource['resource_title'])
        print("nouns:", resource['nouns'])
        print("entities:", resource['entities'])
        # using keybert method
        # keywords_tuple = kw_model.extract_keywords(resource['english_text'], keyphrase_ngram_range=(1, 2), stop_words=additional_stop_words)
        # keywords = [keyword_tuple[0] for keyword_tuple in keywords_tuple]
        # resource['keybert'].extend(keywords)
        
        await link_wordnet(resource['resource_id'], resource['nouns'], "noun_wordnet")
        await link_wordnet(resource['resource_id'], resource['entities'], "entity_wordnet")
        # await link_wordnet(resource['resource_id'], resource['keybert'], "keybert_wordnet")
        
    
        # query = """
        # MATCH (r:UniResource {resource_id: $resource_id})
        # UNWIND $nouns as noun
        # OPTIONAL MATCH (n:ns2__LexicalEntry) WHERE lower(n.lemma) = lower(noun)
        # MERGE (r)-[:LINKED_TO]->(n)
        
        # WITH r
        # UNWIND $entities as entity
        # OPTIONAL MATCH (e:ns2__LexicalEntry) WHERE lower(e.lemma) = lower(entity)
        # MERGE (r)-[:LINKED_TO]->(e)
        # """
        
        # await Neo4jConnection.query(query)

async def link_wikidata(resource_id, entities):
    headers = {
        "Authorization": f"Bearer {os.getenv('WIKIDATA_ACCESS_TOKEN')}",
        "User-Agent": "SurabayaEventRecommender/1.0 (student.thesis@example.com)",
        "Content-Type": "application/json"
    }

    
    for entity in entities:
        async with httpx.AsyncClient() as client:
            try:
                params = {
                    "q": keyword,
                    "limit": 1,
                    "language": "en"
                }
                response = await client.get(
                    "https://www.wikidata.org/w/rest.php/wikibase/v1/search/items", 
                    headers=headers, 
                    params=params, 
                    timeout=10.0
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get('results'):
                    first_result = result['results'][0]
                    q_code = first_result.get('id')
                    label = first_result.get('display-label', {}).get('value', 'No Label')
                    description = first_result.get('description', {}).get('value', 'No Description')
                    
                    return q_code, label, description
                
                return None, None, None
                
            except httpx.HTTPStatusError as err:
                print(f"HTTP Error: {err}")
                print(f"Response Body: {err.response.text}")
                return None, None, None
            except Exception as e:
                print(f"A general error occurred in get_q_code: {e}")
                return None, None, None
    
        
async def seed_resource_wikidata(additional_stop_words):
    query = """
    MATCH (r:UniResource)
    RETURN r.resource_id as resource_id, r.eng_text as english_text
    """
    resources = await Neo4jConnection.query(query)
    
    for resource in resources:
        doc = nlp(resource['english_text'])
        resource["entities"] = []
                
        # using wikidata method
        for entity in doc._.linkedEntities:
            span_text = entity.get_span().text
            if span_text.lower() not in additional_stop_words:
                q_id = f"Q{entity.get_id()}"
                print(f"Linked: {span_text} -> {q_id} ({entity.get_description()})")
                resource["entities"].append(q_id)
        await link_wikidata(resource['resource_id'], resource['entities'])
        
    
        
    
    

    
# async def seed_wordnet_similarity():
#     query = """
#     MATCH (r:UniResource)-[]->(w:ns2__LexicalEntry)
    
#     RETURN r.resource_id as resource_id, r.title || " " || r.description as resource_text
#     """
    
#     result = await Neo4jConnection.query(query)
    
#     for resource in result:
#         resource_text = resource['resource_text']
#         resource_text = await translate_to_english(resource_text)
#         noun_phrases = await get_wikidata_noun(resource_text, additional_stop_words)
        
#         print("Resource text:", resource_text)
#         print("Noun phrases:", noun_phrases)
        
        
async def run_all_seeders():
    # print("Seeding Batch Year and Versions...")
    # await seed_years_and_versions()
    
    # print("Seeding Students...")
    # await seed_students("data/demografi.parquet")
    
    # print("Seeding Curriculum...")
    # await seed_curriculum("data/curriculum.parquet")
    
    # print("Seeding Configuration...")
    # await seed_configs()
    
    # print("Seeding Student Questions Relations...")
    # await seed_student_questions_relation("data/hasil_survei.parquet")
    
    # print("Seeding Student Topics Relations...")
    # await seed_student_topics_relation("data/hasil_topik.parquet")
    
    # print("Seeding Resource Embedding (all-MiniLM-L6-v2)...")
    # await create_vector_embedding("all-MiniLM-L6-v2")
    
    # print("Seeding Resource Embedding (BAAI/bge-m3)...")
    # await create_vector_embedding("BAAI/bge-m3")
    
    print("Seeding Resource Embedding (LazarusNLP/all-indo-e5-small-v4)...")
    await create_vector_embedding("LazarusNLP/all-indo-e5-small-v4")
    
    # print("Seeding Wikidata from Topic...")
    # await seed_topic_wikidata_id()
    
    # print("Seeding Wordnet from Topic...")
    # await seed_topic_wordnet()
    
    # print("Seeding Resource English Description...")
    # await seed_resource_eng_description()
        
    # await seed_resource_words(additional_stop_words)
    
    print("All seeding complete!")
    
    
if __name__ == "__main__":
    import asyncio
    asyncio.run(run_all_seeders())
    
    