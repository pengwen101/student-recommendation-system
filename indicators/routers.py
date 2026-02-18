from fastapi import APIRouter, HTTPException, status
from backend.indicators.schemas import (AllIndicatorsResponse, IndicatorDetailsResponse, IndicatorDetailsInput)
from backend.indicators import services
from typing import List

indicators_router = APIRouter(prefix="/indicator", tags=["indicator"])

@indicators_router.get("", response_model=AllIndicatorsResponse)
async def read_indicators():
    indicators = await services.read_indicators()
    return {"message": "Indicators successfully retrieved.", "count": len(indicators), "indicators": indicators}

@indicators_router.get("/{indicator_id}", response_model=IndicatorDetailsResponse)
async def read_indicator_details(indicator_id: str):
    indicator_details = await services.read_indicator_details(indicator_id)
    return {"message": "Indicator details successfully retrieved.", "indicator_details": indicator_details}

@indicators_router.post("", response_model=IndicatorDetailsResponse)
async def create_indicator(data: IndicatorDetailsInput):
    indicator_details = await services.create_indicator(data)
    return {"message": "Indicator successfully created.", "indicator_details": indicator_details}

@indicators_router.put("/{indicator_id}", response_model=IndicatorDetailsResponse)
async def update_indicator(indicator_id: str, data: IndicatorDetailsInput):
    indicator_details = await services.update_indicator(indicator_id, data)
    return {"message": "Indicator successfully updated.", "indicator_details": indicator_details}