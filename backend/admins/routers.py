from fastapi import APIRouter, HTTPException, status, Depends
from backend.auth.dependencies import require_admin
from backend.admins.schemas import (AdminDetails, AdminCreateInput)
from backend.admins import services
from typing import List

admins_router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin())])

@admins_router.get("", response_model=List[AdminDetails])
async def read_admins():
    return await services.read_admins()

@admins_router.get("/{admin_id}", response_model=AdminDetails)
async def read_admin_details(admin_id: str):
    return await services.read_admin_details(admin_id)

@admins_router.post("", response_model=AdminDetails)
async def create_admin(data: AdminCreateInput):
    return await services.create_admin(data)

@admins_router.put("/approve/{admin_id}", response_model=AdminDetails)
async def approve_admin(admin_id: str):
    return await services.approve_admin(admin_id)

@admins_router.delete("/{admin_id}")
async def delete_admin(admin_id: str):
    await services.delete_admin(admin_id)