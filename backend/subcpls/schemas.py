from pydantic import BaseModel
from typing import List, Dict, Set

class SubCPLQualitiesResponse(BaseModel):
    quality_id: str
    code: str
    name: str
    weight: float
    
class SubCplDetails(BaseModel):
    sub_cpl_id: str
    code: str
    name: str
    qualities: List[SubCPLQualitiesResponse]

class SubCplDetailsResponse(BaseModel):
    message: str
    subcpl_details: SubCplDetails
    
class AllSubCplsResponse(BaseModel):
    message: str
    count: int
    subcpls: List[SubCplDetails]