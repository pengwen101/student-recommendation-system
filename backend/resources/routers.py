from fastapi import APIRouter, HTTPException, status
from backend.resources.schemas import (AllResourcesResponse, ResourceDetailsResponse, ResourceDetailsInput)
from backend.resources import services
from typing import List

resources_router = APIRouter(prefix="/resource", tags=["resource"])
recommendation_configs_router = APIRouter(prefix="/recommendation-config", tags=["config"])

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

@resources_router.put("/activate/{resource_id}", response_model=ResourceDetailsResponse)
async def activate_resource(resource_id: str):
    resource_details = await services.activate_resource(resource_id)
    return {"message": "Resource successfully activated.", "resource_details": resource_details}

@resources_router.put("/archive/{resource_id}", response_model=ResourceDetailsResponse)
async def archive_resource(resource_id: str):
    resource_details = await services.archive_resource(resource_id)
    return {"message": "Resource successfully archived.", "resource_details": resource_details}

@resources_router.delete("/{resource_id}", response_model=ResourceDetailsResponse)
async def delete_resource(resource_id: str):
    resource_details = await services.delete_resource(resource_id)
    return {"message": "Resource successfully deleted.", "resource_details": resource_details}