from fastapi import APIRouter
from backend.resources.schemas import ResourceType
from backend.configs.schemas import StudentTarget, ResourceAssessment, ResourceAssessmentInput, RecommendationWeight, AddScoreConstant
from backend.configs import services
from typing import List

configs_router = APIRouter(prefix="/config", tags=["config"])

@configs_router.get("/student_target", response_model=StudentTarget)
async def get_student_target():
    return await services.get_student_target()
    
@configs_router.put("/student_target")
async def update_student_target(weight: float):
    await services.update_student_target(weight)

@configs_router.get("/recommendation_weight", response_model=RecommendationWeight)
async def get_recommendation_weight():
    return await services.get_recommendation_weight()

@configs_router.put("/recommendation_weight")
async def update_recommendation_weight(data: RecommendationWeight):
    await services.update_recommendation_weight(data)
    
@configs_router.get("/resource_assessments/{type}", response_model=List[ResourceAssessment])
async def get_resource_assessments(type:ResourceType):
    return await services.get_resource_assessments(type)

@configs_router.post("/resource_assessments")
async def create_resource_assessments(data: ResourceAssessmentInput):
    await services.create_resource_assessments(data)
    
@configs_router.put("/resource_assessments/{resource_assessment_id}")
async def update_resource_assessments(resource_assessment_id: str, data: ResourceAssessmentInput):
    await services.update_resource_assessments(resource_assessment_id, data)
    
@configs_router.delete("/resource_assessments/{resource_assessment_id}")
async def delete_resource_assessments(resource_assessment_id: str):
    await services.delete_resource_assessments(resource_assessment_id)
    
    
@configs_router.get("/add_score_constant", response_model=AddScoreConstant)
async def get_add_score_constant():
    return await services.get_add_score_constant()

@configs_router.put("/add_score_constant")
async def update_add_score_constant(weight: float):
    await services.update_add_score_constant(weight)