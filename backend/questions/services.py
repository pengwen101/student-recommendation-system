from backend.questions import cypher as question_cypher
from backend.indicators import cypher as indicator_cypher
from fastapi import HTTPException


async def update_question(question_id: str, data: dict):
    question_exists = await question_cypher.question_exists(question_id)
    if not question_exists:
        raise HTTPException(status_code=404, detail=f"Question ID {question_id} not found")

    has_answers = await question_cypher.question_has_answers(question_id)
    if has_answers:
        raise HTTPException(
            status_code=400,
            detail="Cannot edit question that has been answered by students",
        )

    indicator_exists = await indicator_cypher.indicator_exists(data["indicator_id"])
    if not indicator_exists:
        raise HTTPException(
            status_code=404, detail=f"Indicator ID {data['indicator_id']} not found"
        )

    question_scale_label = f"{data['lower_bound']},{data['upper_bound']},{data.get('lower_text', '')},{data.get('upper_text', '')}"
    cypher_data = {
        "code": data["code"],
        "name": data["name"],
        "question_scale_label": question_scale_label,
        "flipped": data["flipped"],
        "indicator_id": data["indicator_id"],
    }
    await question_cypher.update_question(question_id, cypher_data)
    return await question_cypher.read_question_details(question_id)
