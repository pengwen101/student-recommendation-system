from fastapi import APIRouter, HTTPException, status
from backend.admins.schemas import (AllAdminsResponse, AdminDetailsResponse, AdminUpdateInput, AdminCreateInput)
from backend.admins import services
from typing import List

admins_router = APIRouter(prefix="/admin", tags=["admin"])

@admins_router.get("", response_model=AllAdminsResponse)
async def read_admins():
    admins = await services.read_admins()
    return {"message": "Admins successfully retrieved.", "count": len(admins), "admins": admins}

@admins_router.get("/{admin_id}", response_model=AdminDetailsResponse)
async def read_admin_details(admin_id: str):
    admin_details = await services.read_admin_details(admin_id)
    return {"message": "Admin details successfully retrieved.", "admin_details": admin_details}

@admins_router.post("", response_model=AdminDetailsResponse)
async def create_admin(data: AdminCreateInput):
    admin_details = await services.create_admin(data)
    return {"message": "Admin successfully created.", "admin_details": admin_details}

@admins_router.put("/approve/{admin_id}", response_model=AdminDetailsResponse)
async def approve_admin(admin_id: str):
    admin_details = await services.approve_admin(admin_id)
    return {"message": "Admin successfully approved.", "admin_details": admin_details}

@admins_router.put("/{admin_id}", response_model=AdminDetailsResponse)
async def update_admin(admin_id: str, data: AdminUpdateInput):
    admin_details = await services.update_admin(admin_id, data)
    return {"message": "Admin successfully updated.", "admin_details": admin_details}

@admins_router.delete("/{admin_id}")
async def delete_admin(admin_id: str):
    await services.delete_admin(admin_id)
    return {"message": "Admin successfully deleted."}