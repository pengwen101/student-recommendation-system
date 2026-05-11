from pydantic import BaseModel

class StudentTarget(BaseModel):
    target_score: float