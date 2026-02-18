from backend.database import Neo4jConnection

async def quality_exists(quality_id: str):
    query = """
    MATCH (q: Quality {quality_id: $quality_id})
    RETURN count(q) > 0 as exists
    """
    params = {"quality_id": quality_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False

async def read_qualities():
    query = """
    MATCH (q:Quality)
    RETURN q.quality_id as quality_id, 
           q.description as quality_description,
           [(q)<-[r:HAS_QUALITY]-(s:SubCPL) | {
                subcpl_id: s.sub_cpl_id,
                subcpl_description: s.description, 
                weight: coalesce(toFloat(r.weight), 1.0)
           }] as subcpls
    """
    response = await Neo4jConnection.query(query)
    return response


async def read_quality_details(quality_id: str):
    query = """
    MATCH (q:Quality {quality_id: $quality_id})
    RETURN q.quality_id as quality_id, 
           q.description as quality_description,
           [(q)<-[r:HAS_QUALITY]-(s:SubCPL) | {
                subcpl_id: s.sub_cpl_id,
                subcpl_description: s.description, 
                weight: coalesce(toFloat(r.weight), 1.0)
           }] as subcpls
    """
    params = {"quality_id": quality_id}
    response = await Neo4jConnection.query(query, params)
    return response[0] if response else None

async def create_quality(quality_id: str, data: dict):
    query = """
    MERGE (q:Quality {quality_id: $quality_id})
    SET q.description = $quality_description
    WITH q
    UNWIND $subcpls as subcpl
    MATCH (s:SubCPL {sub_cpl_id: subcpl.subcpl_id})
    MERGE (s)-[r:HAS_QUALITY]->(q)
    SET r.weight = subcpl.weight
    """
    
    params = {"quality_id": quality_id, "quality_description": data['quality_description'], "subcpls": data['subcpls']}
    await Neo4jConnection.query(query, params)

async def update_quality(quality_id: str, data: dict):
    
    query = """
    MATCH (q:Quality {quality_id: $quality_id})
    SET q.description = $quality_description
    WITH q
    OPTIONAL MATCH (q)<-[old_r:HAS_QUALITY]-(:SubCPL)
    DELETE old_r
    WITH q
    UNWIND $subcpls as subcpl
    MATCH (s:SubCPL {sub_cpl_id: subcpl.subcpl_id})
    MERGE (s)-[r:HAS_QUALITY]->(q)
    SET r.weight = subcpl.weight
    """
    
    params = {"quality_id": quality_id, "quality_description": data['quality_description'], "subcpls": data['subcpls']}
    await Neo4jConnection.query(query, params)
