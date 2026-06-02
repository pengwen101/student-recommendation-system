from backend.students import cypher as student_cypher
from backend.indicators import cypher as indicator_cypher
from backend.topics import cypher as topic_cypher
from fastapi import HTTPException
from backend.students.schemas import StudentTopicsResponse, TopicActionResponse, StudentTopicsInput, StudentIndicatorsInput, StudentQuestionRelation
from typing import List
import pandas as pd
import io

type_label_dict = {
    "book": "Book",
    "event": "Event",
    "video": "Video",
    "article": "Article"
}

async def create_student_question_relation(nrp: str, data: List[StudentQuestionRelation]):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    data_dict = [item.model_dump() for item in data]
    return await student_cypher.create_student_question_relation(nrp, data_dict)

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

async def get_student_recommendations(nrp: str, type: str):
    label = type_label_dict[type]
    if not label:
        raise HTTPException(status_code=404, detail="Type not exist")
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.get_student_recommendations(nrp, label)

async def record_student_attendance(resource_id: str, file_contents: bytes, filename: str) -> dict:
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_contents))
        else:
            df = pd.read_excel(io.BytesIO(file_contents))
    except Exception:
        raise ValueError("Failed to parse the file. Ensure it is a valid, uncorrupted CSV or Excel format.")
    nrp_col = next((col for col in df.columns if str(col).strip().lower() == 'nrp'), df.columns[0])
    nrps = df[nrp_col].dropna().astype(str).str.strip().tolist()
    if not nrps:
        raise ValueError("No valid NRPs found in the uploaded file.")
    missing_nrps = await student_cypher.check_missing_nrps(nrps)
    if missing_nrps:
        raise ValueError(f"The following NRPs do not exist in the database: {', '.join(missing_nrps)}")
    await student_cypher.record_student_attendance(resource_id, nrps)
    
async def get_attended_students(resource_id: str):
    return await student_cypher.get_attended_students(resource_id)