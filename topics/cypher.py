from backend.database import Neo4jConnection

async def topic_exists(topic_id: str):
    query = """
    MATCH (t: Topic {topic_id: $topic_id})
    RETURN count(t) > 0 as exists
    """
    params = {"topic_id": topic_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False