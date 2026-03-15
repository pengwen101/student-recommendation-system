from pydantic import BaseModel
from typing import List, Dict, Set
from backend.resources.schemas import ResourceDetails

class StudentTopicsResponse(BaseModel):
    topic_id: str
    code: str
    name: str
    weight: float
    
class TopicActionResponse(BaseModel):
    message: str
    count: int
    topics: List[StudentTopicsResponse]
    
class StudentTopicsInput(BaseModel):
    topic_id: str
    weight: float
    
class StudentTopicsInputBatch(BaseModel):
    topics: List[StudentTopicsInput]
    
class StudentRecommendation(BaseModel):
    resource: ResourceDetails
    probability_score: float

class StudentRecommendationsResponse(BaseModel):
    message: str
    count: int
    recommendations: List[StudentRecommendation]
    
    
class StudentQualitiesResponse(BaseModel):
    quality_id: str
    code: str
    name: str
    weight: float
    
class QualityActionResponse(BaseModel):
    message: str
    count: int
    qualities: List[StudentQualitiesResponse]
    
class StudentQualitiesInput(BaseModel):
    quality_id: str
    weight: float
    
class StudentQualitiesInputBatch(BaseModel):
    qualities: List[StudentQualitiesInput]