from fastapi import APIRouter, HTTPException, status
from backend.qualities.schemas import (AllQualitiesResponse, QualityDetailsResponse, QualityDetailsInput)
from backend.qualities import services
from typing import List

qualities_router = APIRouter(prefix="/quality", tags=["quality"])

@qualities_router.get("", response_model=AllQualitiesResponse)
async def read_qualities():
    qualities = await services.read_qualities()
    return {"message": "Qualities successfully retrieved.", "count": len(qualities), "qualities": qualities}

@qualities_router.get("/{quality_id}", response_model=QualityDetailsResponse)
async def read_quality_details(quality_id: str):
    quality_details = await services.read_quality_details(quality_id)
    return {"message": "Quality details successfully retrieved.", "quality_details": quality_details}

@qualities_router.post("", response_model=QualityDetailsResponse)
async def create_quality(data: QualityDetailsInput):
    quality_details = await services.create_quality(data)
    return {"message": "Quality successfully created.", "quality_details": quality_details}

@qualities_router.put("/{quality_id}", response_model=QualityDetailsResponse)
async def update_quality(quality_id: str, data: QualityDetailsInput):
    quality_details = await services.update_quality(quality_id, data)
    return {"message": "Quality successfully updated.", "quality_details": quality_details}

@qualities_router.delete("/{quality_id}")
async def delete_quality(quality_id: str):
    await services.delete_quality(quality_id)
    return {"message": "Quality successfully deleted."}