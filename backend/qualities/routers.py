from fastapi import APIRouter, Depends
from backend.auth.dependencies import require_admin
from backend.qualities.schemas import QualityDetailsResponse, QualityDetailsInput
from backend.qualities import services

qualities_router = APIRouter(prefix="/quality", tags=["quality"], dependencies=[Depends(require_admin())])

@qualities_router.put("/{quality_id}", response_model=QualityDetailsResponse)
async def update_quality(quality_id: str, data: QualityDetailsInput):
    quality_details = await services.update_quality(quality_id, data)
    return {"message": "Quality successfully updated.", "quality_details": quality_details}