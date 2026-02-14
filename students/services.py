from backend.students import cypher

async def get_student_topics(session, student_id: str):
    student_exists = await cypher.student_exists(session, student_id)
    if not student_exists:
        return None
    return await cypher.get_student_topics(session, student_id)

async def create_student_topics(session, student_id: str, topic_ids: list[str]):
    student_exists = await cypher.student_exists(session, student_id)
    if not student_exists:
        return None
    await cypher.create_student_topics(session, student_id, topic_ids)
    return await cypher.get_student_topics(session, student_id)

async def update_student_topics(session, student_id: str, topic_ids: list[str]):
    student_exists = await cypher.student_exists(session, student_id)
    if not student_exists:
        return None
    await cypher.update_student_topics(session, student_id, topic_ids)
    return await cypher.get_student_topics(session, student_id)