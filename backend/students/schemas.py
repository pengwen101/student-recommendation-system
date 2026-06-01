from pydantic import BaseModel, Field
from typing import List, Dict, Set, Annotated
from backend.resources.schemas import ResourceEvent, ResourceBook, ResourceVideo, ResourceArticle

class StudentTopicsResponse(BaseModel):
    topic_id: str
    code: str
    name: str
    
class TopicActionResponse(BaseModel):
    message: str
    count: int
    topics: List[StudentTopicsResponse]
    
class StudentTopicsInput(BaseModel):
    topic_id: str
    
class StudentTopicsInputBatch(BaseModel):
    topics: List[StudentTopicsInput]
    
class StudentRecommendation(BaseModel):
    resource: Annotated[
        ResourceEvent | ResourceBook | ResourceVideo | ResourceArticle, 
        Field(discriminator="type")
    ]
    score: float

class StudentRecommendationsResponse(BaseModel):
    message: str
    count: int
    recommendations: List[StudentRecommendation]
    
    
class StudentIndicatorsResponse(BaseModel):
    indicator_id: str
    code: str
    name: str
    weight: float
    
class StudentSubCplsResponse(BaseModel):
    sub_cpl_id: str
    code: str
    name: str
    weight: float
    
class StudentCplsResponse(BaseModel):
    cpl_id: str
    code: str
    name: str
    weight: float
    
class IndicatorActionResponse(BaseModel):
    message: str
    count: int
    indicators: List[StudentIndicatorsResponse]
    
class SubCplActionResponse(BaseModel):
    message: str
    count: int
    subcpls: List[StudentSubCplsResponse]
    
class CplActionResponse(BaseModel):
    message: str
    count: int
    cpls: List[StudentCplsResponse]
    
class StudentIndicatorsInput(BaseModel):
    indicator_id: str
    weight: float
    
class StudentIndicatorsInputBatch(BaseModel):
    indicators: List[StudentIndicatorsInput]
    
class AttendedStudents(BaseModel):
    nrp: str
    full_name: str
    major: str