from fastapi import APIRouter
from backend.configs.schemas import StudentTarget
from backend.configs import services
from typing import List

configs_router = APIRouter(prefix="/config", tags=["config"])

@configs_router.get("/student_target", response_model=StudentTarget)
async def get_student_target():
    return await services.get_student_target()