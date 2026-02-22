from backend.database import Neo4jConnection

async def subcpl_exists(sub_cpl_id: str):
    query = """
    MATCH (s: SubCpl {sub_cpl_id: $sub_cpl_id})
    RETURN count(s) > 0 as exists
    """
    params = {"sub_cpl_id": sub_cpl_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False

