from backend.demography import cypher
from datetime import datetime

async def get_majors():
    return await cypher.get_majors()

async def get_batches():
    return await cypher.get_batches()


async def get_available_batches():
    free = await cypher.get_available_batches()
    all_b = await cypher.get_all_batch_ids()

    if all_b:
        max_year1 = max(int(r["batch_id"].split("/")[0]) for r in all_b)
    else:
        max_year1 = datetime.now().year

    suggested_next = f"{max_year1 + 1}/{max_year1 + 2}"

    return {
        "available": [r["batch_id"] for r in free],
        "suggested_next": suggested_next,
    }