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
           [(r)<-[og:ORGANIZES]-(o:Organizer) | {
               organizer_id: o.organizer_id,
               name: o.name
           }] as organizers,
           [(r)-[af:AVAILABLE_FOR]->(sl:StudyLevel) | {
               study_level_id: sl.study_level_id
           }] as study_levels,
           r.scale as scale,
           r.speaker_degree as speaker_degree,
           r.status as status,
           r.is_active as is_active,
           [(r)-[rsi:SUPPORTS]->(i:Indicator) | {
                indicator_id: i.indicator_id
            }] as indicators,
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
           [(r)<-[og:ORGANIZES]-(o:Organizer) | {
               organizer_id: o.organizer_id,
               name: o.name
           }] as organizers,
           [(r)-[af:AVAILABLE_FOR]->(sl:StudyLevel) | {
               study_level_id: sl.study_level_id
           }] as study_levels,
           [(r)-[rsi:SUPPORTS]->(i:Indicator) | {
                indicator_id: i.indicator_id
            }] as indicators,
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

async def create_resource(resource_id: str, data: dict, current_user: dict):
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

    OPTIONAL MATCH (a:Admin {admin_id: $creator_actor_id})
    OPTIONAL MATCH (o:Organizer {organizer_id: $creator_actor_id})
    WITH r, coalesce(a, o) AS updater
    MERGE (r)-[u:CREATED_BY]->(updater)
    SET u.updated_at = datetime({timezone: 'Asia/Jakarta'})
    WITH r
    OPTIONAL MATCH (a:Admin {admin_id: $updater_actor_id})
    OPTIONAL MATCH (o:Organizer {organizer_id: $updater_actor_id})
    WITH r, coalesce(a, o) AS updater
    MERGE (r)-[u:UPDATED_BY]->(updater)
    SET u.updated_at = datetime({timezone: 'Asia/Jakarta'})
    
    WITH r
    
    CALL (r) {
        UNWIND $study_levels AS study_level
        MATCH (sl:StudyLevel {study_level_id: study_level.study_level_id})
        MERGE (r)-[:AVAILABLE_FOR]->(sl)
    }
    
    CALL (r) {
        UNWIND $organizers AS org
        MATCH (o:Organizer {organizer_id: org.organizer_id})
        MERGE (r)<-[og:ORGANIZES]-(o)
    }
    
    CALL (r) {
        UNWIND $sessions AS session
        MERGE (r)-[hs:HAS_SESSION]->(ss:Session {session_id: session.session_id})
        SET ss.start_datetime = session.start_datetime, ss.end_datetime = session.end_datetime
    }

    CALL (r) {
        UNWIND $topics AS topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (r)-[rc:COVERS]->(t)
    }
    """
    
    params = {"resource_id": resource_id, 
              "type": data['type'],
              "name": data['name'], 
              "description": data["description"],
              "study_levels": data.get("study_levels", None),
              "scale": data.get('scale', None),
              "speaker_degree": data.get('speaker_degree', None),
              "sessions": data.get('sessions', None),
              "organizers": data.get('organizers') if data.get('organizers') else [],
              "status": data.get("status", None),
              "topics": data['topics'],
              "creator_actor_id": current_user['sub'],
              "updater_actor_id": current_user['sub']
              }
    await Neo4jConnection.query(query, params)
    await calculate_support_weights(resource_id, data['indicators'])

async def update_resource(resource_id: str, data: dict, current_user: dict):
    
    query = """
    MATCH (r:Resource {resource_id: $resource_id})
    SET r.name = $name,
        r.type = $type,
        r.description = $description,
        r.scale = $scale,
        r.speaker_degree = $speaker_degree,
        r.status = $status
    WITH r
    OPTIONAL MATCH (r)<-[old_og:ORGANIZES]-(o:Organizer)
    DELETE old_og
    WITH r
    OPTIONAL MATCH (r)-[old_rc:COVERS]->(:Topic)
    DELETE old_rc
    WITH r
    OPTIONAL MATCH (r)-[old_rs:SUPPORTS]->(:Indicator)
    DELETE old_rs
    WITH r
    OPTIONAL MATCH (r)-[old_hs:HAS_SESSION]->(:Session)
    DELETE old_hs
    WITH r
    OPTIONAL MATCH (r)-[old_af:AVAILABLE_FOR]->(:StudyLevel)
    DELETE old_af
    WITH r

    OPTIONAL MATCH (a:Admin {admin_id: $updater_actor_id})
    OPTIONAL MATCH (o:Organizer {organizer_id: $updater_actor_id})
    WITH r, coalesce(a, o) AS updater
    MERGE (r)-[u:UPDATED_BY]->(updater)
    SET u.updated_at = datetime({timezone: 'Asia/Jakarta'})
    
    WITH r
    
    CALL (r) {
        UNWIND $study_levels AS study_level
        MATCH (sl:StudyLevel {study_level_id: study_level.study_level_id})
        MERGE (r)-[:AVAILABLE_FOR]->(sl)
    }
    
    CALL (r) {
        UNWIND $organizers AS org
        MATCH (o:Organizer {organizer_id: org.organizer_id})
        MERGE (r)<-[og:ORGANIZES]-(o)
    }

    CALL (r) {
        UNWIND $sessions AS session
        MERGE (r)-[hs:HAS_SESSION]->(ss:Session {session_id: session.session_id})
        SET ss.start_datetime = session.start_datetime, ss.end_datetime = session.end_datetime
    }

    CALL (r) {
        UNWIND $topics AS topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (r)-[rc:COVERS]->(t)
    }
    """
    
    params = {
        "resource_id": resource_id, 
        "type": data['type'],
        "name": data['name'], 
        "description": data["description"],
        "study_levels": data.get("study_levels") or [], 
        "scale": data.get('scale'),
        "organizers": data.get('organizers') or [],
        "speaker_degree": data.get('speaker_degree'),
        "sessions": data.get('sessions') or [],
        "status": data.get("status"),
        "topics": data.get('topics') or [],
        "updater_actor_id": current_user['sub'] 
    }
    
    await Neo4jConnection.query(query, params)
    await calculate_support_weights(resource_id, data['indicators'])
    
async def check_organizer_update_authorization(resource_id, organizer_id):
    query = """
    MATCH (o:Organizer {organizer_id: $organizer_id})-[:ORGANIZES]->(r:Resource {resource_id: $resource_id})
    RETURN count(r) > 0 AS authorized
    """
    response = await Neo4jConnection.query(query, {"organizer_id": organizer_id, "resource_id": resource_id})
    return response[0]['authorized'] if response else False
    
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
    
async def calculate_support_weights(resource_id: str, indicators: list[dict]):
    query = """
    MATCH (r:Resource {resource_id: $resource_id})
    UNWIND $indicators AS ind_input
    MATCH (i:Indicator {indicator_id: ind_input.indicator_id})

    MATCH (s:SubCpl)-[sq:HAS_QUALITY]->(q:Quality)-[:HAS_INDICATOR]->(i)

    WITH r, i, q, s, max(sq.weight) AS calculated_weight
    MERGE (r)-[rsi:SUPPORTS]->(i)
    SET rsi.weight = calculated_weight

    WITH r, q, s, calculated_weight, count(i) AS resource_indicator_count
    WITH r, q, s, calculated_weight, resource_indicator_count, COUNT { (q)-[:HAS_INDICATOR]->() } AS quality_indicator_count

    WITH r, q, s, calculated_weight * ((resource_indicator_count * 1.0) / quality_indicator_count) AS r_q_weight
    MERGE (r)-[rsq:SUPPORTS]->(q)
    SET rsq.weight = r_q_weight

    WITH r, s, sum(r_q_weight) AS resource_quality_weight
    CALL (s) {
        MATCH (s)-[sq_all:HAS_QUALITY]->()
        RETURN sum(sq_all.weight) AS subcpl_quality_weight
    }

    MERGE (r)-[rss:SUPPORTS]->(s)
    SET rss.weight = (resource_quality_weight * 1.0) / subcpl_quality_weight
    """

    await Neo4jConnection.query(query, {"resource_id": resource_id, "indicators": indicators})