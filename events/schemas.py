from pydantic import BaseModel
from typing import List, Dict, Set


class EventQualitiesInput(BaseModel):
    quality_id: str
    weight: float
    
class EventTopicsInput(BaseModel):
    topic_id: int
    weight: float

class EventQualitiesResponse(BaseModel):
    quality_id: str
    quality_description: str
    weight: float
    
class EventTopicsResponse(BaseModel):
    topic_id: int
    topic_description: str
    weight: float
    
class EventDetails(BaseModel):
    event_id: str
    event_name: str
    qualities: List[EventQualitiesResponse]
    topics: List[EventTopicsResponse]

class EventDetailsResponse(BaseModel):
    message: str
    event_details: EventDetails
    
class EventDetailsInput(BaseModel):
    event_name: str
    qualities: List[EventQualitiesInput]
    topics: List[EventTopicsInput]
    
class AllEventsResponse(BaseModel):
    message: str
    count: int
    events: List[EventDetails]