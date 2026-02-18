from pydantic import BaseModel
from typing import List, Dict, Set


class SubCPLQualitiesInput(BaseModel):
    subcpl_id: str
    weight: float

class SubCPLQualitiesResponse(BaseModel):
    subcpl_id: str
    subcpl_description: str
    weight: float
    
class QualityDetails(BaseModel):
    quality_id: str
    quality_description: str
    subcpls: List[SubCPLQualitiesResponse]

class QualityDetailsResponse(BaseModel):
    message: str
    quality_details: QualityDetails
    
class QualityDetailsInput(BaseModel):
    quality_description: str
    subcpls: List[SubCPLQualitiesInput]
    
class AllQualitiesResponse(BaseModel):
    message: str
    count: int
    qualities: List[QualityDetails]