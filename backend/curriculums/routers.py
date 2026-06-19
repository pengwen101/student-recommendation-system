from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from backend.curriculums.schemas import (CurriculumResponse, CurriculumQuestionResponse, CurriculumVersionResponse, QuestionResponse)
from backend.curriculums import services
from typing import List

curriculums_router = APIRouter(prefix="/curriculum", tags=["curriculum"])
curriculum_versions_router = APIRouter(prefix="/curriculum_version", tags=["curriculum_version"])

curriculums_q_router = APIRouter(prefix="/curriculum_q", tags=["curriculum_question"])


@curriculums_router.get("/template")
async def download_template():
    buf = await services.generate_template()
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=template_curriculum.xlsx"},
    )


@curriculums_router.get("/{version_id}/batch-info")
async def read_curriculum_batch_info(version_id: str):
    batch_info = await services.get_batch_info(version_id)
    return {"batch_info": batch_info}


@curriculums_router.get("/{version_id:path}", response_model=CurriculumResponse)
async def read_curriculum(version_id: str):
    curriculum = await services.read_curriculum(version_id)
    return {"message": "Curriculum successfully retrieved.", "curriculum": curriculum}


@curriculums_router.post("", response_model=CurriculumResponse)
async def create_curriculum(file: UploadFile = File(...), batch_id: str = Form(...)):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are accepted")
    curriculum = await services.create_curriculum(file, batch_id)
    return {"message": "Curriculum successfully created.", "curriculum": curriculum}


@curriculums_q_router.get("", response_model=List[QuestionResponse])
async def read_questions():
    questions = await services.read_questions()
    return questions


@curriculum_versions_router.get("", response_model=CurriculumVersionResponse)
async def read_curriculum_versions():
    curriculum_versions = await services.read_curriculum_versions()
    return {"message": "Curriculum versions successfully retrieved.", "curriculum_versions": curriculum_versions}