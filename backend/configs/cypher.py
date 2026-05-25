from backend.database import Neo4jConnection

async def get_student_target():
    query = """
    MATCH (cf:Config:StudentTarget)
    return cf.target_score
    """
    
    return await Neo4jConnection.query(query)

async def get_resource_assessments(type: str):
    query = """
    MATCH (ra:ResourceAssessment {resource_type: $type})
    RETURN ra.resource_assessment_id as resource_assessment_id,
    ra.display_name as display_name,
    ra.resource_type as resource_type,
    ra.weight as weight
    """
    params = {"type": type}
    return await Neo4jConnection.query(query, params)
    