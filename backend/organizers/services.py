from fastapi import HTTPException
from backend.organizers.schemas import OrganizerDetailsInput
from backend.organizers import cypher as organizer_cypher
import uuid

async def read_organizers():
    return await organizer_cypher.read_organizers()

async def read_organizer_details(organizer_id: str):
    organizer_exists = await organizer_cypher.organizer_exists(organizer_id)
    if not organizer_exists:
        raise HTTPException(status_code=404, detail="Organizer not found")
    return await organizer_cypher.read_organizer_details(organizer_id)

async def create_organizer(data: OrganizerDetailsInput):
    new_organizer_id = str(uuid.uuid4())
    data_dict = data.model_dump(mode='json')
    await organizer_cypher.create_organizer(new_organizer_id, data_dict)
    return await organizer_cypher.read_organizer_details(new_organizer_id)

async def update_organizer(organizer_id: str, data: OrganizerDetailsInput):
    organizer_exists = await organizer_cypher.organizer_exists(organizer_id)
    if not organizer_exists:
        raise HTTPException(status_code=404, detail="Organizer not found")
    data_dict = data.model_dump(mode='json')
    await organizer_cypher.update_organizer(organizer_id, data_dict)
    return await organizer_cypher.read_organizer_details(organizer_id)

async def delete_organizer(organizer_id: str):
    organizer_exists = await organizer_cypher.organizer_exists(organizer_id)
    if not organizer_exists:
        raise HTTPException(status_code=404, detail="Organizer not found")
    await organizer_cypher.delete_organizer(organizer_id)