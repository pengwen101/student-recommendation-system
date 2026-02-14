from neo4j import AsyncGraphDatabase
from backend.config import NEO4J_URI, NEO4J_AUTH, NEO4J_DB

class Neo4jConnection:
    _driver = None
    
    @classmethod
    def get_driver(cls):
        if cls._driver is None:
            cls._driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=NEO4J_AUTH)
        return cls._driver
    
    @classmethod
    async def close_driver(cls):
        if cls._driver is not None:
            cls._driver.close()
            cls._driver = None
            
    @classmethod
    async def query(cls, query, parameters=None, db=None):
        driver = cls.get_driver()
        async with driver.session(database=NEO4J_DB) as session:
            result = await session.run(query, parameters)
            return await result.data()