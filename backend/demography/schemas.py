from pydantic import BaseModel

class Major(BaseModel):
    major_id: str
    major_name: str
    faculty_id: str
    faculty_name: str
    
class Batch(BaseModel):
    batch_id: str