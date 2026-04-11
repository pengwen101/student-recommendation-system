import pandas as pd
from backend.database import Neo4jConnection

async def seed_curriculum(path):
    df = pd.read_csv(path)
    data = df.to_dict(orient="records")
    
    query = """
        UNWIND $batch as row
        MERGE (c:Cpl {code: row.cpl_code})
        ON CREATE SET c.cpl_id = randomUUID()
        MERGE (sc:SubCpl {code: row.sub_cpl_code})
        ON CREATE SET sc.sub_cpl_id = randomUUID()
        MERGE (q:Quality {code: row.quality_code})
        ON CREATE SET q.quality_id = randomUUID()
        MERGE (i:Indicator {code: row.indicator_code})
        ON CREATE SET i.indicator_id = randomUUID()
        MERGE (qs:Question {code: row.question_code})
        ON CREATE SET qs.question_id = randomUUID()
        MERGE (wpe:Wpe {code: row.wpe_code})
        ON CREATE SET wpe.wpe_id = randomUUID()
        SET c.name = row.cpl_name
        SET sc.name = row.sub_cpl_name
        SET q.name = row.quality_name
        SET i.name = row.indicator_name
        SET qs.name = row.question_name
        SET wpe.name = row.wpe_name
        MERGE (c)-[:HAS_SUB_CPL]->(sc)
        MERGE (sc)-[r:HAS_QUALITY]->(q)
        SET r.weight = row.sub_cpl_quality_weight
        MERGE (q)-[:HAS_INDICATOR]->(i)
        MERGE (i)-[:HAS_QUESTION]->(qs)
        MERGE (wpe)-[:CONTAINS_QUESTION]->(qs)
        """
    await Neo4jConnection.query(query, {"batch": data})
    
async def seed_students(path):
    df = pd.read_csv(path)
    data = df.to_dict(orient="records")
    query = """
        UNWIND $batch as row
        MERGE (s:Student {nrp: row.nrp})
        SET s.gender = row.gender
        SET s.major = row.major
        SET s.religion = row.religion
    """
    
    await Neo4jConnection.query(query,{"batch": data})

async def seed_student_questions_relation(path):
    df = pd.read_csv(path)
    data = df.to_dict(orient="records")
    
    query = """
    UNWIND $batch as row
    MATCH (s:Student {nrp: row.nrp})
    MATCH (qs: Question {name: row.question_name})
    MERGE (s)-[ra:ANSWERED]->(qs)
    SET ra.score = row.score
    SET ra.valid_score = row.valid_score
    """
    await Neo4jConnection.query(query,{"batch": data})
    
    query = """
    MATCH (s:Student)-[ra:ANSWERED]->(:Question)<-[:HAS_QUESTION]-(i:Indicator)
    WITH s, i, 0.1 * avg(ra.valid_score) AS ind_avg_score
    MERGE (s)-[rli:LACKS]->(i)
    SET rli.weight = 1 - ind_avg_score

    WITH DISTINCT s
    MATCH (s)-[ra:ANSWERED]->(:Question)<-[:HAS_QUESTION]-(:Indicator)<-[:HAS_INDICATOR]-(q:Quality)
    WITH s, q, 0.1 * avg(ra.valid_score) AS qual_avg_score
    MERGE (s)-[rlq:LACKS]->(q)
    SET rlq.weight = 1 - qual_avg_score

    WITH s, q, qual_avg_score
    MATCH (sc:SubCpl)-[sq:HAS_QUALITY]->(q)
    WITH s, sc,
        sum(qual_avg_score * sq.weight) AS weighted_score_sum,
        sum(sq.weight) AS total_weight
    WITH s, sc, weighted_score_sum / total_weight as subcpl_avg_score
    MERGE (s)-[rls:LACKS]->(sc)
    SET rls.weight = 1 - subcpl_avg_score
    
    WITH s, sc, subcpl_avg_score
    MATCH (sc)<-[:HAS_SUB_CPL]-(c:Cpl)
    WITH s, c, avg(subcpl_avg_score) as cpl_avg_score
    MERGE (s)-[rlc:LACKS]->(c)
    SET rlc.weight = 1 - cpl_avg_score
    """
    
    await Neo4jConnection.query(query)
    
async def run_all_seeders():
    # print("Seeding Curriculum...")
    # await seed_curriculum("data/curriculum.csv")
    
    # print("Seeding Students...")
    # await seed_students("data/demografi.csv")
    
    print("Seeding Relations...")
    await seed_student_questions_relation("data/hasil_survei.csv")
    
    print("All seeding complete!")
    
    
if __name__ == "__main__":
    import asyncio
    asyncio.run(run_all_seeders())
    
    