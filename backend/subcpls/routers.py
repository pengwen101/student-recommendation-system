from fastapi import APIRouter
from backend.subcpls.schemas import (AllSubCplsResponse, AllSubCplIndicatorsResponse, SubCplDetailsResponse, SubCplUpdateInput, SubCplUpdateResponse)
from backend.subcpls import services

subcpls_router = APIRouter(prefix="/subcpl", tags=["subcpl"])

@subcpls_router.get("/{version_id}", response_model=AllSubCplsResponse)
async def read_subcpls(version_id: str):
    subcpls = await services.read_subcpls(version_id)
    return {"message": "SubCpls successfully retrieved.", "count": len(subcpls), "subcpls": subcpls}

@subcpls_router.get("/indicators/{version_id}", response_model=AllSubCplIndicatorsResponse)
async def read_subcpl_indicators(version_id: str):
    subcpls = await services.read_subcpl_indicators(version_id)
    return {"message": "SubCpls successfully retrieved.", "count": len(subcpls), "subcpls": subcpls}

@subcpls_router.get("/{sub_cpl_id}", response_model=SubCplDetailsResponse)
async def read_subcpl_details(sub_cpl_id: str):
    subcpl_details = await services.read_subcpl_details(sub_cpl_id)
    return {"message": "SubCpl details successfully retrieved.", "subcpl_details": subcpl_details}

@subcpls_router.put("/{sub_cpl_id}", response_model=SubCplUpdateResponse)
async def update_subcpl(sub_cpl_id: str, data: SubCplUpdateInput):
    result = await services.update_subcpl(sub_cpl_id, data.model_dump())
    return result