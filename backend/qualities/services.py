from backend.qualities import cypher as quality_cypher
from backend.subcpls import cypher as subcpl_cypher
from backend.students import services as student_services
from fastapi import HTTPException
from backend.qualities.schemas import QualityDetailsInput

async def update_quality(quality_id: str, data: QualityDetailsInput):
    quality_exists = await quality_cypher.quality_exists(quality_id)
    if not quality_exists:
        raise HTTPException(status_code=404, detail=f"Quality ID {quality_id} not found")
    data_dict = data.model_dump()
    for subcpl in data_dict['subcpls']:
        sub_cpl_id = subcpl['sub_cpl_id']
        subcpl_exists = await subcpl_cypher.subcpl_exists(sub_cpl_id)
        if not subcpl_exists:
            raise HTTPException(status_code=404, detail=f"SubCPL ID {sub_cpl_id} not found")
    old_data = await quality_cypher.read_quality_details(quality_id)
    old_subcpls = sorted(old_data['subcpls'], key=lambda x: x['sub_cpl_id']) if old_data['subcpls'] else []
    new_subcpls = sorted(data_dict['subcpls'], key=lambda x: x['sub_cpl_id']) if data_dict['subcpls'] else []

    await quality_cypher.update_quality(quality_id, data_dict)

    if old_subcpls != new_subcpls:
        await student_services.recalculate_all_student_scores()

    return await quality_cypher.read_quality_details(quality_id)