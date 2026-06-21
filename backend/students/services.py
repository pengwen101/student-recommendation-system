from backend.students import cypher as student_cypher
from backend.indicators import cypher as indicator_cypher
from backend.topics import cypher as topic_cypher
from fastapi import HTTPException
from backend.students.schemas import StudentTopicsResponse, TopicActionResponse, StudentTopicsInput, StudentIndicatorsInput, StudentQuestionRelation
from typing import List
import pandas as pd
import io
import re
import uuid

type_label_dict = {
    "book": "Book",
    "event": "Event",
    "video": "Video",
    "article": "Article"
}


async def create_student(nrp: str, email: str, name: str):
    return await student_cypher.create_student(nrp, email, name)

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


async def _prepare_student_topics(topics: List[StudentTopicsInput]) -> list[dict]:
    prepared_topics: list[dict] = []

    for topic in topics:
        topic_dict = topic.model_dump()
        topic_id = topic_dict.get("topic_id")
        topic_name = topic_dict.get("name")

        if topic_id:
            topic_exists = await topic_cypher.topic_exists(topic_id)
            if not topic_exists:
                raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
            prepared_topics.append({"topic_id": topic_id})
            continue

        if not topic_name or not topic_name.strip():
            raise HTTPException(status_code=400, detail="Topic name is required when topic_id is not provided")

        new_topic_id = str(uuid.uuid4())
        await topic_cypher.create_custom_topic(new_topic_id, {"name": topic_name.strip()})
        prepared_topics.append({"topic_id": new_topic_id})

    return prepared_topics


def _compose_topic_text(topic_rows: list[dict]) -> str:
    return ", ".join(
        (
            topic['name']
        )
        for topic in topic_rows
        if topic.get("name")
    )


async def sync_student_topic_embedding(nrp: str, embedding_model):
    topic_rows = await student_cypher.read_student_topics(nrp)
    topic_text = _compose_topic_text(topic_rows)

    if not topic_text:
        await student_cypher.clear_student_topic_embedding(nrp)
        return

    topic_embedding = embedding_model.encode("query: " + topic_text).tolist()
    await student_cypher.set_student_topic_embedding(nrp, topic_embedding)

async def create_student_topics(nrp: str, topics: List[StudentTopicsInput], embedding_model):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    topics_list = await _prepare_student_topics(topics)
    await student_cypher.create_student_topics(nrp, topics_list)
    await sync_student_topic_embedding(nrp, embedding_model)
    return await student_cypher.read_student_topics(nrp)

async def update_student_topics(nrp: str, topics: List[StudentTopicsInput], embedding_model):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    topics_list = await _prepare_student_topics(topics)
    await student_cypher.update_student_topics(nrp, topics_list)
    await sync_student_topic_embedding(nrp, embedding_model)
    return await student_cypher.read_student_topics(nrp)

async def read_student_lack_indicators(nrp: str):
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")
    return await student_cypher.read_student_lack_indicators(nrp)

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

async def get_student_recommendations(nrp: str, type: str, top_k: int = 4):
    label = type_label_dict[type]
    if not label:
        raise HTTPException(status_code=404, detail="Type not exist")
    student_exists = await student_cypher.student_exists(nrp)
    if not student_exists:
        raise HTTPException(status_code=404, detail="Student not found")

    return await student_cypher.get_student_recommendations(nrp, label, top_k)

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
    return {"message": "Attendance recorded successfully."}
    
async def recalculate_all_student_scores():
    await student_cypher.recalculate_all_student_scores()


async def get_attended_students(resource_id: str):
    return await student_cypher.get_attended_students(resource_id)

async def delete_student_attendance(resource_id: str, nrp: str | None = None):
    await student_cypher.delete_student_attendance(resource_id, nrp)
    
async def delete_all_student_attendance(resource_id: str, nrp: str | None = None):
    await student_cypher.delete_student_attendance(resource_id, nrp)