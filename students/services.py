from backend.students import cypher

async def read_student_topics(student_id: str):
    student_exists = await cypher.student_exists(student_id)
    if not student_exists:
        return None
    return await cypher.read_student_topics(student_id)

async def create_student_topics(student_id: str, topic_ids: list[int]):
    student_exists = await cypher.student_exists(student_id)
    if not student_exists:
        return None
    await cypher.create_student_topics(student_id, topic_ids)
    return await cypher.read_student_topics(student_id)

async def update_student_topics(student_id: str, topic_ids: list[int]):
    student_exists = await cypher.student_exists(student_id)
    if not student_exists:
        return None
    await cypher.update_student_topics(student_id, topic_ids)
    return await cypher.read_student_topics(student_id)