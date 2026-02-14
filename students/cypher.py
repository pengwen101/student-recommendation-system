from backend.database import Neo4jConnection

async def read_student_topics(student_id: str):
    query = """
        MATCH (s:Student {student_id: $student_id})-[r:INTERESTED_IN]->(t:Topic)
        RETURN t.topic_id as topic_id, t.description as topic_description
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
    
async def create_student_topics(student_id: str, topic_ids: list[str]):
    query = """
        MATCH (s:Student {student_id: $student_id})
        UNWIND $topic_ids as tid
        MATCH (t:Topic {topic_id: tid})
        MERGE (s)-[r:INTERESTED_IN]->(t)
    """
    params = {"student_id": student_id, "topic_ids": topic_ids}
    await Neo4jConnection.query(query, params)

async def update_student_topics(student_id: str, topic_ids: list[str]):
    query = """
        MATCH (s:Student {student_id: $student_id})
        OPTIONAL MATCH (s)-[r:INTERESTED_IN]->(:Topic)
        DELETE r
        WITH s
        UNWIND $topic_ids as tid
        MATCH (t:Topic {topic_id: tid})
        MERGE (s)-[:INTERESTED_IN]->(t)
    """
    params = {"student_id": student_id, "topic_ids": topic_ids}
    await Neo4jConnection.query(query, params)