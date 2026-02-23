from fastapi import APIRouter, HTTPException, status
from backend.topics.schemas import (AllTopicsResponse, TopicDetailsResponse, TopicDetailsInput)
from backend.topics import services
from typing import List

topics_router = APIRouter(prefix="/topic", tags=["topic"])

@topics_router.get("", response_model=AllTopicsResponse)
async def read_topics():
    topics = await services.read_topics()
    return {"message": "Topics successfully retrieved.", "count": len(topics), "topics": topics}

@topics_router.get("/{topic_id}", response_model=TopicDetailsResponse)
async def read_topic_details(topic_id: str):
    topic_details = await services.read_topic_details(topic_id)
    return {"message": "Topic details successfully retrieved.", "topic_details": topic_details}

@topics_router.post("", response_model=TopicDetailsResponse)
async def create_topic(data: TopicDetailsInput):
    topic_details = await services.create_topic(data)
    return {"message": "Topic successfully created.", "topic_details": topic_details}

@topics_router.put("/{topic_id}", response_model=TopicDetailsResponse)
async def update_topic(topic_id: str, data: TopicDetailsInput):
    topic_details = await services.update_topic(topic_id, data)
    return {"message": "Topic successfully updated.", "topic_details": topic_details}

@topics_router.delete("/{topic_id}")
async def delete_topic(topic_id: str):
    await services.delete_topic(topic_id)
    return {"message": "Topic successfully deleted."}