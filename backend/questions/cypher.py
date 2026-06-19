from backend.database import Neo4jConnection


async def question_exists(question_id: str):
    query = """
    MATCH (qs:Question {question_id: $question_id})
    RETURN count(qs) > 0 AS exists
    """
    response = await Neo4jConnection.query(query, {"question_id": question_id})
    return response[0]["exists"] if response else False


async def question_has_answers(question_id: str):
    query = """
    MATCH (:Student)-[:ANSWERED]->(qs:Question {question_id: $question_id})
    RETURN count(*) > 0 AS has_answers
    """
    response = await Neo4jConnection.query(query, {"question_id": question_id})
    return response[0]["has_answers"] if response else False


async def update_question(question_id: str, data: dict):
    query = """
    MATCH (qs:Question {question_id: $question_id})
    SET qs.code = $code,
        qs.name = $name,
        qs.question_scale_label = $question_scale_label,
        qs.flipped = $flipped
    WITH qs
    OPTIONAL MATCH (qs)<-[old_r:HAS_QUESTION]-(:Indicator)
    DELETE old_r
    WITH qs
    MATCH (i:Indicator {indicator_id: $indicator_id})
    MERGE (i)-[:HAS_QUESTION]->(qs)
    """
    await Neo4jConnection.query(query, {
        "question_id": question_id,
        "code": data["code"],
        "name": data["name"],
        "question_scale_label": data["question_scale_label"],
        "flipped": data["flipped"],
        "indicator_id": data["indicator_id"],
    })


async def read_question_details(question_id: str):
    query = """
    MATCH (qs:Question {question_id: $question_id})
    OPTIONAL MATCH (qs)<-[:HAS_QUESTION]-(i:Indicator)
    RETURN qs.question_id AS question_id,
           qs.code AS code,
           qs.name AS name,
           split(qs.question_scale_label, ",")[0] AS lower_bound,
           split(qs.question_scale_label, ",")[1] AS upper_bound,
           split(qs.question_scale_label, ",")[2] AS lower_text,
           split(qs.question_scale_label, ",")[3] AS upper_text,
           qs.flipped AS flipped,
           i.indicator_id AS indicator_id,
           i.code AS indicator_code,
           i.name AS indicator_name
    """
    response = await Neo4jConnection.query(query, {"question_id": question_id})
    return response[0] if response else None
