from graphdatascience import GraphDataScience
from backend.config import NEO4J_URI, NEO4J_AUTH, NEO4J_DB

class Neo4jConnection:
    _driver = None
    
    @classmethod
    def get_driver(cls):
        if cls._driver is None:
            cls._driver = GraphDataScience(NEO4J_URI, auth=NEO4J_AUTH, database=NEO4J_DB)
        return cls._driver
    
    @classmethod
    def close_driver(cls):
        if cls._driver is not None:
            cls._driver.close()
            cls._driver = None
            
    @classmethod
    def query(cls, query, parameters=None, db=None):
        driver = cls.get_driver()
        response_df = driver.run_cypher(query, parameters, db)
        
        return response_df