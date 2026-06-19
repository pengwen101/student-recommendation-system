from backend.database import Neo4jConnection


async def cpl_exists(cpl_id: str):
    query = """
    MATCH (c:Cpl {cpl_id: $cpl_id})
    RETURN count(c) > 0 AS exists
    """
    response = await Neo4jConnection.query(query, {"cpl_id": cpl_id})
    return response[0]["exists"] if response else False


async def update_cpl(cpl_id: str, data: dict):
    query = """
    MATCH (c:Cpl {cpl_id: $cpl_id})
    SET c.code = $code, c.name = $name
    WITH c
    OPTIONAL MATCH (cv:CurriculumVersion)-[old_r:HAS_CPL]->(c)
    DELETE old_r
    WITH c
    MATCH (cv:CurriculumVersion {curriculum_version_id: $curriculum_version_id})
    MERGE (cv)-[:HAS_CPL]->(c)
    """
    await Neo4jConnection.query(query, {
        "cpl_id": cpl_id,
        "code": data["code"],
        "name": data["name"],
        "curriculum_version_id": data["curriculum_version_id"],
    })


async def read_cpl_details(cpl_id: str):
    query = """
    MATCH (c:Cpl {cpl_id: $cpl_id})
    OPTIONAL MATCH (cv:CurriculumVersion)-[:HAS_CPL]->(c)
    RETURN c.cpl_id AS cpl_id,
           c.code AS code,
           c.name AS name,
           cv.curriculum_version_id AS curriculum_version_id
    """
    response = await Neo4jConnection.query(query, {"cpl_id": cpl_id})
    return response[0] if response else None
