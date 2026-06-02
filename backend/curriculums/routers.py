from fastapi import APIRouter, HTTPException, status, UploadFile, File
from backend.curriculums.schemas import (CurriculumResponse, CurriculumQuestionResponse, CurriculumVersionResponse, QuestionResponse)
from backend.curriculums import services
from typing import List

curriculums_router = APIRouter(prefix="/curriculum", tags=["curriculum"])
curriculum_versions_router = APIRouter(prefix="/curriculum_version", tags=["curriculum_version"])

curriculums_q_router = APIRouter(prefix="/curriculum_q", tags=["curriculum_question"])

@curriculums_router.get("/{version_id:path}", response_model=CurriculumResponse)
async def read_curriculum(version_id: str):
    curriculum = await services.read_curriculum(version_id)
    return {"message": "Curriculum successfully retrieved.", "curriculum": curriculum}

@curriculums_router.post("", response_model=CurriculumResponse)
async def create_curriculum(file: UploadFile = File(...)):
    curriculum = await services.create_curriculum(file)
    return {"message": "Curriculum successfully created.", "curriculum": curriculum}

@curriculums_q_router.get("", response_model=List[QuestionResponse])
async def read_questions():
    questions = await services.read_questions()
    return questions

@curriculum_versions_router.get("", response_model=CurriculumVersionResponse)
async def read_curriculum_versions():
    curriculum_versions = await services.read_curriculum_versions()
    return {"message": "Curriculum versions successfully retrieved.", "curriculum_versions": curriculum_versions}

# @curriculums_q_router.post("", response_model=CurriculumQuestionResponse)
# async def create_curriculum(file: UploadFile = File(...)):
#     curriculum = await services.create_curriculum(file)
#     return {"message": "Curriculum successfully created.", "curriculum": curriculum}