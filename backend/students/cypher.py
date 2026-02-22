from backend.database import Neo4jConnection

async def read_student_topics(student_id: str):
    query = """
        MATCH (s:Student {student_id: $student_id})-[r:INTERESTED_IN]->(t:Topic)
        RETURN t.topic_id as topic_id, t.code as code, t.name as name, r.weight as weight
    """
    params = {"student_id": student_id}
    response = await Neo4jConnection.query(query, params)
    return response

async def student_exists(student_id: str):
    query = """
    MATCH (s: Student {student_id: $student_id})
    RETURN count(s) > 0 as exists
    """
    params = {"student_id": student_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False
    
async def create_student_topics(student_id: str, topic_list: list):
    query = """
        MATCH (s:Student {student_id: $student_id})
        UNWIND $topics as topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (s)-[r:INTERESTED_IN]->(t)
        SET r.weight = topic.weight
    """
    params = {"student_id": student_id, "topics": topic_list}
    await Neo4jConnection.query(query, params)

async def update_student_topics(student_id: str, topic_list: list):
    query = """
        MATCH (s:Student {student_id: $student_id})
        OPTIONAL MATCH (s)-[r:INTERESTED_IN]->(:Topic)
        DELETE r
        WITH s
        UNWIND $topics as topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (s)-[r:INTERESTED_IN]->(t)
        SET r.weight = topic.weight
    """
    params = {"student_id": student_id, "topics": topic_list}
    await Neo4jConnection.query(query, params)
    
    
async def read_student_qualities(student_id: str):
    query = """
        MATCH (s:Student {student_id: $student_id})-[r:LACKS]->(q:Quality)
        RETURN q.quality_id as quality_id, q.code as code, q.name as name, r.weight as weight
    """
    params = {"student_id": student_id}
    response = await Neo4jConnection.query(query, params)
    return response
    
async def create_student_qualities(student_id: str, quality_list: list):
    query = """
        MATCH (s:Student {student_id: $student_id})
        UNWIND $qualities as quality
        MATCH (q:Quality {quality_id: quality.quality_id})
        MERGE (s)-[r:LACKS]->(q)
        SET r.weight = quality.weight
    """
    params = {"student_id": student_id, "qualities": quality_list}
    await Neo4jConnection.query(query, params)

async def update_student_qualities(student_id: str, quality_list: list):
    query = """
        MATCH (s:Student {student_id: $student_id})
        OPTIONAL MATCH (s)-[r:LACKS]->(q:Quality)
        DELETE r
        WITH s
        UNWIND $qualities as quality
        MATCH (q:Quality {quality_id: quality.quality_id})
        MERGE (s)-[r:LACKS]->(q)
        SET r.weight = quality.weight
    """
    params = {"student_id": student_id, "qualities": quality_list}
    await Neo4jConnection.query(query, params)
    
async def get_student_recommendations(student_id: str):
    query = """
        MATCH (s:Student {student_id: $student_id})
        OPTIONAL MATCH (s)-[rl:LACKS]->(:Quality)
        WITH s, sum(coalesce(rl.weight, 0)) as total_lack_weight
        OPTIONAL MATCH (s)-[ri:INTERESTED_IN]->(:Topic)
        WITH s, total_lack_weight, sum(coalesce(ri.weight, 0)) as total_interest_weight

        MATCH (e:Event)
        OPTIONAL MATCH (s)-[rl:LACKS]->(q:Quality)<-[rp:SUPPORTS]-(e)
        WITH s, e, total_lack_weight, total_interest_weight,
            sum(
                CASE 
                    WHEN rl IS NULL OR rp IS NULL THEN 0.0
                    WHEN rl.weight < rp.weight
                    THEN rl.weight
                    ELSE rp.weight
                END
            ) as quality_intersection

        OPTIONAL MATCH (s)-[ri:INTERESTED_IN]->(t:Topic)<-[rt:TAGGED_WITH]-(e)
        WITH s, e, total_lack_weight, total_interest_weight, quality_intersection,
            sum(
                CASE 
                    WHEN ri IS NULL OR rt IS NULL THEN 0.0
                    WHEN ri.weight < rt.weight 
                    THEN ri.weight
                    ELSE rt.weight
                END
            ) as topic_intersection

        RETURN e.event_id as event_id, 
            e.name,
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
    params = {"student_id": student_id}
    return await Neo4jConnection.query(query, params)