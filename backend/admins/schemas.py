from pydantic import BaseModel
from typing import List, Dict, Set

    
class AdminDetails(BaseModel):
    admin_id: str
    email: str
    name: str
    approved: bool

class AdminDetailsResponse(BaseModel):
    message: str
    admin_details: AdminDetails
    
class AdminUpdateInput(BaseModel):
    name: str
    
class AdminCreateInput(BaseModel):
    email: str
    name: str
    
class AllAdminsResponse(BaseModel):
    message: str
    count: int
    admins: List[AdminDetails]