from pydantic import BaseModel
from typing import List, Dict, Set

class SubCPLIndicatorsResponse(BaseModel):
    indicator_id: str
    code: str
    name: str
    weight: float
    
class SubCplIndicators(BaseModel):
    sub_cpl_id: str
    code: str
    name: str
    indicators: List[SubCPLIndicatorsResponse]
    
class AllSubCplIndicatorsResponse(BaseModel):
    message: str
    count: int
    subcpls: List[SubCplIndicators]


class SubCplUpdateInput(BaseModel):
    code: str
    name: str
    cpl_id: str


class SubCplUpdateResponse(BaseModel):
    sub_cpl_id: str
    code: str
    name: str
    cpl_id: str
    cpl_code: str
    cpl_name: str