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
    SET t.name = $name, t.code = $code
    """
    
    params = {"topic_id": topic_id, "name": data['name'], "code": data['code']}
    await Neo4jConnection.query(query, params)

async def update_topic(topic_id: str, data: dict):
    
    query = """
    MATCH (t:Topic {topic_id: $topic_id})
    SET t.name = $name, t.code = $code
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
