from backend.database import Neo4jConnection

async def get_majors():
    query = """
    MATCH (m:Major)-[]->(f:Faculty)
    return m.major_id as major_id, m.name as major_name, f.faculty_id as faculty_id, f.name as faculty_name
    """
    
    return await Neo4jConnection.query(query)

async def get_batches():
    query = """
    MATCH (b:Batch)
    RETURN b.batch_id as batch_id
    """
    
    return await Neo4jConnection.query(query)


async def get_available_batches():
    query = """
        MATCH (b:Batch)
        WHERE NOT EXISTS { MATCH (b)-[:USES]->(:CurriculumVersion) }
        RETURN b.batch_id AS batch_id
        ORDER BY b.batch_id
    """
    return await Neo4jConnection.query(query)


async def get_all_batch_ids():
    query = """
        MATCH (b:Batch)
        RETURN b.batch_id AS batch_id
    """
    return await Neo4jConnection.query(query)
    
    