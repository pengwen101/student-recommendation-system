from fastapi import APIRouter, HTTPException, status
from backend.students.schemas import StudentTopicsResponse, TopicActionResponse, StudentRecommendationsResponse, StudentTopicsInput
from backend.students import services
from typing import List

topics_router = APIRouter(prefix="/student/topics", tags=["student_topics"])
recommendations_router = APIRouter(prefix="/student/recommendation", tags=["student_recommendations"])

@topics_router.get("/{student_id}", response_model=TopicActionResponse)
async def read_student_topics(student_id: str):
    topics = await services.read_student_topics(student_id)
    return {"message": "Student topic relations successfully retrieved.", "count": len(topics), "topics": topics}

@topics_router.post("/{student_id}", response_model=TopicActionResponse)
async def create_student_topics(student_id: str, data: List[StudentTopicsInput]):
    topics = await services.create_student_topics(student_id, data.topics)
    return {"message": "Student topic relations successfully added.", "count": len(topics), "topics": topics}

@topics_router.put("/{student_id}", response_model=TopicActionResponse)
async def update_student_topics(student_id: str, data: List[StudentTopicsInput]):
    topics = await services.update_student_topics(student_id, data.topics)
    return {"message": "Student topic relations successfully updated.", "count": len(topics), "topics": topics}

@recommendations_router.get("/{student_id}", response_model=StudentRecommendationsResponse)
async def get_student_recommendations(student_id: str):
    recommendations = await services.get_student_recommendations(student_id)
    return {"message": "Student recommendations successfully retrieved.", "count": len(recommendations), "recommendations": recommendations}