from fastapi import APIRouter, Depends
from backend.auth.dependencies import require_admin
from backend.subcpls.schemas import AllSubCplIndicatorsResponse, SubCplUpdateInput, SubCplUpdateResponse
from backend.subcpls import services

subcpls_router = APIRouter(prefix="/subcpl", tags=["subcpl"], dependencies=[Depends(require_admin())])

@subcpls_router.get("/indicators/{version_id}", response_model=AllSubCplIndicatorsResponse)
async def read_subcpl_indicators(version_id: str):
    subcpls = await services.read_subcpl_indicators(version_id)
    return {"message": "SubCpls successfully retrieved.", "count": len(subcpls), "subcpls": subcpls}

@subcpls_router.put("/{sub_cpl_id}", response_model=SubCplUpdateResponse)
async def update_subcpl(sub_cpl_id: str, data: SubCplUpdateInput):
    result = await services.update_subcpl(sub_cpl_id, data.model_dump())
    return result