from backend.database import Neo4jConnection

async def indicator_exists(indicator_id: str):
    query = """
    MATCH (q: indicator {indicator_id: $indicator_id})
    RETURN count(q) > 0 as exists
    """
    params = {"indicator_id": indicator_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False

async def read_indicators():
    query = """
    MATCH (i:Indicator)
    RETURN i.indicator_id as indicator_id, 
           i.description as indicator_description,
           [(i)<-[r:HAS_INDICATOR]-(q:Quality) | {
                quality_id: q.quality_id,
                quality_description: q.description, 
                weight: coalesce(toFloat(r.weight), 1.0)
           }] as qualities
    """
    response = await Neo4jConnection.query(query)
    return response


async def read_indicator_details(indicator_id: str):
    query = """
    MATCH (i:Indicator {indicator_id: $indicator_id})
    RETURN i.indicator_id as indicator_id, 
           i.description as indicator_description,
           [(i)<-[r:HAS_INDICATOR]-(q:Quality) | {
                quality_id: q.quality_id,
                quality_description: q.description, 
                weight: coalesce(toFloat(r.weight), 1.0)
           }] as qualities
    """
    params = {"indicator_id": indicator_id}
    response = await Neo4jConnection.query(query, params)
    return response[0] if response else None

async def create_indicator(indicator_id: str, data: dict):
    query = """
    MERGE (i:Indicator {indicator_id: $indicator_id})
    SET i.description = $indicator_description
    WITH q
    UNWIND $qualities as quality
    MATCH (q:Quality {quality_id: quality.quality_id})
    MERGE (q)-[r:HAS_INDICATOR]->(i)
    SET r.weight = quality.weight
    """
    
    params = {"indicator_id": indicator_id, "indicator_description": data['indicator_description'], "qualities": data['qualities']}
    await Neo4jConnection.query(query, params)

async def update_indicator(indicator_id: str, data: dict):
    
    query = """
    MATCH (i:Indicator {indicator_id: $indicator_id})
    SET i.description = $indicator_description
    WITH i
    OPTIONAL MATCH (i)<-[old_r:HAS_INDICATOR]-(:Quality)
    DELETE old_r
    WITH i
    UNWIND $qualities as quality
    MATCH (q:Quality {quality_id: quality.quality_id})
    MERGE (q)-[r:HAS_INDICATOR]->(i)
    SET r.weight = quality.weight
    """
    
    params = {"indicator_id": indicator_id, "indicator_description": data['indicator_description'], "qualities": data['qualities']}
    await Neo4jConnection.query(query, params)
