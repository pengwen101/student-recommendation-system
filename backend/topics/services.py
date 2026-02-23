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
    new_topic_id = str(uuid.uuid4())
    data_dict = data.model_dump()
    await topic_cypher.create_topic(new_topic_id, data_dict)
    return await topic_cypher.read_topic_details(new_topic_id)

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