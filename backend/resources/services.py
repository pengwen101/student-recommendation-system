from backend.resources import cypher as resource_cypher
from backend.indicators import cypher as indicator_cypher
from backend.organizers import cypher as organizer_cypher
from backend.curriculums import cypher as curriculum_cypher
from backend.topics import cypher as topic_cypher
from backend.admins import cypher as admin_cypher
from fastapi import HTTPException
from backend.resources.schemas import ResourceDetailsResponse, AllResourcesResponse, ResourceDetailsInput, ActorInput, ActorType
from typing import List
import uuid
import json

async def read_resources():
    return await resource_cypher.read_resources()

async def read_resource_details(resource_id: str):
    resource_exists = await resource_cypher.resource_exists(resource_id)
    if not resource_exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    resource_details = await resource_cypher.read_resource_details(resource_id)
    return resource_details

async def create_resource(data: ResourceDetailsInput, current_user: dict):
    new_resource_id = str(uuid.uuid4())
    data_dict = data.model_dump(mode='json')
    if data_dict.get('sessions', None) is not None:
        for idx, session in enumerate(data_dict['sessions']):
            data_dict['sessions'][idx]['session_id'] = str(uuid.uuid4())
    for indicator in data_dict['indicators']:
        indicator_id = indicator['indicator_id']
        indicator_exists = await indicator_cypher.indicator_exists(indicator_id)
        if not indicator_exists:
            raise HTTPException(status_code=404, detail=f"Indicator ID {indicator_id} not found")
    for topic in data_dict['topics']:
        topic_id = topic['topic_id']
        topic_exists = await topic_cypher.topic_exists(topic_id)
        if not topic_exists:
            raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    if "article_text" in data_dict:
        data_dict["article_text"] = json.dumps(data_dict["article_text"])
    actor_id = current_user['sub']
    admin_exists = await admin_cypher.admin_exists(actor_id)
    organizer_exists = await organizer_cypher.organizer_exists(actor_id)
    if not admin_exists and not organizer_exists:
        raise HTTPException(status_code=404, detail=f"ID {actor_id} not found")
    if data_dict['type'] == 'event':
        for organizer in data_dict['organizers']:
            organizer_id = organizer['organizer_id']
            organizer_exists = await organizer_cypher.organizer_exists(organizer_id)
            if not organizer_exists:
                raise HTTPException(status_code=404, detail=f"Organizer ID {organizer_id} not found")
        for study_level in data_dict['study_levels']:
            study_level_id = study_level['study_level_id']
            study_level_exists = await curriculum_cypher.study_level_exists(study_level_id)
            if not study_level_exists:
                raise HTTPException(status_code=404, detail=f"Study Level ID {study_level_id} not found")
    await resource_cypher.create_resource(new_resource_id, data_dict, current_user)
    return await resource_cypher.read_resource_details(new_resource_id)

async def update_resource(resource_id: str, data: ResourceDetailsInput, current_user: dict):
    resource_exists = await resource_cypher.resource_exists(resource_id)
    if not resource_exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    data_dict = data.model_dump(mode='json')
    if data_dict.get('sessions', None) is not None:
        for idx, session in enumerate(data_dict['sessions']):
            if data_dict['sessions'][idx]['session_id'] is None:
                data_dict['sessions'][idx]['session_id'] = str(uuid.uuid4())
    for indicator in data_dict['indicators']:
        indicator_id = indicator['indicator_id']
        indicator_exists = await indicator_cypher.indicator_exists(indicator_id)
        if not indicator_exists:
            raise HTTPException(status_code=404, detail=f"Indicator ID {indicator_id} not found")
    for topic in data_dict['topics']:
        topic_id = topic['topic_id']
        topic_exists = await topic_cypher.topic_exists(topic_id)
        if not topic_exists:
            raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    if "article_text" in data_dict:
        data_dict["article_text"] = json.dumps(data_dict["article_text"])
    actor_id = current_user['sub']
    admin_exists = await admin_cypher.admin_exists(actor_id)
    organizer_exists = await organizer_cypher.organizer_exists(actor_id)
    if not admin_exists and not organizer_exists:
        raise HTTPException(status_code=404, detail=f"ID {actor_id} not found")
    if data_dict['type'] == 'event':
        for organizer in data_dict['organizers']:
            organizer_id = organizer['organizer_id']
            organizer_exists = await organizer_cypher.organizer_exists(organizer_id)
            if not organizer_exists:
                raise HTTPException(status_code=404, detail=f"Organizer ID {organizer_id} not found")
        for study_level in data_dict['study_levels']:
            study_level_id = study_level['study_level_id']
            study_level_exists = await curriculum_cypher.study_level_exists(study_level_id)
            if not study_level_exists:
                raise HTTPException(status_code=404, detail=f"Study Level ID {study_level_id} not found")
    await resource_cypher.update_resource(resource_id, data_dict, current_user)
    return await resource_cypher.read_resource_details(resource_id)

async def archive_resource(resource_id: str):
    resource_exists = await resource_cypher.resource_exists(resource_id)
    if not resource_exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    await resource_cypher.archive_resource(resource_id)
    return await resource_cypher.read_resource_details(resource_id)

async def activate_resource(resource_id: str):
    resource_exists = await resource_cypher.resource_exists(resource_id)
    if not resource_exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    await resource_cypher.activate_resource(resource_id)
    return await resource_cypher.read_resource_details(resource_id)

async def delete_resource(resource_id: str):
    resource_exists = await resource_cypher.resource_exists(resource_id)
    if not resource_exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    await resource_cypher.delete_resource(resource_id)