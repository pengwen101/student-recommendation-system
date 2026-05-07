from pydantic import BaseModel, model_validator, field_validator
from datetime import datetime
from typing import List, Dict, Optional, Any
from enum import Enum
from backend.curriculums.schemas import StudyLevel
import json

class EditorBlock(BaseModel):
    id: Optional[str] = None
    type: str
    data: Dict[str, Any]  # The non-strict dict validation

class EditorData(BaseModel):
    time: Optional[int] = None
    version: Optional[str] = None
    blocks: List[EditorBlock]

class ResourceType(str, Enum):
    BOOK = "book"
    VIDEO = "video"
    EVENT = "event"
    ARTICLE = "article"

class ResourceStatus(str, Enum):
    OPEN = "open"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    
class ResourceScale(str, Enum):
    UNIVERSITY = "university"
    REGIONAL = "regional"
    NATIONAL = "national"
    INTERNATIONAL = "international"
    
class SpeakerDegree(str, Enum):
    UNI_STUDENT = "university_student"
    BACHELOR = "bachelor"
    MASTER = "master"
    PHD = "phd"
    
class ActorType(str, Enum):
    ADMIN = "admin"
    ORGANIZER = "organizer"
    
class ResourceIndicatorsInput(BaseModel):
    indicator_id: str
    
class ResourceTopicsInput(BaseModel):
    topic_id: str
    
class ResourceTopicsResponse(BaseModel):
    topic_id: str
    code: str
    name: str
    
class Session(BaseModel):
    session_id: str
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    
class SessionInput(BaseModel):
    session_id: str | None = None
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    
class ResourceSupportCalculations(BaseModel):
    indicators: List[Dict[str, str | float]]
    qualities: List[Dict[str, str | float]]
    subcpls: List[Dict[str, str | float]]
    
class ResourceOrganizerDetails(BaseModel):
    organizer_id: str
    name: str
    
class ResourceDetails(BaseModel):
    resource_id: str
    type: ResourceType
    name: str
    description: str | None = None
    article_text: Optional[EditorData] = None
    study_levels: List[StudyLevel] | None = None
    sessions: List[Session] | None = None
    organizers: List[ResourceOrganizerDetails] | None = None
    status: ResourceStatus | None = None
    scale: ResourceScale | None = None
    speaker_degree: SpeakerDegree | None = None
    is_active: bool
    topics: List[ResourceTopicsResponse]
    indicators: List[ResourceIndicatorsInput]
    calculations: ResourceSupportCalculations
    @model_validator(mode="after")
    def check_sessions(self):
        if self.type == 'event' and not self.sessions:
            raise ValueError("Sessions must be provided when resource type is event.")
        if self.type != 'event' and self.sessions:
            raise ValueError(f"Sessions cannot be provided for resource type '{self.type}'.")
        return self
    
    @field_validator("article_text", mode="before")
    @classmethod
    def parse_article_text(cls, value):
        if not value: 
            return None
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return None 
        return value

class ResourceDetailsResponse(BaseModel):
    message: str
    resource_details: ResourceDetails


class ActorInput(BaseModel):
    actor_id: str
    actor_type: ActorType
    
class ResourceDetailsInput(BaseModel):
    type: ResourceType
    name: str
    description: str | None = None
    article_text: Optional[EditorData] = None
    study_levels: List[StudyLevel] | None = None
    sessions: List[SessionInput] | None = None
    organizers: List[dict] | None = None
    status: ResourceStatus | None = None
    scale: ResourceScale | None = None
    speaker_degree: SpeakerDegree | None = None
    indicators: List[ResourceIndicatorsInput]
    topics: List[ResourceTopicsInput]
    @model_validator(mode="after")
    def check_sessions(self):
        if self.type == 'event' and not self.sessions:
            raise ValueError("Sessions must be provided when resource type is event.")
        if self.type != 'event' and self.sessions:
            raise ValueError(f"Sessions cannot be provided for resource type '{self.type}'.")
        return self
    
class AllResourcesResponse(BaseModel):
    message: str
    count: int
    resources: List[ResourceDetails]