from fastapi import APIRouter, HTTPException, status, UploadFile, File
from backend.curriculum.schemas import (CurriculumResponse, CurriculumQuestionResponse)
from backend.curriculum import services
from typing import List

curriculum_router = APIRouter(prefix="/curriculum", tags=["curriculum"])

curriculum_q_router = APIRouter(prefix="/curriculum/q", tags=["curriculum_question"])

@curriculum_router.get("", response_model=CurriculumResponse)
async def read_curriculum():
    curriculum = await services.read_curriculum()
    return {"message": "Curriculum successfully retrieved.", "curriculum": curriculum}

@curriculum_router.post("", response_model=CurriculumResponse)
async def create_curriculum(file: UploadFile = File(...)):
    curriculum = await services.create_curriculum(file)
    return {"message": "Curriculum successfully created.", "curriculum": curriculum}

@curriculum_q_router.get("", response_model=CurriculumQuestionResponse)
async def read_curriculum():
    curriculum = await services.read_curriculum()
    return {"message": "Curriculum successfully retrieved.", "curriculum": curriculum}

@curriculum_q_router.post("", response_model=CurriculumQuestionResponse)
async def create_curriculum(file: UploadFile = File(...)):
    curriculum = await services.create_curriculum(file)
    return {"message": "Curriculum successfully created.", "curriculum": curriculum}