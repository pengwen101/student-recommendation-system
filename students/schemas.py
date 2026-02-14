from pydantic import BaseModel
from typing import List, Dict, Set

class StudentTopicsResponse(BaseModel):
    topic_id: int
    topic_description: str
    
class TopicActionResponse(BaseModel):
    message: str
    count: int
    topics: List[StudentTopicsResponse]

class StudentTopicsCreate(BaseModel):
    topic_ids: List[int]
    
class StudentTopicsUpdate(BaseModel):
    topic_ids: List[int]