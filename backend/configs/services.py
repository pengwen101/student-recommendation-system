from backend.configs import cypher
from fastapi import HTTPException

async def get_majors():
    return await cypher.get_majors()

async def get_resource_assessments(type: str):
    return await cypher.get_resource_assessments(type)

async def get_student_target() -> dict:
    result = await cypher.get_student_target()
    return result

async def update_student_target(weight: float):
    await cypher.update_student_target(float(weight))

async def get_recommendation_weight() -> dict:
    result = await cypher.get_recommendation_weight()
    return result

async def update_recommendation_weight(data: dict):
    await cypher.update_recommendation_weight(data.need_weight, data.interest_weight)
    

async def get_resource_assessments(type: str):
    return await cypher.get_resource_assessments(type)

async def create_resource_assessments(data: dict):
    assessments_dict = data.model_dump()
    await cypher.create_resource_assessments(assessments_dict)

async def update_resource_assessments(resource_assessment_id: str, data: dict):
    assessments_dict = data.model_dump()
    await cypher.update_resource_assessments(resource_assessment_id, assessments_dict)

async def delete_resource_assessments(resource_assessment_id: str):
    resource_exists = await cypher.resource_assessment_resource_exist(resource_assessment_id)
    if resource_exists:
        raise HTTPException(status_code=404, detail="There are resources connected to this assessment.")
    await cypher.delete_resource_assessments(resource_assessment_id)