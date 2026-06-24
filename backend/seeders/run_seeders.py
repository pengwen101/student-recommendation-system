import pandas as pd
from backend.database import Neo4jConnection
from deep_translator import GoogleTranslator
import asyncio
import re
import textwrap
from backend.students.services import sync_student_topic_embedding
from backend import states
from backend.dependencies import get_embedding_model
from langdetect import detect, DetectorFactory
DetectorFactory.seed = 0


async def seed_years_and_versions():
    query = """
        MERGE (acy:CurrentAcademicYear {value: "2026/2027"})
        WITH acy, toInteger(right(split(acy.value, '/')[0], 2)) AS current_year
        WITH current_year, range(1, 4) AS levels
        UNWIND levels AS level
        MERGE (:StudyLevel {study_level_id: toString(level)})
        
        MERGE (:CurriculumVersion {curriculum_version_id: "1"})
    """
    await Neo4jConnection.query(query)
    
async def seed_curriculum(path, version_id="1"):
    df = pd.read_parquet(path)
    data = df.to_dict(orient="records")
    
    query = """
        UNWIND $batch as row
        MATCH (cv:CurriculumVersion {curriculum_version_id: $version_id})
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
        SET qs.flipped = row.flipped
        MERGE (cv)-[:HAS_CPL]->(c)
        MERGE (c)-[:HAS_SUB_CPL]->(sc)
        MERGE (sc)-[r:HAS_QUALITY]->(q)
        SET r.weight = toFloat(row.sub_cpl_quality_weight)
        MERGE (q)-[:HAS_INDICATOR]->(i)
        MERGE (i)-[:HAS_QUESTION]->(qs)
        """
    await Neo4jConnection.query(query, {"batch": data, "version_id": version_id})
    
    batch_query = """
        UNWIND $batches AS batch_id
        MATCH (cv:CurriculumVersion {curriculum_version_id: $version_id})
        MERGE (b:Batch {batch_id: batch_id})
        MERGE (b)-[:USES]->(cv)
    """
    await Neo4jConnection.query(batch_query, {"batches": [f"{yr}/{yr+1}" for yr in range(2022, 2026)], "version_id": version_id})
    
async def seed_students(path):
    df = pd.read_parquet(path)
    data = df.to_dict(orient="records")
    query = """
        MATCH (acy:CurrentAcademicYear)
        UNWIND $batch as row
        WITH acy, row,
             toInteger(right(split(acy.value, '/')[0], 2)) AS current_academic_year,
             toInteger(substring(row.nrp, 3, 2)) AS student_batch
        WITH row,
             toString(CASE WHEN current_academic_year - student_batch + 1 > 4 THEN 4 ELSE current_academic_year - student_batch + 1 END) AS study_level_id,
             "20" + substring(row.nrp, 3, 2) + "/20" + toString(toInteger(substring(row.nrp, 3, 2)) + 1) AS calculated_batch_id
        MERGE (sl:StudyLevel {study_level_id: study_level_id})
        MERGE (s:Student {nrp: row.nrp})
        SET s.gender = row.gender,
            s.major = row.major,
            s.religion = row.religion,
            s.full_name = row.full_name
        MERGE (m:Major {name: row.major})
        ON CREATE SET m.major_id = randomUUID()
        MERGE (f:Faculty {name: row.faculty})
        ON CREATE SET f.faculty_id = randomUUID()
        MERGE (s)-[:MAJORS_IN]->(m)
        MERGE (m)-[:BELONGS_TO]->(f)
        MERGE (b:Batch {batch_id: calculated_batch_id})
        MERGE (s)-[:IS_FROM_BATCH]->(b)
        MERGE (s)-[:CURRENTLY_IN]->(sl)
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
    
async def seed_student_topics_relation(path, embedding_model):
    df = pd.read_parquet(path)
    data = df.to_dict(orient="records")
    
    query = """
    UNWIND $batch as row
    MERGE (t:Topic {lower_name: lower(row.topic)})
    ON CREATE SET t.name = row.topic, 
                t.topic_id = randomUUID(),
                t.code = "custom",
                t:CustomTopic
    WITH row, t
    MATCH (s:Student {nrp: row.nrp})
    MERGE (s)-[:INTERESTED_IN]->(t)
    """
    await Neo4jConnection.query(query, {"batch": data})
    
    nrps = list(df['nrp'].unique())
    for nrp in nrps:
        await sync_student_topic_embedding(nrp, embedding_model)
    
    
async def seed_configs():
    query = """
    MERGE (cf:Config:StudentTarget)
    SET cf.target_score = 0.7
    MERGE (:Config:RecommendationWeight {need_weight: 0.6, interest_weight: 0.4})
    MERGE (ac:Config:AddScoreConstant)
    SET ac.weight=1.0
    """
    await Neo4jConnection.query(query)
    
async def create_resource_vector_embedding(model):
    prefix="passage: "
    property_name = "embedding"
    query = """
    MATCH (r:UniResource)-[]->(t:Topic)
    RETURN r.resource_id AS resource_id, 
           r.title AS title, 
           r.description AS description, 
           apoc.text.join(collect(t.name), ", ") AS topics
    """
    resources = await Neo4jConnection.query(query)
    text_batch = []
    for resource in resources:
        description = resource['description']
        try:
            lang = detect(description)
            if lang != 'id':
                description = GoogleTranslator(source='auto', target='id').translate(description)
        except:
            pass
        body_text = textwrap.dedent(f"""\
            Judul: {resource['title']}
            Deskripsi: {description}
            Topik: {resource['topics']}""").strip()
        structured_text = f"{prefix}{body_text}"
        text_batch.append(structured_text)

    print(f"Generating embeddings for {len(text_batch)} resources...")
    embeddings = model.encode(text_batch).tolist()
    payload = []
    for idx, resource in enumerate(resources):
        payload.append({
            "resource_id": resource['resource_id'],
            "embedding": embeddings[idx]
        })
        
    write_query = f"""
    UNWIND $resources as resource
    MATCH (r:UniResource {{resource_id: resource.resource_id}})
    CALL db.create.setNodeVectorProperty(r, '{clean_property_name}', resource.embedding)
    """
    await Neo4jConnection.query(write_query, {"resources": payload})
    print(f"Successfully updated embeddings using property key: {clean_property_name}")
    
        
async def run_all_seeders():
    print("Seeding Batch Year and Versions...")
    await seed_years_and_versions()
    
    print("Seeding Students...")
    await seed_students("data/demografi.parquet")
    
    print("Seeding Curriculum...")
    await seed_curriculum("data/curriculum.parquet")
    
    print("Seeding Configuration...")
    await seed_configs()
    
    print("Seeding Student Questions Relations...")
    await seed_student_questions_relation("data/hasil_survei.parquet")
    
    states.load_state()
    model = get_embedding_model()
    
    print("Seeding Student Topics Relations...")
    await seed_student_topics_relation("data/hasil_topik.parquet", model)
    
    print("Seeding Resource Embedding...")
    await create_resource_vector_embedding(model)
    
    print("All seeding complete!")
    
    
if __name__ == "__main__":
    import asyncio
    asyncio.run(run_all_seeders())
    
    