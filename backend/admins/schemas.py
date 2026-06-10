from pydantic import BaseModel

class AdminDetails(BaseModel):
    admin_id: str
    email: str
    name: str
    approved: bool
    
class AdminCreateInput(BaseModel):
    email: str
    name: str