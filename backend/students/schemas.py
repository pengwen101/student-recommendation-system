from pydantic import BaseModel
from typing import List, Dict, Set

class StudentTopicsResponse(BaseModel):
    topic_id: int
    name: str
    weight: float
    
class TopicActionResponse(BaseModel):
    message: str
    count: int
    topics: List[StudentTopicsResponse]
    
class StudentTopicsInput(BaseModel):
    topic_id: int
    weight: float
    
class StudentTopicsInputBatch(BaseModel):
    topics: List[StudentTopicsInput]
    
class StudentRecommendation(BaseModel):
    event_id: str
    name: str
    probability_score: float

class StudentRecommendationsResponse(BaseModel):
    message: str
    count: int
    recommendations: List[StudentRecommendation]
    
    
class StudentQualitiesResponse(BaseModel):
    quality_id: str
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