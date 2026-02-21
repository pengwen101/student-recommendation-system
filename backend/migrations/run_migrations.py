import os
import glob
from backend.database import Neo4jConnection

MIGRATIONS_DIR = os.path.dirname(os.path.abspath(__file__))

async def get_applied_migrations():
    query = "MATCH (m:Migration) RETURN m.name AS name"
    result = await Neo4jConnection.query(query)
    return [record["name"] for record in result]

async def record_migration(name: str):
    query = """
    MERGE (m:Migration {name: $name})
    SET m.applied_at = datetime()
    """
    await Neo4jConnection.query(query, {"name": name})

async def run_all_migrations():
    print("Checking database migrations...")
    applied_migrations = await get_applied_migrations()
    migration_files = sorted(glob.glob(os.path.join(MIGRATIONS_DIR, "*.cypher")))
    
    for filepath in migration_files:
        filename = os.path.basename(filepath)
        
        if filename in applied_migrations:
            continue
            
        print(f"Applying migration: {filename}...")
        with open(filepath, "r") as file:
            queries = file.read().split(";")
            
        for query in queries:
            query = query.strip()
            if query:
                try:
                    await Neo4jConnection.query(query)
                except Exception as e:
                    print(f"❌ Error in {filename}: {e}")
                    return
    
        await record_migration(filename)
        print(f"✅ Successfully applied {filename}")
        
    print("Migrations up to date.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_all_migrations())