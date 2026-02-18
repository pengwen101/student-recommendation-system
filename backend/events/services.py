from backend.events import cypher as event_cypher
from backend.qualities import cypher as quality_cypher
from backend.topics import cypher as topic_cypher
from fastapi import HTTPException
from backend.events.schemas import EventDetailsResponse, AllEventsResponse, EventDetailsInput
from typing import List
import uuid

async def read_events():
    return await event_cypher.read_events()

async def read_event_details(event_id: str):
    event_exists = await event_cypher.event_exists(event_id)
    if not event_exists:
        raise HTTPException(status_code=404, detail="Event not found")
    return await event_cypher.read_event_details(event_id)

async def create_event(data: EventDetailsInput):
    new_event_id = str(uuid.uuid4())
    data_dict = data.model_dump()
    for quality in data_dict['qualities']:
        quality_id = quality['quality_id']
        quality_exists = await quality_cypher.quality_exists(quality_id)
        if not quality_exists:
            raise HTTPException(status_code=404, detail=f"Quality ID {quality_id} not found")
    for topic in data_dict['topics']:
        topic_id = topic['topic_id']
        topic_exists = await topic_cypher.topic_exists(topic_id)
        if not topic_exists:
            raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    await event_cypher.create_event(new_event_id, data_dict)
    return await event_cypher.read_event_details(new_event_id)

async def update_event(event_id: str, data: EventDetailsInput):
    event_exists = await event_cypher.event_exists(event_id)
    if not event_exists:
        raise HTTPException(status_code=404, detail="Event not found")
    data_dict = data.model_dump()
    for quality in data_dict['qualities']:
        quality_id = quality['quality_id']
        quality_exists = await quality_cypher.quality_exists(quality_id)
        if not quality_exists:
            raise HTTPException(status_code=404, detail=f"Quality ID {quality_id} not found")
    for topic in data_dict['topics']:
        topic_id = topic['topic_id']
        topic_exists = await topic_cypher.topic_exists(topic_id)
        if not topic_exists:
            raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    await event_cypher.update_event(event_id, data_dict)
    return await event_cypher.read_event_details(event_id)