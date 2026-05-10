from backend.subcpls import cypher as subcpl_cypher
from backend.qualities import cypher as quality_cypher
from fastapi import HTTPException
from typing import List
import uuid

async def read_subcpls(version_id: str):
    return await subcpl_cypher.read_subcpls(version_id)

async def read_subcpl_indicators(version_id: str):
    return await subcpl_cypher.read_subcpl_indicators(version_id)

async def read_subcpl_details(sub_cpl_id: str):
    subcpl_exists = await subcpl_cypher.subcpl_exists(sub_cpl_id)
    if not subcpl_exists:
        raise HTTPException(status_code=404, detail=f"SubCpl ID {sub_cpl_id} not found")
    return await subcpl_cypher.read_subcpl_details(sub_cpl_id)