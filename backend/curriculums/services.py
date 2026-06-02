from backend.curriculums import cypher as curriculum_cypher
from fastapi import HTTPException
from backend.curriculums.schemas import CurriculumResponse
from typing import List

async def read_curriculum(version_id: str):
    return await curriculum_cypher.read_curriculum(version_id)

async def study_level_exists(study_level_id: str):
    return await curriculum_cypher.study_level_exists(study_level_id)

async def read_curriculum_versions():
    return await curriculum_cypher.read_curriculum_versions()

async def read_questions():
    questions = await curriculum_cypher.read_questions()
    return questions