import pandas as pd
from backend.database import Neo4jConnection

async def seed_years_and_versions():
    query = """
        MERGE (:StudyLevel {study_level_id: 1})
        MERGE (:StudyLevel {study_level_id: 2})
        MERGE (:StudyLevel {study_level_id: 3})
        MERGE (:StudyLevel {study_level_id: 4})
        
        MERGE (:CurriculumVersion {curriculum_version_id: 1})
    """
    await Neo4jConnection.query(query)
    
async def seed_curriculum(path):
    df = pd.read_parquet(path)
    data = df.to_dict(orient="records")
    
    query = """
        UNWIND $batch as row
        MATCH (cv:CurriculumVersion {curriculum_version_id: 1})
        MATCH (b: Batch {batch_id: "2025/2026"})
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
        SET c.name = row.cpl_name
        SET sc.name = row.sub_cpl_name
        SET q.name = row.quality_name
        SET i.name = row.indicator_name
        SET qs.name = row.question_name
        SET qs.question_scale_label = row.question_scale_label
        MERGE (b)-[:USES]->(cv)
        MERGE (cv)-[:HAS_CPL]->(c)
        MERGE (c)-[:HAS_SUB_CPL]->(sc)
        MERGE (sc)-[r:HAS_QUALITY]->(q)
        SET r.weight = toFloat(row.sub_cpl_quality_weight)
        MERGE (q)-[:HAS_INDICATOR]->(i)
        MERGE (i)-[:HAS_QUESTION]->(qs)
        """
    await Neo4jConnection.query(query, {"batch": data})
    
async def seed_students(path):
    df = pd.read_parquet(path)
    data = df.to_dict(orient="records")
    query = """
        UNWIND $batch as row
        MERGE (s:Student {nrp: row.nrp})
        MERGE (m:Major {name: row.major})
        ON CREATE SET m.major_id = randomUUID()
        MERGE (s)-[:MAJORS_IN]->(m)
        MERGE (f:Faculty {name: row.faculty})
        ON CREATE SET f.faculty_id = randomUUID()
        MERGE (m)-[:BELONGS_TO]->(f)
        MERGE (b:Batch {batch_id: "20" || substring(row.nrp, 3, 2) || "/20" || toString(toInteger(substring(row.nrp, 3, 2)) + 1)})
        MERGE (s)-[:IS_FROM_BATCH]->(b)
        WITH s, row
        MATCH (sl:StudyLevel {study_level_id: 1})
        MERGE (s)-[:CURRENTLY_IN]->(sl)
        SET s.gender = row.gender
        SET s.major = row.major
        SET s.religion = row.religion
    """
    
    await Neo4jConnection.query(query,{"batch": data})

async def seed_student_questions_relation(path):
    df = pd.read_parquet(path)
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
    WITH s, i, (avg(ra.valid_score)-1.0)/9.0 AS ind_avg_score
    MERGE (s)-[rli:HAS]->(i)
    SET rli.weight = ind_avg_score

    WITH DISTINCT s
    MATCH (s)-[ra:ANSWERED]->(:Question)<-[:HAS_QUESTION]-(:Indicator)<-[:HAS_INDICATOR]-(q:Quality)
    WITH s, q, (avg(ra.valid_score)-1.0)/9.0 AS qual_avg_score
    MERGE (s)-[rlq:HAS]->(q)
    SET rlq.weight = qual_avg_score

    WITH s, q, qual_avg_score
    MATCH (sc:SubCpl)-[sq:HAS_QUALITY]->(q)
    WITH s, sc,
        sum(qual_avg_score * sq.weight) AS weighted_score_sum,
        sum(sq.weight) AS total_weight
    WITH s, sc, weighted_score_sum / total_weight as subcpl_avg_score
    MERGE (s)-[rls:HAS]->(sc)
    SET rls.weight = subcpl_avg_score
    
    WITH s, sc, subcpl_avg_score
    MATCH (sc)<-[:HAS_SUB_CPL]-(c:Cpl)
    WITH s, c, avg(subcpl_avg_score) as cpl_avg_score
    MERGE (s)-[rlc:HAS]->(c)
    SET rlc.weight = cpl_avg_score
    """
    
    await Neo4jConnection.query(query)
    
async def seed_configs():
    query = """
    MERGE (cfu:Config:ScaleRule {scale: "university"})
    SET cfu.weight = 0.4
    
    MERGE (cfr:Config:ScaleRule {scale: "regional"})
    SET cfr.weight = 0.6
    
    MERGE (cfn:Config:ScaleRule {scale: "national"})
    SET cfn.weight = 0.8
    
    MERGE (cfi:Config:ScaleRule {scale: "international"})
    SET cfi.weight = 1.0
    
    MERGE (cfsu:Config:SpeakerDegreeRule {speaker_degree: "university_student"})
    SET cfsu.weight = 0.4
    
    MERGE (cfsb:Config:SpeakerDegreeRule {speaker_degree: "bachelor"})
    SET cfsb.weight = 0.6
    
    MERGE (cfsm:Config:SpeakerDegreeRule {speaker_degree: "master"})
    SET cfsm.weight = 0.8
    
    MERGE (cfsp:Config:SpeakerDegreeRule {speaker_degree: "phd"})
    SET cfsp.weight = 1.0
    
    MERGE (cfd:Config:DurationRule {a: -8, b: 12, c: gds.util.infinity(), d: gds.util.infinity()})
    
    MERGE (cf:Config:StudentTarget {target_score: 0.7})
    
    WITH cf
    
    MERGE (b:Batch {batch_id: "2025/2026"})-[:USES]->(cf)
    
    MERGE (:Config:EventWeight {speaker_degree_weight: 0.5, scale_weight: 0.3, duration_weight: 0.2})
    
    MERGE (:Config:RecommendationWeight {need_weight: 0.7, interest_weight: 0.3})
    """
    
    await Neo4jConnection.query(query)
    
    
async def run_all_seeders():
    # print("Seeding Batch Year and Versions...")
    # await seed_years_and_versions()
    
    # print("Seeding Students...")
    # await seed_students("data/demografi.parquet")
    
    # print("Seeding Curriculum...")
    # await seed_curriculum("data/curriculum.parquet")
    
    # print("Seeding Configuration...")
    # await seed_configs()
    
    print("Seeding Relations...")
    await seed_student_questions_relation("data/hasil_survei.parquet")
    
    print("All seeding complete!")
    
    
if __name__ == "__main__":
    import asyncio
    asyncio.run(run_all_seeders())
    
    