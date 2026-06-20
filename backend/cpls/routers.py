from fastapi import APIRouter, Depends
from backend.auth.dependencies import require_admin
from backend.cpls.schemas import CPLUpdateInput, CPLUpdateResponse
from backend.cpls import services

cpls_router = APIRouter(prefix="/cpl", tags=["cpl"], dependencies=[Depends(require_admin())])


@cpls_router.put("/{cpl_id}", response_model=CPLUpdateResponse)
async def update_cpl(cpl_id: str, data: CPLUpdateInput):
    result = await services.update_cpl(cpl_id, data.model_dump())
    return result
