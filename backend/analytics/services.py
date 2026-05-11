from backend.analytics import cypher as analytic_cypher
from fastapi import HTTPException

CURRICULUM_TYPE_LABEL_MAP = {
    "sub_cpl": "SubCpl",
    "cpl": "Cpl",
    "quality": "Quality",
    "indicator": "Indicator"
}

async def support_lack_gap(curriculum_type: str, study_level_ids: list | None = None, resource_types: list | None = None, organizer_ids: list | None = None):
    target_label = CURRICULUM_TYPE_LABEL_MAP[curriculum_type]
    return await analytic_cypher.support_lack_gap(target_label, study_level_ids, resource_types, organizer_ids)

async def resource_supporting_x(curriculum_id: str | None = None, study_level_ids: list | None = None, resource_types: list | None = None, organizer_ids: list | None = None):
    return await analytic_cypher.resource_supporting_x(curriculum_id, study_level_ids, resource_types, organizer_ids)


async def resource_characteristic(study_level_ids: list[str] | None = None, 
                            resource_types: list[str] | None = None, 
                            organizer_ids: list[str] | None = None):
    result = await analytic_cypher.resource_characteristic(study_level_ids, resource_types, organizer_ids)
    return result

async def organizer_support(curriculum_type: str,
                            study_level_ids: list[str] | None = None, 
                            resource_types: list[str] | None = None):
    
    target_label = CURRICULUM_TYPE_LABEL_MAP[curriculum_type]
    result = await analytic_cypher.organizer_support(target_label, study_level_ids, resource_types)
    return result

async def student_mastery(curriculum_type: str,
                          curriculum_id: str | None = None,
                          nrp: str | None = None,
                          major_ids: list[str] | None = None,
                            batch_ids: list[str] | None = None):
    
    target_label = CURRICULUM_TYPE_LABEL_MAP[curriculum_type]
    result = await analytic_cypher.student_mastery(target_label, curriculum_id, nrp, major_ids, batch_ids)
    return result