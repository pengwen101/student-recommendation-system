from pydantic import BaseModel


class QuestionUpdateInput(BaseModel):
    code: str
    name: str
    lower_bound: str
    upper_bound: str
    lower_text: str | None = None
    upper_text: str | None = None
    flipped: bool
    indicator_id: str


class QuestionUpdateResponse(BaseModel):
    question_id: str
    code: str
    name: str
    lower_bound: str
    upper_bound: str
    lower_text: str | None
    upper_text: str | None
    flipped: bool
    indicator_id: str
    indicator_code: str
    indicator_name: str
