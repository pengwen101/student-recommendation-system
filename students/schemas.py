from pydantic import BaseModel
from typing import List, Dict, Set

class StudentTopicsResponse(BaseModel):
    topic_id: int
    topic_description: str
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
    event_name: str
    probability_score: float

class StudentRecommendationsResponse(BaseModel):
    message: str
    count: int
    recommendations: List[StudentRecommendation]
    
    
class StudentQualitiesResponse(BaseModel):
    quality_id: str
    quality_description: str
    lack_value: float
    
class QualityActionResponse(BaseModel):
    message: str
    count: int
    qualities: List[StudentQualitiesResponse]
    
class StudentQualitiesInput(BaseModel):
    quality_id: str
    lack_value: float
    
class StudentQualitiesInputBatch(BaseModel):
    qualities: List[StudentQualitiesInput]