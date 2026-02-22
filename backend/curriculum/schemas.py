from pydantic import BaseModel
from typing import List, Dict, Set

class QuestionResponse:
    question_id: str
    name: str
    
class IndicatorResponse:
    indicator_id: str
    code: str
    name: str
    questions: List[QuestionResponse]

class CurriculumQuestionResponse(BaseModel):
    quality_id: str
    code: str
    name: str
    indicators: List[IndicatorResponse]

class QualityResponse(BaseModel):
    quality_id: str
    code: str
    name: str
    weight: float
    
class SubCPLResponse(BaseModel):
    sub_cpl_id: str
    code: str
    name: str
    qualities: List[QualityResponse]
    
class CPLResponse(BaseModel):
    cpl_id: str
    code: str
    name: str
    subcpls: List[QualityResponse]

class CurriculumResponse(BaseModel):
    cpls: List[CPLResponse]