from fastapi import APIRouter
from backend.demography.schemas import Major, Batch
from backend.demography import services
from typing import List

demography_router = APIRouter(prefix="/demography", tags=["demography"])

@demography_router.get("/major", response_model=List[Major])
async def get_majors():
    return await services.get_majors()

@demography_router.get("/batch/available")
async def get_available_batches():
    return await services.get_available_batches()

@demography_router.get("/batch", response_model=List[Batch])
async def get_batches():
    return await services.get_batches()