from pydantic import BaseModel
from typing import List, Dict, Set
from datetime import date
from backend.resources.schemas import ResourceType
from enum import Enum


class SupportLackGap(BaseModel):
    id: str
    code: str
    name: str
    lack_score: float
    support_score: float
    student_count: int
    avg_lack_score: float
    resource_count: int
    avg_support_score: float
    
class ResourceSupportingX(BaseModel):
    resource_name: str
    resource_type: ResourceType
    organizers: List[str]
    topics: List[str]
    status: str
    attendees: int
    
class ResourceSupport(BaseModel):
    id: str
    code: str
    name: str
    support_score: float
    
class ResourceCharacteristic(BaseModel):
    resource_id: str
    sub_cpl_count: int
    sub_cpl_avg_support: float
    
class OrganizerSupport(BaseModel):
    organizer_id: str
    organizer_name: str
    curriculum_id: str
    curriculum_code: str
    support_score: float
    
class StudentMastery(BaseModel):
    curriculum_id: str
    curriculum_code: str
    curriculum_name: str
    mastery_score: float
    target_score: float
    
class CurriculumType(str, Enum):
    CPL = "cpl"
    SUBCPL = "sub_cpl"
    QUALITY = "quality"
    INDICATOR = "indicator"