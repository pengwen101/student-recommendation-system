from fastapi import APIRouter, Depends
from backend.auth.dependencies import require_admin
from backend.indicators.schemas import IndicatorDetailsResponse, IndicatorDetailsInput
from backend.indicators import services

indicators_router = APIRouter(prefix="/indicator", tags=["indicator"], dependencies=[Depends(require_admin())])

@indicators_router.put("/{indicator_id}", response_model=IndicatorDetailsResponse)
async def update_indicator(indicator_id: str, data: IndicatorDetailsInput):
    indicator_details = await services.update_indicator(indicator_id, data.model_dump())
    return {"message": "Indicator successfully updated.", "indicator_details": indicator_details}