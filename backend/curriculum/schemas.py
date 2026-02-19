from pydantic import BaseModel
from typing import List, Dict, Set

class QuestionResponse:
    question_id: str
    question_description: str
    
class IndicatorResponse:
    indicator_id: str
    indicator_description: str
    questions: List[QuestionResponse]

class CurriculumQuestionResponse(BaseModel):
    quality_id: str
    quality_description: str
    indicators: List[IndicatorResponse]

class QualityResponse(BaseModel):
    quality_id: str
    quality_description: str
    weight: float
    
class SubCPLResponse(BaseModel):
    subcpl_id: str
    subcpl_description: str
    qualities: List[QualityResponse]
    
class CPLResponse(BaseModel):
    cpl_id: str
    cpl_description: str
    subcpls: List[QualityResponse]

class CurriculumResponse(BaseModel):
    cpls: List[CPLResponse]