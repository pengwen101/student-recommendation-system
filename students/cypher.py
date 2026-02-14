from backend.database import Neo4jConnection

async def read_student_topics(student_id: str):
    query = """
        MATCH (s:Student {student_id: $student_id})-[r:INTERESTED_IN]->(t:Topic)
        RETURN t.topic_id as topic_id, t.description as topic_description
    """
    params = {"student_id": student_id}
    response_df = Neo4jConnection.query(query, params)
    response = response_df.to_dict(orient='records')
    
    return response

async def student_exists(student_id: str):
    query = """
    MATCH (s: Student {student_id: $student_id})
    RETURN s
    """
    params = {"student_id": student_id}
    response_df = Neo4jConnection.query(query, params)
    return not response_df.empty
    
async def create_student_topics(student_id: str, topic_ids: list[str]):
    query = """
        MATCH (s:Student {student_id: $student_id})
        UNWIND $topic_ids as tid
        MATCH (t:Topic {topic_id: tid})
        MERGE (s)-[r:INTERESTED_IN]->(t)
    """
    params = {"student_id": student_id, "topic_ids": topic_ids}
    Neo4jConnection.query(query, params)

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
    Neo4jConnection.query(query, params)