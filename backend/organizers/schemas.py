from pydantic import BaseModel
from typing import List
from datetime import datetime

class OrganizerDetails(BaseModel):
    organizer_id: str
    name: str
    created_at: datetime
    updated_at: datetime

class OrganizerDetailsInput(BaseModel):
    name: str
    
class OrganizerDetailsResponse(BaseModel):
    message: str
    organizer_details: OrganizerDetails
    
class AllOrganizerDetailsResponse(BaseModel):
    message: str
    count: int
    organizers: List[OrganizerDetails]