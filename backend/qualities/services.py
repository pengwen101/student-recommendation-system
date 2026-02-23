from backend.qualities import cypher as quality_cypher
from backend.subcpls import cypher as subcpl_cypher
from backend.topics import cypher as topic_cypher
from fastapi import HTTPException
from backend.qualities.schemas import QualityDetailsResponse, AllQualitiesResponse, QualityDetailsInput
from typing import List
import uuid

async def read_qualities():
    return await quality_cypher.read_qualities()

async def read_quality_details(quality_id: str):
    quality_exists = await quality_cypher.quality_exists(quality_id)
    if not quality_exists:
        raise HTTPException(status_code=404, detail=f"Quality ID {quality_id} not found")
    return await quality_cypher.read_quality_details(quality_id)

async def create_quality(data: QualityDetailsInput):
    new_quality_id = str(uuid.uuid4())
    data_dict = data.model_dump()
    for subcpl in data_dict['subcpls']:
        sub_cpl_id = subcpl['sub_cpl_id']
        subcpl_exists = await subcpl_cypher.subcpl_exists(sub_cpl_id)
        if not subcpl_exists:
            raise HTTPException(status_code=404, detail=f"SubCPL ID {sub_cpl_id} not found")
    await quality_cypher.create_quality(new_quality_id, data_dict)
    return await quality_cypher.read_quality_details(new_quality_id)

async def update_quality(quality_id: str, data: QualityDetailsInput):
    quality_exists = await quality_cypher.quality_exists(quality_id)
    if not quality_exists:
        raise HTTPException(status_code=404, detail=f"Quality ID {quality_id} not found")
    data_dict = data.model_dump()
    for subcpl in data_dict['subcpls']:
        sub_cpl_id = subcpl['sub_cpl_id']
        subcpl_exists = await subcpl_cypher.subcpl_exists(sub_cpl_id)
        if not subcpl_exists:
            raise HTTPException(status_code=404, detail=f"SubCPL ID {sub_cpl_id} not found")
    await quality_cypher.update_quality(quality_id, data_dict)
    return await quality_cypher.read_quality_details(quality_id)

async def delete_quality(quality_id: str):
    quality_exists = await quality_cypher.quality_exists(quality_id)
    if not quality_exists:
        raise HTTPException(status_code=404, detail=f"Quality ID {quality_id} not found")
    await quality_cypher.delete_quality(quality_id)