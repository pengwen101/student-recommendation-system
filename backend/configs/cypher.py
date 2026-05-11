from backend.database import Neo4jConnection

async def get_student_target():
    query = """
    MATCH (cf:Config:StudentTarget)
    return cf.target_score
    """
    
    return await Neo4jConnection.query(query)
    