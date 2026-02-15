from backend.database import Neo4jConnection

async def quality_exists(quality_id: str):
    query = """
    MATCH (q: Quality {quality_id: $quality_id})
    RETURN count(q) > 0 as exists
    """
    params = {"quality_id": quality_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False