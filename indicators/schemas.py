from pydantic import BaseModel
from typing import List, Dict, Set


class QualityIndicatorsInput(BaseModel):
    quality_id: str
    weight: float

class QualityIndicatorsResponse(BaseModel):
    quality_id: str
    quality_description: str
    weight: float
    
class IndicatorDetails(BaseModel):
    indicator_id: str
    indicator_description: str
    qualities: List[QualityIndicatorsResponse]

class IndicatorDetailsResponse(BaseModel):
    message: str
    indicator_details: IndicatorDetails
    
class IndicatorDetailsInput(BaseModel):
    indicator_description: str
    qualities: List[QualityIndicatorsInput]
    
class AllIndicatorsResponse(BaseModel):
    message: str
    count: int
    indicators: List[IndicatorDetails]