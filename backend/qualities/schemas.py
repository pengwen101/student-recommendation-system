from pydantic import BaseModel
from typing import List, Dict, Set


class SubCPLQualitiesInput(BaseModel):
    sub_cpl_id: str
    weight: float

class SubCPLQualitiesResponse(BaseModel):
    sub_cpl_id: str
    code: str
    name: str
    weight: float
    
class QualityDetails(BaseModel):
    quality_id: str
    code: str
    name: str
    subcpls: List[SubCPLQualitiesResponse]

class QualityDetailsResponse(BaseModel):
    message: str
    quality_details: QualityDetails
    
class QualityDetailsInput(BaseModel):
    code: str
    name: str
    subcpls: List[SubCPLQualitiesInput]
    
class AllQualitiesResponse(BaseModel):
    message: str
    count: int
    qualities: List[QualityDetails]