from pydantic import BaseModel


class UserResponse(BaseModel):
    authenticated: bool
    user_id: str
    role: str
    email: str
    name: str
