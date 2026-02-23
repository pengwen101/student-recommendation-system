from backend.database import Neo4jConnection

async def resource_exists(resource_id: str):
    query = """
    MATCH (r: Resource {resource_id: $resource_id})
    RETURN count(r) > 0 as exists
    """
    params = {"resource_id": resource_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False

async def read_resources():
    query = """
    MATCH (r:Resource)
    RETURN r.resource_id as resource_id, 
           r.type as type,
           r.name as name,
           r.description as description,
           r.start_datetime as start_datetime,
           r.end_datetime as end_datetime,
           r.status as status,
           r.is_active as is_active,
           [(r)-[rt1:TARGETS]->(s:SubCpl) | {
               sub_cpl_id: s.sub_cpl_id,
               code: s.code,
               name: s.name,
               weight: toFloat(rt1.weight),
               qualities: [(r)-[rt2:TARGETS {sub_cpl_id: s.sub_cpl_id}]->(q:Quality) | {
                   quality_id: q.quality_id,
                   code: q.code,
                   name: q.name,
                   weight: toFloat(rt2.weight)
               }]
           }] as subcpls,
           [(r)-[rc:COVERS]->(t:Topic) | {
               topic_id: t.topic_id, 
               code: t.code,
               name: t.name, 
               weight: toFloat(rc.weight)
           }] as topics,
           [(r)-[rs:SUPPORTS]->(q:Quality) | {
               quality_id: q.quality_id,
               code: q.code,
               name: q.name, 
               weight: toFloat(rs.weight)
           }] as calculated_qualities
    """
    response = await Neo4jConnection.query(query)
    return response


async def read_resource_details(resource_id: str):
    query = """
    MATCH (r:Resource {resource_id: $resource_id})
    RETURN r.resource_id as resource_id, 
           r.name as name,
           r.type as type,
           r.name as name,
           r.description as description,
           r.start_datetime as start_datetime,
           r.end_datetime as end_datetime,
           r.status as status,
           r.is_active as is_active,
           [(r)-[rt1:TARGETS]->(s:SubCpl) | {
               sub_cpl_id: s.sub_cpl_id,
               code: s.code,
               name: s.name,
               weight: toFloat(rt1.weight),
               qualities: [(r)-[rt2:TARGETS {sub_cpl_id: s.sub_cpl_id}]->(q:Quality) | {
                   quality_id: q.quality_id,
                   code: q.code,
                   name: q.name,
                   weight: toFloat(rt2.weight)
               }]
           }] as subcpls,
           [(r)-[rc:COVERS]->(t:Topic) | {
               topic_id: t.topic_id, 
               code: t.code,
               name: t.name, 
               weight: toFloat(rc.weight)
           }] as topics,
           [(r)-[rs:SUPPORTS]->(q:Quality) | {
               quality_id: q.quality_id,
               code: q.code,
               name: q.name, 
               weight: toFloat(rs.weight)
           }] as calculated_qualities
    """
    params = {"resource_id": resource_id}
    response = await Neo4jConnection.query(query, params)
    return response[0] if response else None

async def create_resource(resource_id: str, data: dict):
    query = """
    MERGE (r:Resource {resource_id: $resource_id})
    SET r.name = $name,
        r.type = $type,
        r.description = $description,
        r.start_datetime = $start_datetime,
        r.end_datetime = $end_datetime,
        r.status = $status,
        r.is_active = true
    WITH r
    UNWIND $topics as topic
    MATCH (t:Topic {topic_id: topic.topic_id})
    MERGE (r)-[rc:COVERS]->(t)
    SET rc.weight = topic.weight
    WITH DISTINCT r
    UNWIND $subcpls as subcpl
    MATCH (s:SubCpl {sub_cpl_id: subcpl.sub_cpl_id})
    MERGE (r)-[rt1:TARGETS]->(s)
    SET rt1.weight = subcpl.weight
    WITH r, s, rt1, subcpl.qualities AS qualities
    UNWIND qualities as quality
    MATCH (q:Quality {quality_id: quality.quality_id})
    MERGE (r)-[rt2:TARGETS {sub_cpl_id: subcpl.sub_cpl_id}]->(q)
    SET rt2.weight = quality.weight
    
    WITH DISTINCT r
    
    MATCH (r)-[rt1:TARGETS]->(s:SubCpl)
    MATCH (r)-[rt2:TARGETS {sub_cpl_id: s.sub_cpl_id}]->(q:Quality)
    MATCH (s)-[sq:HAS_QUALITY]->(q)
    
    WITH r, q, (rt1.weight * rt2.weight * 
                CASE 
                    WHEN sq.weight IS NULL THEN 1.0 
                    WHEN isNaN(toFloat(sq.weight)) THEN 1.0 
                    ELSE toFloat(sq.weight) 
                END) AS calculated_weight
    
    WITH r, q, max(calculated_weight) as calculated_weight
    
    MERGE (r)-[rs:SUPPORTS]->(q)
    SET rs.weight = calculated_weight
    """
    
    params = {"resource_id": resource_id, 
              "type": data['type'],
              "name": data['name'], 
              "description": data["description"],
              "start_datetime": data.get('start_datetime', None),
              "end_datetime": data.get('end_datetime', None),
              "status": data.get("status", None),
              "topics": data['topics'], "subcpls": data['subcpls']}
    await Neo4jConnection.query(query, params)

async def update_resource(resource_id: str, data: dict):
    
    query = """
    MATCH (r:Resource {resource_id: $resource_id})
    SET r.name = $name,
        r.type = $type,
        r.description = $description,
        r.start_datetime = $start_datetime,
        r.end_datetime = $end_datetime,
        r.status = $status
    WITH r
    OPTIONAL MATCH (r)-[old_rc:COVERS]->(:Topic)
    DELETE old_rc
    WITH r
    OPTIONAL MATCH (r)-[old_rs:SUPPORTS]->(:Quality)
    DELETE old_rs
    WITH r
    OPTIONAL MATCH (r)-[old_rt1:TARGETS]->(:SubCpl)
    DELETE old_rt1
    WITH r
    OPTIONAL MATCH (r)-[old_rt2:TARGETS]->(:Quality)
    DELETE old_rt2
    WITH r
    UNWIND $topics as topic
    MATCH (t:Topic {topic_id: topic.topic_id})
    MERGE (r)-[rc:COVERS]->(t)
    SET rc.weight = topic.weight
    WITH DISTINCT r
    UNWIND $subcpls as subcpl
    MATCH (s:SubCpl {sub_cpl_id: subcpl.sub_cpl_id})
    MERGE (r)-[rt1:TARGETS]->(s)
    SET rt1.weight = subcpl.weight
    WITH r, s, rt1, subcpl.qualities AS qualities
    UNWIND qualities as quality
    MATCH (q:Quality {quality_id: quality.quality_id})
    MERGE (r)-[rt2:TARGETS {sub_cpl_id: subcpl.sub_cpl_id}]->(q)
    SET rt2.weight = quality.weight
    
    WITH DISTINCT r
    
    MATCH (r)-[rt1:TARGETS]->(s:SubCpl)
    MATCH (r)-[rt2:TARGETS {sub_cpl_id: s.sub_cpl_id}]->(q:Quality)
    MATCH (s)-[sq:HAS_QUALITY]->(q)
    
    WITH r, q, (rt1.weight * rt2.weight * 
                CASE 
                    WHEN sq.weight IS NULL THEN 1.0 
                    WHEN isNaN(toFloat(sq.weight)) THEN 1.0 
                    ELSE toFloat(sq.weight) 
                END) AS calculated_weight
    
    WITH r, q, max(calculated_weight) as calculated_weight
    
    MERGE (r)-[rs:SUPPORTS]->(q)
    SET rs.weight = calculated_weight
    """
    
    params = {"resource_id": resource_id, 
              "type": data['type'],
              "name": data['name'], 
              "description": data["description"],
              "start_datetime": data.get('start_datetime', None),
              "end_datetime": data.get('end_datetime', None),
              "status": data.get("status", None),
              "topics": data['topics'], "subcpls": data['subcpls']}
    await Neo4jConnection.query(query, params)