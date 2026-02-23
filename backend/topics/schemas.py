from pydantic import BaseModel
from typing import List, Dict, Set

    
class TopicDetails(BaseModel):
    topic_id: str
    code: str
    name: str

class TopicDetailsResponse(BaseModel):
    message: str
    topic_details: TopicDetails
    
class TopicDetailsInput(BaseModel):
    code: str
    name: str
    
class AllTopicsResponse(BaseModel):
    message: str
    count: int
    topics: List[TopicDetails]