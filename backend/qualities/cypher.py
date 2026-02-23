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
           q.code as code,
           q.name as name,
           [(q)<-[r:HAS_QUALITY]-(s:SubCpl) | {
                sub_cpl_id: s.sub_cpl_id,
                code: s.code,
                name: s.name, 
                weight: CASE 
                            WHEN r.weight IS NULL THEN 1.0 
                            WHEN isNaN(toFloat(r.weight)) THEN 1.0 
                            ELSE toFloat(r.weight) 
                        END
           }] as subcpls
    """
    response = await Neo4jConnection.query(query)
    return response


async def read_quality_details(quality_id: str):
    query = """
    MATCH (q:Quality {quality_id: $quality_id})
    RETURN q.quality_id as quality_id, 
           q.code as code,
           q.name as name,
           [(q)<-[r:HAS_QUALITY]-(s:SubCpl) | {
                sub_cpl_id: s.sub_cpl_id,
                code: s.code,
                name: s.name, 
                weight: CASE 
                            WHEN r.weight IS NULL THEN 1.0 
                            WHEN isNaN(toFloat(r.weight)) THEN 1.0 
                            ELSE toFloat(r.weight) 
                        END
           }] as subcpls
    """
    params = {"quality_id": quality_id}
    response = await Neo4jConnection.query(query, params)
    return response[0] if response else None

async def create_quality(quality_id: str, data: dict):
    query = """
    MERGE (q:Quality {quality_id: $quality_id})
    SET q.name = $name, q.code = $code
    WITH q
    UNWIND $subcpls as subcpl
    MATCH (s:SubCpl {sub_cpl_id: subcpl.sub_cpl_id})
    MERGE (s)-[r:HAS_QUALITY]->(q)
    SET r.weight = subcpl.weight
    """
    
    params = {"quality_id": quality_id, "name": data['name'], "code": data['code'], "subcpls": data['subcpls']}
    await Neo4jConnection.query(query, params)

async def update_quality(quality_id: str, data: dict):
    
    query = """
    MATCH (q:Quality {quality_id: $quality_id})
    SET q.name = $name, q.code = $code
    WITH q
    OPTIONAL MATCH (q)<-[old_r:HAS_QUALITY]-(:SubCPL)
    DELETE old_r
    WITH q
    UNWIND $subcpls as subcpl
    MATCH (s:SubCpl {sub_cpl_id: subcpl.sub_cpl_id})
    MERGE (s)-[r:HAS_QUALITY]->(q)
    SET r.weight = subcpl.weight
    """
    
    params = {"quality_id": quality_id, "name": data['name'], "code": data['code'], "subcpls": data['subcpls']}
    await Neo4jConnection.query(query, params)


async def delete_quality(quality_id: str):
    
    query = """
    MATCH (q:Quality {quality_id: $quality_id})
    DETACH DELETE q
    """
    
    params = {"quality_id": quality_id}
    await Neo4jConnection.query(query, params)
