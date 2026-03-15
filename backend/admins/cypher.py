from backend.database import Neo4jConnection

async def admin_exists(email: str):
    query = """
    MATCH (a: Admin {email: $email})
    RETURN count(a) > 0 as exists
    """
    params = {"email": email}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False

async def get_id_from_email(email: str):
    query = """
    MATCH (a: Admin {email: $email})
    RETURN a.admin_id as admin_id
    """
    params = {"email": email}
    response = await Neo4jConnection.query(query, params)
    return response

async def read_admins():
    query = """
    MATCH (a:Admin)
    RETURN a.admin_id as admin_id, 
           a.email as email,
           a.name as name,
           a.approved as approved
    """
    response = await Neo4jConnection.query(query)
    return response


async def read_admin_details(admin_id: str):
    query = """
    MATCH (a:Admin {admin_id: $admin_id})
    RETURN a.admin_id as admin_id, 
           a.email as email,
           a.name as name,
           a.approved as approved
    """
    params = {"admin_id": admin_id}
    response = await Neo4jConnection.query(query, params)
    return response[0] if response else None

async def create_admin(admin_id: str, data: dict):
    query = """
    MERGE (a:Admin {email: $email})
    ON CREATE SET a.admin_id = $admin_id,
                  a.name = $name,
                  a.approved = false
    """
    
    params = {"admin_id": admin_id, "email": data['email'], "name": data['name']}
    await Neo4jConnection.query(query, params)
    
async def approve_admin(admin_id: str):
    query = """
    MATCH (a:Admin {admin_id: $admin_id})
    SET a.approved = true
    """
    params = {"admin_id": admin_id}
    await Neo4jConnection.query(query, params)

async def update_admin(admin_id: str, data: dict):
    
    query = """
    MATCH (a:Admin {admin_id: $admin_id})
    SET a.name = $name
    """
    
    params = {"admin_id": admin_id, "name": data['name']}
    await Neo4jConnection.query(query, params)


async def delete_admin(admin_id: str):
    
    query = """
    MATCH (a:Admin {admin_id: $admin_id})
    DETACH DELETE a
    """
    
    params = {"admin_id": admin_id}
    await Neo4jConnection.query(query, params)
