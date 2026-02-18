from fastapi import APIRouter, HTTPException, status
from backend.events.schemas import (AllEventsResponse, EventDetailsResponse, EventDetailsInput)
from backend.events import services
from typing import List

events_router = APIRouter(prefix="/event", tags=["event"])

@events_router.get("", response_model=AllEventsResponse)
async def read_events():
    events = await services.read_events()
    return {"message": "Events successfully retrieved.", "count": len(events), "events": events}

@events_router.get("/{event_id}", response_model=EventDetailsResponse)
async def read_event_details(event_id: str):
    event_details = await services.read_event_details(event_id)
    return {"message": "Event details successfully retrieved.", "event_details": event_details}

@events_router.post("", response_model=EventDetailsResponse)
async def create_event(data: EventDetailsInput):
    event_details = await services.create_event(data)
    return {"message": "Event successfully created.", "event_details": event_details}

@events_router.put("/{event_id}", response_model=EventDetailsResponse)
async def update_event(event_id: str, data: EventDetailsInput):
    event_details = await services.update_event(event_id, data)
    return {"message": "Event successfully updated.", "event_details": event_details}