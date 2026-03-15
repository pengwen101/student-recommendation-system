from pydantic import BaseModel
from typing import List, Dict, Set

class QuestionResponse(BaseModel):
    question_id: str
    name: str
    
class IndicatorResponse(BaseModel):
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
    subcpls: List[SubCPLResponse]

class CurriculumResponse(BaseModel):
    message: str
    curriculum: List[CPLResponse]