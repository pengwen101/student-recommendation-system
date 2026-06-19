from pydantic import BaseModel
from typing import List, Dict, Set


class QualityIndicatorsInput(BaseModel):
    quality_id: str

class QualityIndicatorsResponse(BaseModel):
    quality_id: str
    code: str
    name: str
    
class IndicatorDetails(BaseModel):
    indicator_id: str
    name: str
    qualities: List[QualityIndicatorsResponse]

class IndicatorDetailsResponse(BaseModel):
    message: str
    indicator_details: IndicatorDetails
    
class IndicatorDetailsInput(BaseModel):
    code: str
    name: str
    qualities: List[QualityIndicatorsInput]
    
class AllIndicatorsResponse(BaseModel):
    message: str
    count: int
    indicators: List[IndicatorDetails]