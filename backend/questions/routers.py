from fastapi import APIRouter, HTTPException, status, Depends
from backend.auth.dependencies import require_admin
from backend.questions.schemas import QuestionUpdateInput, QuestionUpdateResponse
from backend.questions import services

questions_update_router = APIRouter(prefix="/question", tags=["question"], dependencies=[Depends(require_admin())])


@questions_update_router.put("/{question_id}", response_model=QuestionUpdateResponse)
async def update_question(question_id: str, data: QuestionUpdateInput):
    result = await services.update_question(question_id, data.model_dump())
    return result
