from fastapi import APIRouter, HTTPException, status
from backend.resources.schemas import (AllResourcesResponse, ResourceDetailsResponse, ResourceDetailsInput)
from backend.resources import services
from typing import List

resources_router = APIRouter(prefix="/resource", tags=["resource"])

@resources_router.get("", response_model=AllResourcesResponse)
async def read_resources():
    resources = await services.read_resources()
    return {"message": "Resources successfully retrieved.", "count": len(resources), "resources": resources}

@resources_router.get("/{resource_id}", response_model=ResourceDetailsResponse)
async def read_resource_details(resource_id: str):
    resource_details = await services.read_resource_details(resource_id)
    return {"message": "Resource details successfully retrieved.", "resource_details": resource_details}

@resources_router.post("", response_model=ResourceDetailsResponse)
async def create_resource(data: ResourceDetailsInput):
    resource_details = await services.create_resource(data)
    return {"message": "Resource successfully created.", "resource_details": resource_details}

@resources_router.put("/{resource_id}", response_model=ResourceDetailsResponse)
async def update_resource(resource_id: str, data: ResourceDetailsInput):
    resource_details = await services.update_resource(resource_id, data)
    return {"message": "Resource successfully updated.", "resource_details": resource_details}