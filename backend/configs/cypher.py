from backend.database import Neo4jConnection

async def get_student_target():
    query = """
    MATCH (cf:Config:StudentTarget)
    return cf.target_score as target_score
    """
    response = await Neo4jConnection.query(query)
    return response[0] if response else None

async def update_student_target(weight: float):
    query = """
    MERGE (st:Config:StudentTarget)
    SET st.target_score = $weight
    """
    await Neo4jConnection.query(query, {"weight": weight})

async def get_recommendation_weight():
    query = """
    MATCH (rw:Config:RecommendationWeight)
    RETURN rw.need_weight AS need_weight, rw.interest_weight AS interest_weight
    """
    result = await Neo4jConnection.query(query)
    return result[0] if result else None

async def update_recommendation_weight(need_weight: float, interest_weight: float):
    query = """
    MERGE (rw:Config:RecommendationWeight)
    SET rw.need_weight = $need_weight,
        rw.interest_weight = $interest_weight
    """
    await Neo4jConnection.query(query, {
        "need_weight": need_weight, 
        "interest_weight": interest_weight
    })
    
async def get_resource_assessments(type: str):
    query = """
    MATCH (ra:ResourceAssessment {resource_type: $type})
    RETURN ra.resource_assessment_id as resource_assessment_id,
    ra.display_name as display_name,
    ra.resource_type as resource_type,
    ra.weight as weight,
    ra.lower_text as lower_text,
    ra.upper_text as upper_text
    """
    params = {"type": type}
    return await Neo4jConnection.query(query, params)

async def create_resource_assessments(assessment: dict):
    query = """
    MERGE (ra:ResourceAssessment {
        resource_assessment_id: randomUUID(),
        resource_type: $resource_type,
        display_name: $display_name,
        weight: toFloat($weight),
        lower_text: $lower_text,
        upper_text: $upper_text
    })
    """
    await Neo4jConnection.query(query, {
        "resource_type": assessment['resource_type'],
        "display_name": assessment['display_name'],
        "weight": assessment['weight'],
        "lower_text": assessment['lower_text'],
        "upper_text": assessment['upper_text']
    })

async def update_resource_assessments(resource_assessment_id: str, assessment: dict):
    query = """
    MATCH (ra:ResourceAssessment {resource_assessment_id: $resource_assessment_id})
    SET ra.weight = $weight, ra.resource_type = $resource_type, ra.display_name = $display_name,
        ra.lower_text = $lower_text, ra.upper_text = $upper_text
    """
    await Neo4jConnection.query(query, {
        "resource_assessment_id": resource_assessment_id,
        "weight": assessment['weight'],
        "resource_type": assessment['resource_type'],
        'display_name': assessment['display_name'],
        'lower_text': assessment['lower_text'],
        'upper_text': assessment['upper_text']
    })
    
    await update_resources_internal_weight()
    
async def update_resources_internal_weight():
    query = """
    MATCH (r:UniResource)
    CALL (r) {
        OPTIONAL MATCH (r)-[rh:HAS]->(ra:ResourceAssessment)
        RETURN count(ra) AS assessment_count, 
               sum(rh.weight * ra.weight) AS calculated_weight
    }
    SET r.internal_weight = CASE 
        WHEN assessment_count = 0 THEN 1.0 
        ELSE calculated_weight
        END
    """
    
    await Neo4jConnection.query(query)
    

async def delete_resource_assessments(resource_assessment_id: str):
    query = """
    MATCH (ra:ResourceAssessment {resource_assessment_id: $resource_assessment_id})
    DELETE ra
    """
    await Neo4jConnection.query(query, {"resource_assessment_id": resource_assessment_id})
    
async def resource_assessment_resource_exist(resource_assessment_id: str):
    query = """
    MATCH (ra:ResourceAssessment {resource_assessment_id: $resource_assessment_id})
    MATCH (r:UniResource)-[]->(ra)
    
    RETURN count(r)>0 as exists
    """
    response = await Neo4jConnection.query(query, {"resource_assessment_id": resource_assessment_id})
    return response[0]['exists'] if response else False
    
async def get_add_score_constant():
    query = """
    MATCH (cf:Config:AddScoreConstant)
    RETURN cf.weight as weight
    """
    
    result = await Neo4jConnection.query(query)
    return result[0] if result else None

async def update_add_score_constant(weight: float):
    query = """
    MATCH (cf:Config:AddScoreConstant)
    SET cf.weight = $weight
    """
    
    await Neo4jConnection.query(query, {"weight": weight})