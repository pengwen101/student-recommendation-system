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
           [(r)-[:HAS_SESSION]->(ss:Session) | {
               session_id: ss.session_id,
               start_datetime: ss.start_datetime,
               end_datetime: ss.end_datetime 
           }] as sessions,
           r.scale as scale,
           r.speaker_degree as speaker_degree,
           r.status as status,
           r.is_active as is_active,
           [(r)-[rt1:TARGETS]->(s:SubCpl) | {
               sub_cpl_id: s.sub_cpl_id,
               code: s.code,
               name: s.name,
               indicators: [(r)-[rt2:TARGETS {sub_cpl_id: s.sub_cpl_id}]->(i:Indicator) | {
                   indicator_id: i.indicator_id,
                   code: i.code,
                   name: i.name
               }]
           }] as subcpls,
           [(r)-[rc:COVERS]->(t:Topic) | {
               topic_id: t.topic_id, 
               code: t.code,
               name: t.name
           }] as topics,
           {
                indicators: [(r)-[rsi:SUPPORTS]->(i:Indicator) | {
                    indicator_id: i.indicator_id,
                    code: i.code,
                    name: i.name, 
                    weight: toFloat(rsi.weight)
                }],
                qualities: [(r)-[rsq:SUPPORTS]->(q:Quality) | {
                    quality_id: q.quality_id,
                    code: q.code,
                    name: q.name, 
                    weight: toFloat(rsq.weight)
                }],
                subcpls: [(r)-[rss:SUPPORTS]->(s:SubCpl) | {
                    sub_cpl_id: s.sub_cpl_id,
                    code: s.code,
                    name: s.name, 
                    weight: toFloat(rss.weight)
                }]
            } AS calculations
    """
    response = await Neo4jConnection.query(query)
    return response


async def read_resource_details(resource_id: str):
    query = """
    MATCH (r:Resource {resource_id: $resource_id})
    RETURN r.resource_id as resource_id, 
           r.name as name,
           r.type as type,
           r.description as description,
           [(r)-[:HAS_SESSION]->(ss:Session) | {
               session_id: ss.session_id,
               start_datetime: ss.start_datetime,
               end_datetime: ss.end_datetime 
           }] as sessions,
           r.scale as scale,
           r.speaker_degree as speaker_degree,
           r.status as status,
           r.is_active as is_active,
           [(r)-[rt1:TARGETS]->(s:SubCpl) | {
               sub_cpl_id: s.sub_cpl_id,
               code: s.code,
               name: s.name,
               indicators: [(r)-[rt2:TARGETS {sub_cpl_id: s.sub_cpl_id}]->(i:Indicator) | {
                   indicator_id: i.indicator_id,
                   code: i.code,
                   name: i.name
               }]
           }] as subcpls,
           [(r)-[rc:COVERS]->(t:Topic) | {
               topic_id: t.topic_id, 
               code: t.code,
               name: t.name
           }] as topics,
           {
                indicators: [(r)-[rsi:SUPPORTS]->(i:Indicator) | {
                    indicator_id: i.indicator_id,
                    code: i.code,
                    name: i.name, 
                    weight: toFloat(rsi.weight)
                }],
                qualities: [(r)-[rsq:SUPPORTS]->(q:Quality) | {
                    quality_id: q.quality_id,
                    code: q.code,
                    name: q.name, 
                    weight: toFloat(rsq.weight)
                }],
                subcpls: [(r)-[rss:SUPPORTS]->(s:SubCpl) | {
                    sub_cpl_id: s.sub_cpl_id,
                    code: s.code,
                    name: s.name, 
                    weight: toFloat(rss.weight)
                }]
            } AS calculations
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
        r.scale = $scale,
        r.speaker_degree = $speaker_degree,
        r.status = $status,
        r.is_active = true
    WITH r
    FOREACH (session IN $sessions |
        MERGE (r)-[hs:HAS_SESSION]->(ss:Session {session_id: session.session_id})
        SET ss.start_datetime = session.start_datetime, ss.end_datetime = session.end_datetime
    )
    
    WITH r
    CALL (r) {
        UNWIND $topics AS topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (r)-[rc:COVERS]->(t)
    }
 
    CALL (r) {
        WITH r
        UNWIND $subcpls AS subcpl
        MATCH (s:SubCpl {sub_cpl_id: subcpl.sub_cpl_id})
        MERGE (r)-[rt1:TARGETS]->(s)
        
        WITH r, s, subcpl
        UNWIND subcpl.indicators AS indicator
        MATCH (i:Indicator {indicator_id: indicator.indicator_id})
        MERGE (r)-[rt2:TARGETS {sub_cpl_id: subcpl.sub_cpl_id}]->(i)
    }
    """
    
    params = {"resource_id": resource_id, 
              "type": data['type'],
              "name": data['name'], 
              "description": data["description"],
              "scale": data.get('scale', None),
              "speaker_degree": data.get('speaker_degree', None),
              "sessions": data.get('sessions', []),
              "status": data.get("status", None),
              "topics": data['topics'], 
              "subcpls": data['subcpls']}
    await Neo4jConnection.query(query, params)
    await calculate_support_weights(resource_id)

async def update_resource(resource_id: str, data: dict):
    
    query = """
    MATCH (r:Resource {resource_id: $resource_id})
    SET r.name = $name,
        r.type = $type,
        r.description = $description,
        r.scale = $scale,
        r.speaker_degree = $speaker_degree,
        r.status = $status
    WITH r
    OPTIONAL MATCH (r)-[old_rc:COVERS]->(:Topic)
    DELETE old_rc
    WITH r
    OPTIONAL MATCH (r)-[old_rs:SUPPORTS]->(:Indicator)
    DELETE old_rs
    WITH r
    OPTIONAL MATCH (r)-[old_rt1:TARGETS]->(:SubCpl)
    DELETE old_rt1
    WITH r
    OPTIONAL MATCH (r)-[old_rt2:TARGETS]->(:Indicator)
    DELETE old_rt2
    WITH r
    OPTIONAL MATCH (r)-[old_hs:HAS_SESSION]->(:Session)
    DELETE old_hs
    WITH r
    FOREACH (session IN $sessions |
        MERGE (r)-[hs:HAS_SESSION]->(ss:Session {session_id: session.session_id})
        SET ss.start_datetime = session.start_datetime, ss.end_datetime = session.end_datetime
    )
    
    WITH r
    CALL (r) {
        UNWIND $topics AS topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (r)-[rc:COVERS]->(t)
    }
 
    CALL (r) {
        WITH r
        UNWIND $subcpls AS subcpl
        MATCH (s:SubCpl {sub_cpl_id: subcpl.sub_cpl_id})
        MERGE (r)-[rt1:TARGETS]->(s)
        
        WITH r, s, subcpl
        UNWIND subcpl.indicators AS indicator
        MATCH (i:Indicator {indicator_id: indicator.indicator_id})
        MERGE (r)-[rt2:TARGETS {sub_cpl_id: subcpl.sub_cpl_id}]->(i)
    }
    """
    
    params = {"resource_id": resource_id, 
              "type": data['type'],
              "name": data['name'], 
              "description": data["description"],
              "scale": data.get('scale', None),
              "speaker_degree": data.get('speaker_degree', None),
              "sessions": data.get('sessions', []),
              "status": data.get("status", None),
              "topics": data['topics'], 
              "subcpls": data['subcpls']}
    await Neo4jConnection.query(query, params)
    await calculate_support_weights(resource_id)

async def activate_resource(resource_id: str):
    query = """
    MATCH (r:Resource {resource_id: $resource_id})
    SET r.is_active = true
    """
    params = {"resource_id": resource_id}
    await Neo4jConnection.query(query, params)
    
async def archive_resource(resource_id: str):
    query = """
    MATCH (r:Resource {resource_id: $resource_id})
    SET r.is_active = false
    """
    params = {"resource_id": resource_id}
    await Neo4jConnection.query(query, params)

async def delete_resource(resource_id: str):
    query = """
    MATCH (r:Resource {resource_id: $resource_id})
    DETACH DELETE r
    """
    params = {"resource_id": resource_id}
    await Neo4jConnection.query(query, params)
    
async def calculate_support_weights(resource_id: str):
    query = """
    MATCH (r:Resource {resource_id: $resource_id})
  
    MATCH (r)-[:TARGETS]->(s:SubCpl)
    MATCH (r)-[:TARGETS {sub_cpl_id: s.sub_cpl_id}]->(i:Indicator)
    MATCH (s)-[sq:HAS_QUALITY]->(q:Quality)-[:HAS_INDICATOR]->(i)

    WITH r, i, max(sq.weight) AS calculated_weight
    MERGE (r)-[rsi:SUPPORTS]->(i)
    SET rsi.weight = calculated_weight

    WITH r
    MATCH (r)-[:TARGETS]->(s:SubCpl)
    MATCH (s)-[sq:HAS_QUALITY]->(q:Quality)

    CALL (q) {
        MATCH (q)-[:HAS_INDICATOR]->(ia:Indicator)
        RETURN count(ia) AS quality_indicator_count
    }

    CALL (r, s, q) {
        MATCH (r)-[:TARGETS {sub_cpl_id: s.sub_cpl_id}]->(i:Indicator)<-[:HAS_INDICATOR]-(q)
        RETURN count(i) AS resource_indicator_count
    }
    
    WITH r, q, max(sq.weight * ((resource_indicator_count * 1.0) / quality_indicator_count)) AS r_q_weight
    MERGE (r)-[rsq:SUPPORTS]->(q)
    SET rsq.weight = r_q_weight

    WITH r
    MATCH (r)-[:TARGETS]->(s:SubCpl)
    CALL (s) {
        MATCH (s)-[rsa:HAS_QUALITY]->(qa:Quality)
        RETURN sum(rsa.weight) AS subcpl_quality_weight
    }

    CALL (r, s) {
        MATCH (r)-[rs:SUPPORTS]->(q:Quality)<-[:HAS_QUALITY]-(s)
        RETURN sum(rs.weight) AS resource_quality_weight
    }

    WITH r, s, (resource_quality_weight * 1.0) / subcpl_quality_weight as r_s_weight
            
    MERGE (r)-[rss:SUPPORTS]->(s)
    SET rss.weight = r_s_weight
    """

    await Neo4jConnection.query(query, {"resource_id": resource_id})