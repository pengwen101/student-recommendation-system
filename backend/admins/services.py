from backend.admins import cypher as admin_cypher
from fastapi import HTTPException
from backend.admins.schemas import AdminDetailsResponse, AllAdminsResponse, AdminCreateInput, AdminUpdateInput
from typing import List
import uuid

async def read_admins():
    return await admin_cypher.read_admins()

async def read_admin_details(admin_id: str):
    admin_exists = await admin_cypher.admin_exists(admin_id)
    if not admin_exists:
        raise HTTPException(status_code=404, detail=f"Admin ID {admin_id} not found")
    return await admin_cypher.read_admin_details(admin_id)

async def admin_exists(email: str):
    admin_exists = await admin_cypher.admin_exists(email)
    return admin_exists

async def get_id_from_email(email: str):
    admin_id = await admin_cypher.get_id_from_email(email)
    return admin_id

async def create_admin(data: AdminCreateInput):
    new_admin_id = str(uuid.uuid4())
    data_dict = data.model_dump()
    await admin_cypher.create_admin(new_admin_id, data_dict)
    return await admin_cypher.read_admin_details(new_admin_id)

async def approve_admin(admin_id: str):
    await admin_cypher.approve_admin(admin_id)
    return await admin_cypher.read_admin_details(admin_id)

async def update_admin(admin_id: str, data: AdminUpdateInput):
    admin_exists = await admin_cypher.admin_exists(admin_id)
    if not admin_exists:
        raise HTTPException(status_code=404, detail=f"Admin ID {admin_id} not found")
    data_dict = data.model_dump()
    await admin_cypher.update_admin(admin_id, data_dict)
    return await admin_cypher.read_admin_details(admin_id)

async def delete_admin(admin_id: str):
    admin_exists = await admin_cypher.admin_exists(admin_id)
    if not admin_exists:
        raise HTTPException(status_code=404, detail=f"admin ID {admin_id} not found")
    await admin_cypher.delete_admin(admin_id)