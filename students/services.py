from backend.students import cypher
from fastapi import HTTPException
from backend.students.schemas import StudentTopicsResponse, TopicActionResponse, StudentTopicsInput
from typing import List

async def read_student_topics(student_id: str):
    student_exists = await cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await cypher.read_student_topics(student_id)

async def create_student_topics(student_id: str, topics: List[StudentTopicsInput]):
    student_exists = await cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    topics_list = [{"topic_id": t.topic_id, "weight": t.weight} for t in topics]
    await cypher.create_student_topics(student_id, topics_list)
    return await cypher.read_student_topics(student_id)

async def update_student_topics(student_id: str, topics: List[StudentTopicsInput]):
    student_exists = await cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    topics_list = [{"topic_id": t.topic_id, "weight": t.weight} for t in topics]
    await cypher.update_student_topics(student_id, topics_list)
    return await cypher.read_student_topics(student_id)

async def get_student_recommendations(student_id: str):
    student_exists = await cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await cypher.get_student_recommendations(student_id)