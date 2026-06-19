from backend.subcpls import cypher as subcpl_cypher
from backend.cpls import cypher as cpl_cypher
from backend.qualities import cypher as quality_cypher
from backend.students import services as student_services
from fastapi import HTTPException
from typing import List
import uuid

async def read_subcpl_indicators(version_id: str):
    return await subcpl_cypher.read_subcpl_indicators(version_id)

async def update_subcpl(sub_cpl_id: str, data: dict):
    subcpl_exists = await subcpl_cypher.subcpl_exists(sub_cpl_id)
    if not subcpl_exists:
        raise HTTPException(status_code=404, detail=f"SubCpl ID {sub_cpl_id} not found")
    cpl_exists = await cpl_cypher.cpl_exists(data["cpl_id"])
    if not cpl_exists:
        raise HTTPException(status_code=404, detail=f"CPL ID {data['cpl_id']} not found")
    old_data = await subcpl_cypher.read_subcpl_details_with_parent(sub_cpl_id)
    old_cpl_id = old_data['cpl_id']

    await subcpl_cypher.update_subcpl(sub_cpl_id, data)

    if old_cpl_id != data['cpl_id']:
        await student_services.recalculate_all_student_scores()

    return await subcpl_cypher.read_subcpl_details_with_parent(sub_cpl_id)