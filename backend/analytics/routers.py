from fastapi import APIRouter, HTTPException, status, Query
from backend.analytics.schemas import (SupportLackGap, ResourceSupportingX, ResourceCharacteristic, OrganizerSupport)
from backend.analytics import services
from typing import List

analytic_router = APIRouter(prefix="/analytic", tags=["analytic"])

@analytic_router.get("/support_lack_gap/{curriculum_type}", response_model=List[SupportLackGap])
async def support_lack_gap(curriculum_type: str, 
                           study_level_ids: list[str] | None = Query(default=None), 
                            resource_types: list[str] | None = Query(default=None), 
                            organizer_ids: list[str] | None = Query(default=None)):
    result = await services.support_lack_gap(curriculum_type, study_level_ids, resource_types, organizer_ids)
    return result

@analytic_router.get("/resource_supporting_x", response_model=List[ResourceSupportingX])
async def resource_supporting_x(curriculum_id: str | None = Query(default=None),
                            study_level_ids: list[str] | None = Query(default=None), 
                            resource_types: list[str] | None = Query(default=None), 
                            organizer_ids: list[str] | None = Query(default=None)):
    result = await services.resource_supporting_x(curriculum_id, study_level_ids, resource_types, organizer_ids)
    return result

@analytic_router.get("/organizer_support", response_model=List[OrganizerSupport])
async def organizer_support(curriculum_type: str,
                            study_level_ids: list[str] | None = Query(default=None), 
                            resource_types: list[str] | None = Query(default=None)):
    result = await services.organizer_support(curriculum_type, study_level_ids, resource_types)
    return result

@analytic_router.get("/resource_characteristic", response_model=List[ResourceCharacteristic])
async def resource_characteristic(study_level_ids: list[str] | None = Query(default=None), 
                            resource_types: list[str] | None = Query(default=None), 
                            organizer_ids: list[str] | None = Query(default=None)):
    result = await services.resource_characteristic(study_level_ids, resource_types, organizer_ids)
    return result