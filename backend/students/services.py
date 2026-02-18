from backend.students import cypher as student_cypher
from backend.qualities import cypher as quality_cypher
from backend.topics import cypher as topic_cypher
from fastapi import HTTPException
from backend.students.schemas import StudentTopicsResponse, TopicActionResponse, StudentTopicsInput, StudentQualitiesInput
from typing import List

async def read_student_topics(student_id: str):
    student_exists = await student_cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.read_student_topics(student_id)

async def create_student_topics(student_id: str, topics: List[StudentTopicsInput]):
    student_exists = await student_cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    topics_list = [topic.model_dump() for topic in topics]
    for topic in topics_list:
        topic_id = topic['topic_id']
        topic_exists = await topic_cypher.topic_exists(topic_id)
        if not topic_exists:
            raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    await student_cypher.create_student_topics(student_id, topics_list)
    return await student_cypher.read_student_topics(student_id)

async def update_student_topics(student_id: str, topics: List[StudentTopicsInput]):
    student_exists = await student_cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    topics_list = [topic.model_dump() for topic in topics]
    for topic in topics_list:
        topic_id = topic['topic_id']
        topic_exists = await topic_cypher.topic_exists(topic_id)
        if not topic_exists:
            raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    await student_cypher.update_student_topics(student_id, topics_list)
    return await student_cypher.read_student_topics(student_id)

async def read_student_qualities(student_id: str):
    student_exists = await student_cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.read_student_qualities(student_id)

async def create_student_qualities(student_id: str, qualities: List[StudentQualitiesInput]):
    student_exists = await student_cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    qualities_list = [quality.model_dump() for quality in qualities]
    for quality in qualities_list:
        quality_id = quality['quality_id']
        quality_exists = await quality_cypher.quality_exists(quality_id)
        if not quality_exists:
            raise HTTPException(status_code=404, detail=f"Quality ID {quality_id} not found")
    await student_cypher.create_student_qualities(student_id, qualities_list)
    return await student_cypher.read_student_qualities(student_id)

async def update_student_qualities(student_id: str, qualities: List[StudentQualitiesInput]):
    student_exists = await student_cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    qualities_list = [quality.model_dump() for quality in qualities]
    for quality in qualities_list:
        quality_id = quality['quality_id']
        quality_exists = await quality_cypher.quality_exists(quality_id)
        if not quality_exists:
            raise HTTPException(status_code=404, detail=f"Quality ID {quality_id} not found")
    await student_cypher.update_student_qualities(student_id, qualities_list)
    return await student_cypher.read_student_qualities(student_id)

async def get_student_recommendations(student_id: str):
    student_exists = await student_cypher.student_exists(student_id)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.get_student_recommendations(student_id)