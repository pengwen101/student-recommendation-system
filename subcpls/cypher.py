from backend.database import Neo4jConnection

async def subcpl_exists(subcpl_id: str):
    query = """
    MATCH (s: SubCPL {sub_cpl_id: $subcpl_id})
    RETURN count(s) > 0 as exists
    """
    params = {"subcpl_id": subcpl_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False

