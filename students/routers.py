from fastapi import APIRouter
from backend.students.schemas import StudentTopicsResponse, StudentTopicsCreate, StudentTopicsUpdate
from backend.students import services

topics_router = APIRouter(prefix="/student/topics", tags=["student_topics"])

@topics_router.get("/{student-id}", response_model=StudentTopicsResponse)
async def read_student_topics(student_id: str):
    topics = await services.read_student_topics(student_id)
    return {"student_id": student_id, "topics": topics}

@topics_router.post("/{student-id}", response_model=StudentTopicsResponse)
async def create_student_topics(student_id: str, data: StudentTopicsCreate):
    topics = await services.create_student_topics(student_id, data.topic_ids)
    return {"student_id": student_id, "topics": topics}

@topics_router.post("/{student-id}", response_model=StudentTopicsResponse)
async def update_student_topics(student_id: str, data: StudentTopicsUpdate):
    topics = await services.update_student_topics(student_id, data.topic_ids)
    return {"student_id": student_id, "topics": topics}