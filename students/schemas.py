from pydantic import BaseModel
from typing import List, Dict, Set

class StudentTopicsResponse(BaseModel):
    topic_id: str
    name: str

class StudentTopicsCreate(BaseModel):
    topic_ids: List[str]
    
class StudentTopicsUpdate(BaseModel):
    topic_ids: List[str]