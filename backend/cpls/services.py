from backend.cpls import cypher as cpl_cypher
from fastapi import HTTPException


async def update_cpl(cpl_id: str, data: dict):
    cpl_exists = await cpl_cypher.cpl_exists(cpl_id)
    if not cpl_exists:
        raise HTTPException(status_code=404, detail=f"CPL ID {cpl_id} not found")

    await cpl_cypher.update_cpl(cpl_id, data)
    return await cpl_cypher.read_cpl_details(cpl_id)
