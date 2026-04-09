from backend.students import cypher as student_cypher
from backend.indicators import cypher as indicator_cypher
from backend.topics import cypher as topic_cypher
from fastapi import HTTPException
from backend.students.schemas import StudentTopicsResponse, TopicActionResponse, StudentTopicsInput, StudentIndicatorsInput
from typing import List

async def read_student_topics(nrp: str):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.read_student_topics(nrp)

async def create_student_topics(nrp: str, topics: List[StudentTopicsInput]):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    topics_list = [topic.model_dump() for topic in topics]
    for topic in topics_list:
        topic_id = topic['topic_id']
        topic_exists = await topic_cypher.topic_exists(topic_id)
        if not topic_exists:
            raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    await student_cypher.create_student_topics(nrp, topics_list)
    return await student_cypher.read_student_topics(nrp)

async def update_student_topics(nrp: str, topics: List[StudentTopicsInput]):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    topics_list = [topic.model_dump() for topic in topics]
    for topic in topics_list:
        topic_id = topic['topic_id']
        topic_exists = await topic_cypher.topic_exists(topic_id)
        if not topic_exists:
            raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    await student_cypher.update_student_topics(nrp, topics_list)
    return await student_cypher.read_student_topics(nrp)

async def read_student_indicators(nrp: str):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.read_student_indicators(nrp)

async def read_student_subcpls(nrp: str):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.read_student_subcpls(nrp)

async def read_student_cpls(nrp: str):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.read_student_cpls(nrp)

async def create_student_indicators(nrp: str, indicators: List[StudentIndicatorsInput]):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    indicators_list = [indicator.model_dump() for indicator in indicators]
    for indicator in indicators_list:
        indicator_id = indicator['indicator_id']
        indicator_exists = await indicator_cypher.indicator_exists(indicator_id)
        if not indicator_exists:
            raise HTTPException(status_code=404, detail=f"Indicator ID {indicator_id} not found")
    await student_cypher.create_student_indicators(nrp, indicators_list)
    return await student_cypher.read_student_indicators(nrp)

async def update_student_indicators(nrp: str, indicators: List[StudentIndicatorsInput]):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    indicators_list = [indicator.model_dump() for indicator in indicators]
    for indicator in indicators_list:
        indicator_id = indicator['indicator_id']
        indicator_exists = await indicator_cypher.indicator_exists(indicator_id)
        if not indicator_exists:
            raise HTTPException(status_code=404, detail=f"Indicator ID {indicator_id} not found")
    await student_cypher.update_student_indicators(nrp, indicators_list)
    return await student_cypher.read_student_indicators(nrp)

async def has_topics(nrp: str):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.has_topics(nrp)

async def has_indicators(nrp: str):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.has_indicators(nrp)

async def get_student_recommendations(nrp: str):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.get_student_recommendations(nrp)