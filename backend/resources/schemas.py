from pydantic import BaseModel
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
    
class ResourceQualitiesInput(BaseModel):
    quality_id: str
    weight: float
    
class ResourceSubCplsInput(BaseModel):
    sub_cpl_id: str
    weight: float
    qualities: List[ResourceQualitiesInput]
    
class ResourceTopicsInput(BaseModel):
    topic_id: int
    weight: float

class ResourceQualitiesResponse(BaseModel):
    quality_id: str
    code: str
    name: str
    weight: float
    
class ResourceSubCplsResponse(BaseModel):
    sub_cpl_id: str
    code: str
    name: str
    weight: float
    qualities: List[ResourceQualitiesResponse]
    
class ResourceTopicsResponse(BaseModel):
    topic_id: int
    code: str
    name: str
    weight: float
    
class ResourceDetails(BaseModel):
    resource_id: str
    type: ResourceType
    name: str
    description: str
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    status: ResourceStatus | None = None
    is_active: bool
    subcpls: List[ResourceSubCplsResponse]
    topics: List[ResourceTopicsResponse]
    calculated_qualities: List[ResourceQualitiesResponse]

class ResourceDetailsResponse(BaseModel):
    message: str
    resource_details: ResourceDetails
    
class ResourceDetailsInput(BaseModel):
    type: ResourceType
    name: str
    description: str
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    status: ResourceStatus | None = None
    subcpls: List[ResourceSubCplsInput]
    topics: List[ResourceTopicsInput]
    
class AllResourcesResponse(BaseModel):
    message: str
    count: int
    resources: List[ResourceDetails]