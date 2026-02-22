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
           i.name as name,
           [(i)<-[r:HAS_INDICATOR]-(q:Quality) | {
                quality_id: q.quality_id,
                code: q.code,
                name: q.name, 
                weight: CASE 
                            WHEN r.weight IS NULL THEN 1.0 
                            WHEN isNaN(toFloat(r.weight)) THEN 1.0 
                            ELSE toFloat(r.weight) 
                        END
           }] as qualities
    """
    response = await Neo4jConnection.query(query)
    return response


async def read_indicator_details(indicator_id: str):
    query = """
    MATCH (i:Indicator {indicator_id: $indicator_id})
    RETURN i.indicator_id as indicator_id, 
           i.name as name,
           [(i)<-[r:HAS_INDICATOR]-(q:Quality) | {
                quality_id: q.quality_id,
                code: q.code,
                name: q.name, 
                weight: CASE 
                            WHEN r.weight IS NULL THEN 1.0 
                            WHEN isNaN(toFloat(r.weight)) THEN 1.0 
                            ELSE toFloat(r.weight) 
                        END
           }] as qualities
    """
    params = {"indicator_id": indicator_id}
    response = await Neo4jConnection.query(query, params)
    return response[0] if response else None

async def create_indicator(indicator_id: str, data: dict):
    query = """
    MERGE (i:Indicator {indicator_id: $indicator_id})
    SET i.name = $name
    WITH q
    UNWIND $qualities as quality
    MATCH (q:Quality {quality_id: quality.quality_id})
    MERGE (q)-[r:HAS_INDICATOR]->(i)
    SET r.weight = quality.weight
    """
    
    params = {"indicator_id": indicator_id, "name": data['name'], "qualities": data['qualities']}
    await Neo4jConnection.query(query, params)

async def update_indicator(indicator_id: str, data: dict):
    
    query = """
    MATCH (i:Indicator {indicator_id: $indicator_id})
    SET i.name = $name
    WITH i
    OPTIONAL MATCH (i)<-[old_r:HAS_INDICATOR]-(:Quality)
    DELETE old_r
    WITH i
    UNWIND $qualities as quality
    MATCH (q:Quality {quality_id: quality.quality_id})
    MERGE (q)-[r:HAS_INDICATOR]->(i)
    SET r.weight = quality.weight
    """
    
    params = {"indicator_id": indicator_id, "name": data['name'], "qualities": data['qualities']}
    await Neo4jConnection.query(query, params)
