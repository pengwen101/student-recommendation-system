from backend.database import Neo4jConnection

async def read_student_topics(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[r:INTERESTED_IN]->(t:Topic)
        RETURN t.topic_id as topic_id, t.code as code, t.name as name, r.weight as weight
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response

async def student_exists(nrp: str):
    query = """
    MATCH (s: Student {nrp: $nrp})
    RETURN count(s) > 0 as exists
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False
    
async def create_student_topics(nrp: str, topic_list: list):
    query = """
        MATCH (s:Student {nrp: $nrp})
        UNWIND $topics as topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (s)-[r:INTERESTED_IN]->(t)
        SET r.weight = topic.weight
    """
    params = {"nrp": nrp, "topics": topic_list}
    await Neo4jConnection.query(query, params)

async def update_student_topics(nrp: str, topic_list: list):
    query = """
        MATCH (s:Student {nrp: $nrp})
        OPTIONAL MATCH (s)-[r:INTERESTED_IN]->(:Topic)
        DELETE r
        WITH s
        UNWIND $topics as topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (s)-[r:INTERESTED_IN]->(t)
        SET r.weight = topic.weight
    """
    params = {"nrp": nrp, "topics": topic_list}
    await Neo4jConnection.query(query, params)
    
    
async def read_student_qualities(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[r:LACKS]->(q:Quality)
        RETURN q.quality_id as quality_id, q.code as code, q.name as name, r.weight as weight
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response
    
async def create_student_qualities(nrp: str, quality_list: list):
    query = """
        MATCH (s:Student {nrp: $nrp})
        UNWIND $qualities as quality
        MATCH (q:Quality {quality_id: quality.quality_id})
        MERGE (s)-[r:LACKS]->(q)
        SET r.weight = quality.weight
    """
    params = {"nrp": nrp, "qualities": quality_list}
    await Neo4jConnection.query(query, params)

async def update_student_qualities(nrp: str, quality_list: list):
    query = """
        MATCH (s:Student {nrp: $nrp})
        OPTIONAL MATCH (s)-[r:LACKS]->(q:Quality)
        DELETE r
        WITH s
        UNWIND $qualities as quality
        MATCH (q:Quality {quality_id: quality.quality_id})
        MERGE (s)-[r:LACKS]->(q)
        SET r.weight = quality.weight
    """
    params = {"nrp": nrp, "qualities": quality_list}
    await Neo4jConnection.query(query, params)
    
async def has_topics(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[ri:INTERESTED_IN]->(t:Topic)
        RETURN count(ri) > 0 as has_topics
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response[0]['has_topics'] if response else False

async def has_qualities(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[rl:LACKS]->(q:Quality)
        RETURN count(rl) > 0 as has_qualities
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response[0]['has_qualities'] if response else False

async def get_student_recommendations(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})
        OPTIONAL MATCH (s)-[rl:LACKS]->(:Quality)
        WITH s, sum(coalesce(rl.weight, 0)) as total_lack_weight
        OPTIONAL MATCH (s)-[ri:INTERESTED_IN]->(:Topic)
        WITH s, total_lack_weight, sum(coalesce(ri.weight, 0)) as total_interest_weight

        MATCH (r:Resource)
        OPTIONAL MATCH (s)-[rl:LACKS]->(q:Quality)<-[rp:SUPPORTS]-(r)
        WITH s, r, total_lack_weight, total_interest_weight,
            sum(
                CASE 
                    WHEN rl IS NULL OR rp IS NULL THEN 0.0
                    WHEN rl.weight < rp.weight
                    THEN rl.weight
                    ELSE rp.weight
                END
            ) as quality_intersection

        OPTIONAL MATCH (s)-[ri:INTERESTED_IN]->(t:Topic)<-[rt:COVERS]-(r)
        WITH s, r, total_lack_weight, total_interest_weight, quality_intersection,
            sum(
                CASE 
                    WHEN ri IS NULL OR rt IS NULL THEN 0.0
                    WHEN ri.weight < rt.weight 
                    THEN ri.weight
                    ELSE rt.weight
                END
            ) as topic_intersection

        RETURN {
            resource_id: r.resource_id,
            type: r.type,
            name: r.name,
            description: r.description,
            start_datetime: r.start_datetime,
            end_datetime: r.end_datetime,
            status: r.status,
            is_active: r.is_active,
            subcpls: [(r)-[rt1:TARGETS]->(sc:SubCpl) | {
                sub_cpl_id: sc.sub_cpl_id,
                code: sc.code,
                name: sc.name,
                qualities: [
                    (r)-[rt2:TARGETS {sub_cpl_id: sc.sub_cpl_id}]->(q:Quality) | {
                        quality_id: q.quality_id,
                        code: q.code,
                        name: q.name
                    }
                ]
            }],
            topics: [(r)-[rc:COVERS]->(t:Topic) | {
                topic_id: t.topic_id,
                code: t.code,
                name: t.name,
                weight: rc.weight
            }],
            calculated_qualities: [(r)-[rs:SUPPORTS]->(q:Quality) | {
                    quality_id: q.quality_id, 
                    code: q.code,
                    name: q.name,
                    weight: rs.weight
                }]
            } as resource,
            (0.6 * (CASE WHEN total_lack_weight > 0 
                    THEN quality_intersection / total_lack_weight 
                    ELSE 0.0 END) 
            ) + (0.4 *
            (CASE WHEN total_interest_weight > 0 
                    THEN topic_intersection / total_interest_weight 
                    ELSE 0.0 END))
            as probability_score
        ORDER BY probability_score DESC
        LIMIT 10
    """
    params = {"nrp": nrp}
    return await Neo4jConnection.query(query, params)