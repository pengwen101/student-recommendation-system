from backend.database import Neo4jConnection

async def organizer_exists(organizer_id: str):
    query = """
    MATCH (o: Organizer {organizer_id: $organizer_id})
    RETURN count(o) > 0 as exists
    """
    params = {"organizer_id": organizer_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False


async def read_organizers():
    query = """
    MATCH (o:Organizer)
    RETURN o.organizer_id as organizer_id,
            o.name as name,
            o.created_at as created_at, 
            o.updated_at as updated_at
    """
    response = await Neo4jConnection.query(query)
    
    organizers = []
    for record in response:
        organizers.append({
            "organizer_id": record["organizer_id"],
            "name": record["name"],
            "created_at": record["created_at"].to_native(),
            "updated_at": record["updated_at"].to_native()
        })
    return organizers


async def read_organizer_details(organizer_id: str):
    query = """
    MATCH (o:Organizer {organizer_id: $organizer_id})
    RETURN o.organizer_id as organizer_id, 
           o.name as name,
           o.created_at as created_at,
           o.updated_at as updated_at
    """
    params = {"organizer_id": organizer_id}
    response = await Neo4jConnection.query(query, params)
    
    organizers = []
    for record in response:
        organizers.append({
            "organizer_id": record["organizer_id"],
            "name": record["name"],
            "created_at": record["created_at"].to_native(),
            "updated_at": record["updated_at"].to_native()
        })
    return organizers[0] if organizers else None

async def create_organizer(organizer_id: str, data: dict):
    query = """
    MERGE (o:Organizer {organizer_id: $organizer_id})
    SET o.name = $name, o.created_at = datetime({timezone: 'Asia/Jakarta'}), o.updated_at = datetime({timezone: 'Asia/Jakarta'})
    """
    
    params = {"organizer_id": organizer_id, "name": data['name']}
    await Neo4jConnection.query(query, params)

async def update_organizer(organizer_id: str, data: dict):
    
    query = """
    MATCH (o:Organizer {organizer_id: $organizer_id})
    SET o.name = $name, o.updated_at = datetime({timezone: 'Asia/Jakarta'})
    """
    
    params = {"organizer_id": organizer_id, "name": data['name']}
    await Neo4jConnection.query(query, params)


async def delete_organizer(organizer_id: str):
    
    query = """
    MATCH (o:organizer {organizer_id: $organizer_id})
    DETACH DELETE o
    """
    
    params = {"organizer_id": organizer_id}
    await Neo4jConnection.query(query, params)
