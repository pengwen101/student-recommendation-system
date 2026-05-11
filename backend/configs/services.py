from backend.majors import cypher

async def get_majors():
    return await cypher.get_majors()

