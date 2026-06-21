from pydantic import BaseModel, model_validator, field_validator, Field
from datetime import datetime
from typing import List, Dict, Optional, Any, Annotated, Literal
from enum import Enum
from backend.curriculums.schemas import StudyLevel
import json

class AuthorType(str, Enum):
    PERSONAL_BLOG = "personal_blog"
    PRACTITIONER = "practitioner"
    ACADEMIC = "academic"
    
class ThematicWeight(str, Enum):
    PERSONAL_OPINION = "personal_opinion"
    ACADEMIC_JOURNAL = "academic_journal"
    CRITIQUE = "critique"
    PHILOSOPHY = "philosophy"
    
class ImpactScale(str, Enum):
    LOCAL = "local"
    INTERNATIONAL = "international"
    WORLDWIDE = "worldwide"
    
class EditorBlock(BaseModel):
    id: Optional[str] = None
    type: str
    data: Dict[str, Any]

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
    
class ResourceAssessment(BaseModel):
    resource_assessment_id: str
    display_name: str
    resource_type: str
    weight: float
    resource_weight: float
    
class ResourceAssessmentInput(BaseModel):
    resource_assessment_id: str
    resource_weight: float
    
class ResourceBase(BaseModel):
    resource_id: str
    title: str
    is_active: bool
    text_hash: str | None = None
    internal_weight: float
    resource_assessments: List[ResourceAssessment] | None = None
    topics: List[ResourceTopicsResponse]
    indicators: List[ResourceIndicatorsInput]
    calculations: ResourceSupportCalculations
    
class ResourceBaseInput(BaseModel):
    title: str
    is_active: bool
    text_hash: str | None = None
    resource_assessments: List[ResourceAssessmentInput] | None = None
    topics: List[ResourceTopicsInput]
    indicators: List[ResourceIndicatorsInput]
  
class ResourceEvent(ResourceBase):
    type: Literal["event"]
    description: str
    sessions: List[Session]
    organizers: List[ResourceOrganizerDetails]
    study_levels: List[StudyLevel]
    status: ResourceStatus
    
class ResourceBook(ResourceBase):
    type: Literal["book"]
    description: str
    authors: List[str]
    publisher: str
    published_date: datetime
    isbn: str
    
class ResourceVideo(ResourceBase):
    type: Literal["video"]
    description: str
    content_link: str
    
class ResourceArticle(ResourceBase):
    type: Literal["article"]
    article_text: EditorData
    
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
    
class ResourceDetails(BaseModel):
    resource_id: str
    type: ResourceType
    title: str
    description: str | None = None
    authors: List[str] | None = None
    publisher: str | None = None
    published_date: datetime | None = None
    isbn: str | None = None
    content_link: str | None = None
    article_text: Optional[EditorData] = None
    study_levels: List[StudyLevel] | None = None
    sessions: List[Session] | None = None
    organizers: List[ResourceOrganizerDetails] | None = None
    status: ResourceStatus | None = None
    scale: ResourceScale | None = None
    speaker_degree: SpeakerDegree | None = None
    thematic_weight: ThematicWeight | None = None
    author_type: AuthorType | None = None
    impact_scale: ImpactScale | None = None
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
    resource_details: Annotated[
        ResourceEvent | ResourceBook | ResourceVideo | ResourceArticle, 
        Field(discriminator="type")
    ]


class ResourceEventInput(ResourceBaseInput):
    description: str
    sessions: List[SessionInput]
    organizers: List[dict]
    status: ResourceStatus
    study_levels: List[StudyLevel]
    
class ResourceBookInput(ResourceBaseInput):
    description: str
    authors: List[str]
    publisher: str
    published_date: datetime
    isbn: str
    
class ResourceVideoInput(ResourceBaseInput):
    description: str
    content_link: str
    
class ResourceArticleInput(ResourceBaseInput):
    article_text: EditorData
    
class AllResourcesResponse(BaseModel):
    message: str
    count: int
    resources: List[Annotated[
        ResourceEvent | ResourceBook | ResourceVideo | ResourceArticle, 
        Field(discriminator="type")
    ]]
    
class IndicatorRecommendation(BaseModel):
    similar_resource_id: str
    similar_resource_type: ResourceType
    similar_resource_title: str
    suggested_indicator_ids: List[str]