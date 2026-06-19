from pydantic import BaseModel
from typing import List, Dict, Set

class QuestionResponse(BaseModel):
    question_id: str
    code: str
    name: str
    lower_bound: str
    upper_bound: str
    lower_text: str | None = None
    upper_text: str | None = None
    
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
    indicators: List[IndicatorResponse]
    
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
    
class StudyLevel(BaseModel):
    study_level_id: str
    
class CurriculumVersion(BaseModel):
    curriculum_version_id: str

class CurriculumVersionResponse(BaseModel):
    message: str
    curriculum_versions: List[CurriculumVersion]