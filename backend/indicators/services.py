from backend.indicators import cypher as indicator_cypher
from backend.qualities import cypher as quality_cypher
from backend.students import services as student_services
from fastapi import HTTPException
import uuid


async def read_indicators():
    return await indicator_cypher.read_indicators()


async def read_indicator_details(indicator_id: str):
    indicator_exists = await indicator_cypher.indicator_exists(indicator_id)
    if not indicator_exists:
        raise HTTPException(status_code=404, detail=f"Indicator ID {indicator_id} not found")
    return await indicator_cypher.read_indicator_details(indicator_id)


async def create_indicator(data: dict):
    new_indicator_id = str(uuid.uuid4())
    for quality in data["qualities"]:
        quality_exists = await quality_cypher.quality_exists(quality["quality_id"])
        if not quality_exists:
            raise HTTPException(
                status_code=404, detail=f"Quality ID {quality['quality_id']} not found"
            )
    await indicator_cypher.create_indicator(new_indicator_id, data)
    return await indicator_cypher.read_indicator_details(new_indicator_id)


async def update_indicator(indicator_id: str, data: dict):
    indicator_exists = await indicator_cypher.indicator_exists(indicator_id)
    if not indicator_exists:
        raise HTTPException(status_code=404, detail=f"Indicator ID {indicator_id} not found")
    for quality in data["qualities"]:
        quality_exists = await quality_cypher.quality_exists(quality["quality_id"])
        if not quality_exists:
            raise HTTPException(
                status_code=404, detail=f"Quality ID {quality['quality_id']} not found"
            )
    old_data = await indicator_cypher.read_indicator_details(indicator_id)
    old_quality_id = old_data['qualities'][0]['quality_id'] if old_data['qualities'] else None
    new_quality_id = data['qualities'][0]['quality_id'] if data['qualities'] else None

    await indicator_cypher.update_indicator(indicator_id, data)

    if old_quality_id != new_quality_id:
        await student_services.recalculate_all_student_scores()

    return await indicator_cypher.read_indicator_details(indicator_id)


async def delete_indicator(indicator_id: str):
    indicator_exists = await indicator_cypher.indicator_exists(indicator_id)
    if not indicator_exists:
        raise HTTPException(status_code=404, detail=f"Indicator ID {indicator_id} not found")
    await indicator_cypher.delete_indicator(indicator_id)
