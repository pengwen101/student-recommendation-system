from backend.database import Neo4jConnection

async def topic_exists(topic_id: str):
    query = """
    MATCH (t: Topic {topic_id: $topic_id})
    RETURN count(t) > 0 as exists
    """
    params = {"topic_id": topic_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False


async def read_topics():
    query = """
    MATCH (t:Topic)
    WHERE labels(t) = ['Topic']
    RETURN t.topic_id as topic_id, 
           t.code as code,
           t.name as name
    """
    response = await Neo4jConnection.query(query)
    return response


async def read_topic_details(topic_id: str):
    query = """
    MATCH (t:Topic {topic_id: $topic_id})
    RETURN t.topic_id as topic_id, 
           t.code as code,
           t.name as name
    """
    params = {"topic_id": topic_id}
    response = await Neo4jConnection.query(query, params)
    return response[0] if response else None

async def create_topic(topic_id: str, data: dict):
    query = """
    MERGE (t:Topic {topic_id: $topic_id})
    SET t.name = $name, t.code = $code, t.lower_name = lower($name)
    """
    
    params = {"topic_id": topic_id, "name": data['name'], "code": data['code']}
    await Neo4jConnection.query(query, params)


async def create_custom_topic(topic_id: str, data: dict):
    query = """
    MERGE (t:Topic:CustomTopic {topic_id: $topic_id})
    SET t.name = $name, t.code = 'custom', t.lower_name = lower($name)
    """
    
    params = {"topic_id": topic_id, "name": data['name']}
    await Neo4jConnection.query(query, params)

async def update_topic(topic_id: str, data: dict):
    
    query = """
    MATCH (t:Topic {topic_id: $topic_id})
    SET t.name = $name, t.code = $code, t.lower_name = lower($name)
    """
    
    params = {"topic_id": topic_id, "name": data['name'], "code": data['code']}
    await Neo4jConnection.query(query, params)


async def delete_topic(topic_id: str):
    
    query = """
    MATCH (t:Topic {topic_id: $topic_id})
    DETACH DELETE t
    """
    
    params = {"topic_id": topic_id}
    await Neo4jConnection.query(query, params)
    
    
async def get_valid_noun_lemmas(noun_phrases: list[str]) -> list[str]:
    all_candidates = set()
    for phrase in noun_phrases:
        words = phrase.split()
        for i in range(len(words)):
            for j in range(i + 1, len(words) + 1):
                all_candidates.add(" ".join(words[i:j]).lower())
                
    if not all_candidates:
        return []
    query = """
    UNWIND $candidates AS candidate
    MATCH (w:ns2__LexicalEntry)
    WHERE w.lower_lemma = candidate AND w.partOfSpeech = "Noun"
    RETURN DISTINCT w.lower_lemma AS lower_lemma, w.lemma AS exact_lemma
    """
    result = await Neo4jConnection.query(query, {"candidates": list(all_candidates)})
    valid_dict = {row["lower_lemma"]: row["exact_lemma"] for row in result} if result else {}
    
    valid_lemmas = []
    for phrase in noun_phrases:
        words = phrase.split()
        start_idx = 0
        while start_idx < len(words):
            match_found = False
            for end_idx in range(len(words), start_idx, -1):
                candidate = " ".join(words[start_idx:end_idx]).lower()
                if candidate in valid_dict:
                    valid_lemmas.append(valid_dict[candidate])
                    start_idx = end_idx
                    match_found = True
                    break
                    
            if not match_found:
                start_idx += 1
                
    return valid_lemmas