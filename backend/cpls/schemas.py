from pydantic import BaseModel


class CPLUpdateInput(BaseModel):
    code: str
    name: str
    curriculum_version_id: str


class CPLUpdateResponse(BaseModel):
    cpl_id: str
    code: str
    name: str
    curriculum_version_id: str
