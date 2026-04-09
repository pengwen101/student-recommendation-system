from pydantic import BaseModel, model_validator
from datetime import datetime
from typing import List, Dict, Set
from enum import Enum

class ResourceType(str, Enum):
    BOOK = "book"
    VIDEO = "video"
    EVENT = "event"

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
    BACHELOR = "bachelor"
    MASTER = "master"
    PHD = "phd"
    
class ResourceIndicatorsInput(BaseModel):
    indicator_id: str
    
class ResourceSubCplsInput(BaseModel):
    sub_cpl_id: str
    indicators: List[ResourceIndicatorsInput]
    
class ResourceTopicsInput(BaseModel):
    topic_id: str
    
class ResourceIndicatorsResponse(BaseModel):
    indicator_id: str
    code: str
    name: str

class ResourceCalculatedIndicatorsResponse(BaseModel):
    indicator_id: str
    code: str
    name: str
    weight: float

class ResourceQualitiesResponse(BaseModel):
    quality_id: str
    code: str
    name: str
    indicators: List[ResourceIndicatorsResponse]
    
class ResourceCalculatedQualitiesResponse(BaseModel):
    quality_id: str
    code: str
    name: str
    weight: float
    
class ResourceSubCplsResponse(BaseModel):
    sub_cpl_id: str
    code: str
    name: str
    indicators: List[ResourceIndicatorsResponse]
    
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
    
class ResourceDetails(BaseModel):
    resource_id: str
    type: ResourceType
    name: str
    description: str
    sessions: List[Session] | List
    status: ResourceStatus | None = None
    scale: ResourceScale | None = None
    speaker_degree: SpeakerDegree | None = None
    is_active: bool
    subcpls: List[ResourceSubCplsResponse]
    topics: List[ResourceTopicsResponse]
    calculations: ResourceSupportCalculations
    @model_validator(mode="after")
    def check_sessions(self):
        if self.type == 'event' and len(self.sessions) == 0:
            raise ValueError("Sessions must be provided when resource type is event.")
        if self.type != 'event' and len(self.sessions) > 0:
            raise ValueError(f"Sessions cannot be provided for resource type '{self.type}'.")
        return self

class ResourceDetailsResponse(BaseModel):
    message: str
    resource_details: ResourceDetails
    
class ResourceDetailsInput(BaseModel):
    type: ResourceType
    name: str
    description: str
    sessions: List[SessionInput] | List
    status: ResourceStatus | None = None
    scale: ResourceScale | None = None
    speaker_degree: SpeakerDegree | None = None
    subcpls: List[ResourceSubCplsInput]
    topics: List[ResourceTopicsInput]
    @model_validator(mode="after")
    def check_sessions(self):
        if self.type == 'event' and len(self.sessions) == 0:
            raise ValueError("Sessions must be provided when resource type is event.")
        if self.type != 'event' and len(self.sessions) > 0:
            raise ValueError(f"Sessions cannot be provided for resource type '{self.type}'.")
        return self
    
class AllResourcesResponse(BaseModel):
    message: str
    count: int
    resources: List[ResourceDetails]