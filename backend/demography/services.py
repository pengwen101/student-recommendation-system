from backend.demography import cypher

async def get_majors():
    return await cypher.get_majors()

async def get_batches():
    return await cypher.get_batches()