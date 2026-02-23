from backend.resources import cypher as resource_cypher
from backend.qualities import cypher as quality_cypher
from backend.topics import cypher as topic_cypher
from backend.subcpls import cypher as subcpl_cypher
from fastapi import HTTPException
from backend.resources.schemas import ResourceDetailsResponse, AllResourcesResponse, ResourceDetailsInput
from typing import List
import uuid

async def read_resources():
    return await resource_cypher.read_resources()

async def read_resource_details(resource_id: str):
    resource_exists = await resource_cypher.resource_exists(resource_id)
    if not resource_exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    return await resource_cypher.read_resource_details(resource_id)

async def create_resource(data: ResourceDetailsInput):
    new_resource_id = str(uuid.uuid4())
    data_dict = data.model_dump(mode='json')
    for subcpl in data_dict['subcpls']:
        sub_cpl_id = subcpl['sub_cpl_id']
        subcpl_exists = await subcpl_cypher.subcpl_exists(sub_cpl_id)
        if not subcpl_exists:
            raise HTTPException(status_code=404, detail=f"Sub-CPL ID {sub_cpl_id} not found")
        for quality in subcpl['qualities']:
            quality_id = quality['quality_id']
            quality_exists = await quality_cypher.quality_exists(quality_id)
            if not quality_exists:
                raise HTTPException(status_code=404, detail=f"Quality ID {quality_id} not found")
    for topic in data_dict['topics']:
        topic_id = topic['topic_id']
        topic_exists = await topic_cypher.topic_exists(topic_id)
        if not topic_exists:
            raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    await resource_cypher.create_resource(new_resource_id, data_dict)
    return await resource_cypher.read_resource_details(new_resource_id)

async def update_resource(resource_id: str, data: ResourceDetailsInput):
    resource_exists = await resource_cypher.resource_exists(resource_id)
    if not resource_exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    data_dict = data.model_dump(mode='json')
    for subcpl in data_dict['subcpls']:
        sub_cpl_id = subcpl['sub_cpl_id']
        subcpl_exists = await subcpl_cypher.subcpl_exists(sub_cpl_id)
        if not subcpl_exists:
            raise HTTPException(status_code=404, detail=f"Sub-CPL ID {sub_cpl_id} not found")
        for quality in subcpl['qualities']:
            quality_id = quality['quality_id']
            quality_exists = await quality_cypher.quality_exists(quality_id)
            if not quality_exists:
                raise HTTPException(status_code=404, detail=f"Quality ID {quality_id} not found")
    for topic in data_dict['topics']:
        topic_id = topic['topic_id']
        topic_exists = await topic_cypher.topic_exists(topic_id)
        if not topic_exists:
            raise HTTPException(status_code=404, detail=f"Topic ID {topic_id} not found")
    await resource_cypher.update_resource(resource_id, data_dict)
    return await resource_cypher.read_resource_details(resource_id)