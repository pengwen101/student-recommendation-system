from backend.analytics import cypher as analytic_cypher
from fastapi import HTTPException

CURRICULUM_TYPE_LABEL_MAP = {
    "sub_cpl": "SubCpl",
    "cpl": "Cpl",
    "quality": "Quality",
    "indicator": "Indicator"
}

async def support_lack_gap(curriculum_type: str, study_level_ids: list | None = None, resource_types: list | None = None, organizer_ids: list | None = None):
    if curriculum_type not in CURRICULUM_TYPE_LABEL_MAP:
        raise HTTPException(f"Invalid type provided: {curriculum_type}")
        
    target_label = CURRICULUM_TYPE_LABEL_MAP[curriculum_type]
    return await analytic_cypher.support_lack_gap(target_label, study_level_ids, resource_types, organizer_ids)

async def resource_supporting_x(curriculum_id: str | None = None, study_level_ids: list | None = None, resource_types: list | None = None, organizer_ids: list | None = None):
    return await analytic_cypher.resource_supporting_x(curriculum_id, study_level_ids, resource_types, organizer_ids)


async def resource_characteristic(study_level_ids: list[str] | None = None, 
                            resource_types: list[str] | None = None, 
                            organizer_ids: list[str] | None = None):
    result = await analytic_cypher.resource_characteristic(study_level_ids, resource_types, organizer_ids)
    return result