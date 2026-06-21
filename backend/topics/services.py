from backend.topics import cypher as topic_cypher
from fastapi import HTTPException
from backend.topics.schemas import TopicDetailsResponse, AllTopicsResponse, TopicDetailsInput
from typing import List
import uuid

async def read_topics():
    return await topic_cypher.read_topics()

async def read_topic_details(topic_id: str):
    topic_exists = await topic_cypher.topic_exists(topic_id)
    if not topic_exists:
        raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    return await topic_cypher.read_topic_details(topic_id)

async def create_topic(data: TopicDetailsInput):
    existing = await topic_cypher.find_custom_topic_by_name(data.name)
    if existing:
        topic_id = existing['topic_id']
        await topic_cypher.convert_custom_topic(topic_id, data.model_dump())
    else:
        topic_id = str(uuid.uuid4())
        await topic_cypher.create_topic(topic_id, data.model_dump())
    return await topic_cypher.read_topic_details(topic_id)

async def update_topic(topic_id: str, data: TopicDetailsInput):
    topic_exists = await topic_cypher.topic_exists(topic_id)
    if not topic_exists:
        raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    data_dict = data.model_dump()
    await topic_cypher.update_topic(topic_id, data_dict)
    return await topic_cypher.read_topic_details(topic_id)

async def delete_topic(topic_id: str):
    topic_exists = await topic_cypher.topic_exists(topic_id)
    if not topic_exists:
        raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    await topic_cypher.delete_topic(topic_id)
    
