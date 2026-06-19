from pydantic import BaseModel
from backend.resources.schemas import ResourceType

class StudentTarget(BaseModel):
    target_score: float
    
class ResourceAssessment(BaseModel):
    resource_assessment_id: str
    weight: float
    display_name: str
    resource_type: ResourceType
    
class ResourceAssessmentInput(BaseModel):
    weight: float
    display_name: str
    resource_type: ResourceType
    
class ResourceAssessmentUpdate(BaseModel):
    resource_assessment_id: str
    weight: float
    display_name: str
    resource_type: ResourceType
    
class RecommendationWeight(BaseModel):
    need_weight: float
    interest_weight: float

class AddScoreConstant(BaseModel):
    weight: float