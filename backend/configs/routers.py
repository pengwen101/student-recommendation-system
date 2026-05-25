from fastapi import APIRouter
from backend.resources.schemas import ResourceType
from backend.configs.schemas import StudentTarget, ResourceAssessment
from backend.configs import services
from typing import List

configs_router = APIRouter(prefix="/config", tags=["config"])

@configs_router.get("/student_target", response_model=StudentTarget)
async def get_student_target():
    return await services.get_student_target()

@configs_router.get("/resource_assessments/{type}", response_model=List[ResourceAssessment])
async def get_resource_assessments(type: ResourceType):
    return await services.get_resource_assessments(type)