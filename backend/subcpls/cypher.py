from backend.database import Neo4jConnection

async def subcpl_exists(sub_cpl_id: str):
    query = """
    MATCH (s: SubCpl {sub_cpl_id: $sub_cpl_id})
    RETURN count(s) > 0 as exists
    """
    params = {"sub_cpl_id": sub_cpl_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False

async def read_subcpls(version_id: str):
    query = """
    MATCH (:CurriculumVersion {curriculum_version_id: toInteger($version_id)})-[]->(:Cpl)-[]->(s:SubCpl)
    RETURN s.sub_cpl_id as sub_cpl_id, 
           s.code as code,
           s.name as name,
           [(q)<-[r:HAS_QUALITY]-(s:SubCpl) | {
                quality_id: q.quality_id,
                code: q.code,
                name: q.name, 
                weight: r.weight
           }] as qualities
    """
    response = await Neo4jConnection.query(query, {"version_id": version_id})
    return response

async def read_subcpl_indicators(version_id: str):
    query = """
    MATCH (:CurriculumVersion {curriculum_version_id: toInteger($version_id)})-[]->(:Cpl)-[]->(s:SubCpl)
    RETURN s.sub_cpl_id as sub_cpl_id, 
           s.code as code,
           s.name as name,
           [(i)<-[ri:HAS_INDICATOR]-(q)<-[rq:HAS_QUALITY]-(s:SubCpl) | {
                indicator_id: i.indicator_id,
                code: i.code,
                name: i.name, 
                weight: rq.weight
           }] as indicators
    """
    response = await Neo4jConnection.query(query, {"version_id": version_id})
    return response

async def read_subcpl_details(sub_cpl_id: str):
    query = """
    MATCH (s:SubCpl {sub_cpl_id: $sub_cpl_id})
    RETURN s.sub_cpl_id as sub_cpl_id, 
           s.code as code,
           s.name as name,
           [(q)<-[r:HAS_QUALITY]-(s:SubCpl) | {
                quality_id: q.quality_id,
                code: q.code,
                name: q.name, 
                weight: r.weight
           }] as qualities
    """
    params = {"sub_cpl_id": sub_cpl_id}
    response = await Neo4jConnection.query(query, params)
    return response[0] if response else None