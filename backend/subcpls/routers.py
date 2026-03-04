from fastapi import APIRouter, HTTPException, status
from backend.subcpls.schemas import (AllSubCplsResponse, SubCplDetailsResponse)
from backend.subcpls import services
from typing import List

subcpls_router = APIRouter(prefix="/subcpl", tags=["subcpl"])

@subcpls_router.get("", response_model=AllSubCplsResponse)
async def read_subcpls():
    subcpls = await services.read_subcpls()
    return {"message": "SubCpls successfully retrieved.", "count": len(subcpls), "subcpls": subcpls}

@subcpls_router.get("/{sub_cpl_id}", response_model=SubCplDetailsResponse)
async def read_subcpl_details(sub_cpl_id: str):
    subcpl_details = await services.read_subcpl_details(sub_cpl_id)
    return {"message": "SubCpl details successfully retrieved.", "subcpl_details": subcpl_details}