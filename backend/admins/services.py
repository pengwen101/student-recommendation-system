from backend.admins import cypher as admin_cypher
from fastapi import HTTPException
from backend.admins.schemas import AdminCreateInput
import uuid

async def read_admins():
    return await admin_cypher.read_admins()

async def read_admin_details(admin_id: str):
    admin_exists = await admin_cypher.admin_exists(admin_id)
    if not admin_exists:
        raise HTTPException(status_code=404, detail=f"Admin ID {admin_id} not found")
    return await admin_cypher.read_admin_details(admin_id)

async def admin_exists(admin_id: str):
    admin_exists = await admin_cypher.admin_exists(admin_id)
    return admin_exists

async def get_id_from_email(email: str):
    result = await admin_cypher.get_id_from_email(email)
    return result

async def create_admin(data: AdminCreateInput):
    new_admin_id = str(uuid.uuid4())
    data_dict = data.model_dump()
    await admin_cypher.create_admin(new_admin_id, data_dict)
    return await admin_cypher.read_admin_details(new_admin_id)

async def approve_admin(admin_id: str):
    await admin_cypher.approve_admin(admin_id)
    return await admin_cypher.read_admin_details(admin_id)

async def delete_admin(admin_id: str):
    admin_exists = await admin_cypher.admin_exists(admin_id)
    if not admin_exists:
        raise HTTPException(status_code=404, detail=f"Admin ID {admin_id} not found")
    await admin_cypher.delete_admin(admin_id)