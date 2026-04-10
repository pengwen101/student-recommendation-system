from fastapi import APIRouter
from backend.organizers.schemas import AllOrganizerDetailsResponse, OrganizerDetailsResponse, OrganizerDetailsInput
from backend.organizers import services

organizers_router = APIRouter(prefix="/organizer", tags=["organizer"])

@organizers_router.get("", response_model=AllOrganizerDetailsResponse)
async def read_organizers():
    organizers = await services.read_organizers()
    return {"message": "Organizers successfully retrieved.", "count": len(organizers), "organizers": organizers}

@organizers_router.get("/{organizer_id}", response_model=OrganizerDetailsResponse)
async def read_organizer_details(organizer_id: str):
    organizer_details = await services.read_organizer_details(organizer_id)
    return {"message": "Organizer details successfully retrieved.", "organizer_details": organizer_details}

@organizers_router.post("", response_model=OrganizerDetailsResponse)
async def create_organizer(data: OrganizerDetailsInput):
    organizer_details = await services.create_organizer(data)
    return {"message": "Organizer successfully created.", "organizer_details": organizer_details}

@organizers_router.put("/{organizer_id}", response_model=OrganizerDetailsResponse)
async def update_organizer(organizer_id: str, data: OrganizerDetailsInput):
    organizer_details = await services.update_organizer(organizer_id, data)
    return {"message": "Organizer successfully updated.", "organizer_details": organizer_details}

@organizers_router.delete("/{organizer_id}")
async def delete_organizer(organizer_id: str):
    await services.delete_organizer(organizer_id)
    return {"message": "Organizer successfully deleted."}