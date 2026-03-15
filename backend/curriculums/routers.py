from fastapi import APIRouter, HTTPException, status, UploadFile, File
from backend.curriculums.schemas import (CurriculumResponse, CurriculumQuestionResponse)
from backend.curriculums import services
from typing import List

curriculums_router = APIRouter(prefix="/curriculum", tags=["curriculum"])

curriculums_q_router = APIRouter(prefix="/curriculum/q", tags=["curriculum_question"])

@curriculums_router.get("/{version_id:path}", response_model=CurriculumResponse)
async def read_curriculum(version_id: str):
    curriculum = await services.read_curriculum(version_id)
    print(curriculum)
    return {"message": "Curriculum successfully retrieved.", "curriculum": curriculum}

@curriculums_router.post("", response_model=CurriculumResponse)
async def create_curriculum(file: UploadFile = File(...)):
    curriculum = await services.create_curriculum(file)
    return {"message": "Curriculum successfully created.", "curriculum": curriculum}

@curriculums_q_router.get("", response_model=CurriculumQuestionResponse)
async def read_curriculum():
    curriculum = await services.read_curriculum()
    return {"message": "Curriculum successfully retrieved.", "curriculum": curriculum}

@curriculums_q_router.post("", response_model=CurriculumQuestionResponse)
async def create_curriculum(file: UploadFile = File(...)):
    curriculum = await services.create_curriculum(file)
    return {"message": "Curriculum successfully created.", "curriculum": curriculum}