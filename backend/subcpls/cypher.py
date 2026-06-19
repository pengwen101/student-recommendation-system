from backend.database import Neo4jConnection

async def subcpl_exists(sub_cpl_id: str):
    query = """
    MATCH (s: SubCpl {sub_cpl_id: $sub_cpl_id})
    RETURN count(s) > 0 as exists
    """
    params = {"sub_cpl_id": sub_cpl_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False

async def read_subcpl_indicators(version_id: str):
    query = """
    MATCH (:CurriculumVersion {curriculum_version_id: $version_id})-[]->(:Cpl)-[]->(s:SubCpl)
    RETURN s.sub_cpl_id as sub_cpl_id, 
           s.code as code,
           s.name as name,
           [(i)<-[ri:HAS_INDICATOR]-(q)<-[rq:HAS_QUALITY]-(s) | {
                indicator_id: i.indicator_id,
                code: i.code,
                name: i.name, 
                weight: rq.weight
           }] as indicators
    ORDER BY s.code ASC
    """
    response = await Neo4jConnection.query(query, {"version_id": version_id})
    return response

async def update_subcpl(sub_cpl_id: str, data: dict):
    query = """
    MATCH (sc:SubCpl {sub_cpl_id: $sub_cpl_id})
    SET sc.code = $code, sc.name = $name
    WITH sc
    OPTIONAL MATCH (sc)<-[old_r:HAS_SUB_CPL]-(:Cpl)
    DELETE old_r
    WITH sc
    MATCH (c:Cpl {cpl_id: $cpl_id})
    MERGE (c)-[:HAS_SUB_CPL]->(sc)
    """
    await Neo4jConnection.query(query, {
        "sub_cpl_id": sub_cpl_id,
        "code": data["code"],
        "name": data["name"],
        "cpl_id": data["cpl_id"],
    })


async def read_subcpl_details_with_parent(sub_cpl_id: str):
    query = """
    MATCH (sc:SubCpl {sub_cpl_id: $sub_cpl_id})
    OPTIONAL MATCH (c:Cpl)-[:HAS_SUB_CPL]->(sc)
    RETURN sc.sub_cpl_id AS sub_cpl_id,
           sc.code AS code,
           sc.name AS name,
           c.cpl_id AS cpl_id,
           c.code AS cpl_code,
           c.name AS cpl_name
    """
    response = await Neo4jConnection.query(query, {"sub_cpl_id": sub_cpl_id})
    return response[0] if response else None


