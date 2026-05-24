from backend.majors import cypher

async def get_majors():
    return await cypher.get_majors()

async def get_resource_assessments(type: str):
    return await cypher.get_resource_assessments(type)