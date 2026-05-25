from pydantic import BaseModel
from backend.resources.schemas import ResourceType

class StudentTarget(BaseModel):
    target_score: float
    
class ResourceAssessment(BaseModel):
    resource_assessment_id: str
    weight: float
    display_name: str
    resource_type: ResourceType