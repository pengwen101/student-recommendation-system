from backend.curriculums import cypher as curriculum_cypher
from fastapi import HTTPException
from backend.curriculums.schemas import CurriculumResponse
from typing import List

async def read_curriculum(version_id: str):
    return await curriculum_cypher.read_curriculum(version_id)

