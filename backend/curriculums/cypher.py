from backend.database import Neo4jConnection

async def read_curriculum(version_id: str):
    query = """
        MATCH (v:CurriculumVersion {curriculum_version_id: toInteger($version_id)})-[:HAS_CPL]->(c:Cpl)
        MATCH (c)-[:HAS_SUB_CPL]->(s:SubCpl)
        MATCH (s)-[rel_sq:HAS_QUALITY]->(q:Quality)
        MATCH (q)-[:HAS_INDICATOR]->(i:Indicator)
        MATCH (i)-[:HAS_QUESTION]->(qs:Question)

        ORDER BY c.code ASC, s.code ASC, q.code ASC, i.code ASC, qs.code ASC

        WITH c, s, rel_sq, q, i, collect({
        question_id: qs.question_id,
        code: qs.code,
        name: qs.name,
        lower_bound: split(qs.question_scale_label, ",")[0],
        upper_bound: split(qs.question_scale_label, ",")[1],
        lower_text: split(qs.question_scale_label, ",")[2],
        upper_text: split(qs.question_scale_label, ",")[3],
        flipped: qs.flipped
        }) AS ordered_questions

        WITH c, s, rel_sq, q, collect({
        indicator_id: i.indicator_id,
        name: i.name,
        code: i.code,
        questions: ordered_questions
        }) AS ordered_indicators

        WITH c, s, collect({
        quality_id: q.quality_id,
        name: q.name,
        code: q.code,
        weight: rel_sq.weight,
        indicators: ordered_indicators
        }) AS ordered_qualities

        WITH c, collect({
        sub_cpl_id: s.sub_cpl_id,
        name: s.name,
        code: s.code,
        qualities: ordered_qualities
        }) AS ordered_subcpls

        ORDER BY c.code ASC
        RETURN {
        cpl_id: c.cpl_id,
        name: c.name,
        code: c.code,
        subcpls: ordered_subcpls
        } AS curriculum
    """
    response = await Neo4jConnection.query(query, {"version_id": version_id})
    unwrapped_cpls = [record["curriculum"] for record in response]
    return unwrapped_cpls

async def read_questions():
    query = """
    MATCH (qs:Question)
    WITH qs.question_id as question_id, qs.code as code, qs.name as name, split(qs.question_scale_label, ",") as splitted
    RETURN question_id, code, name, splitted[0] as lower_bound, splitted[1] as upper_bound, splitted[2] as lower_text, splitted[3] as upper_text
    """
    return await Neo4jConnection.query(query)
    
async def study_level_exists(study_level_id: str):
    query = """
    MATCH (sl:StudyLevel {study_level_id: $study_level_id})
    RETURN count(sl) > 0 as exists
    """
    response = await Neo4jConnection.query(query, {"study_level_id": study_level_id})
    return response[0]['exists'] if response else False

async def read_curriculum_versions():
    query = """
        MATCH (cv:CurriculumVersion)
        RETURN cv.curriculum_version_id as curriculum_version_id
    """
    
    response = await Neo4jConnection.query(query)
    return response


async def get_max_curriculum_version_id():
    query = """
        MATCH (cv:CurriculumVersion)
        RETURN max(cv.curriculum_version_id) AS max_id
    """
    response = await Neo4jConnection.query(query)
    return response[0]["max_id"] if response and response[0]["max_id"] is not None else 0


async def create_curriculum_version(version_id: int):
    query = """
        CREATE (cv:CurriculumVersion {curriculum_version_id: $version_id})
    """
    await Neo4jConnection.query(query, {"version_id": version_id})


async def batch_create_cpls(version_id: int, cpls: list[dict]):
    query = """
        UNWIND $cpls AS row
        MATCH (cv:CurriculumVersion {curriculum_version_id: $version_id})
        CREATE (n:Cpl {cpl_id: row.cpl_id, code: row.code, name: row.name})
        MERGE (cv)-[:HAS_CPL]->(n)
    """
    await Neo4jConnection.query(query, {"version_id": version_id, "cpls": cpls})


async def batch_create_subcpls(subcpls: list[dict]):
    query = """
        UNWIND $subcpls AS row
        MATCH (c:Cpl {cpl_id: row.cpl_id})
        CREATE (n:SubCpl {sub_cpl_id: row.sub_cpl_id, code: row.code, name: row.name})
        MERGE (c)-[:HAS_SUB_CPL]->(n)
    """
    await Neo4jConnection.query(query, {"subcpls": subcpls})


async def batch_create_qualities(qualities: list[dict]):
    query = """
        UNWIND $qualities AS row
        CREATE (n:Quality {quality_id: row.quality_id, code: row.code, name: row.name})
    """
    await Neo4jConnection.query(query, {"qualities": qualities})


async def batch_link_qualities(links: list[dict]):
    query = """
        UNWIND $links AS row
        MATCH (sc:SubCpl {sub_cpl_id: row.sub_cpl_id})
        MATCH (q:Quality {quality_id: row.quality_id})
        MERGE (sc)-[r:HAS_QUALITY]->(q)
        SET r.weight = toFloat(row.weight)
    """
    await Neo4jConnection.query(query, {"links": links})


async def batch_create_indicators(indicators: list[dict]):
    query = """
        UNWIND $indicators AS row
        MATCH (q:Quality {quality_id: row.quality_id})
        CREATE (n:Indicator {indicator_id: row.indicator_id, code: row.code, name: row.name})
        MERGE (q)-[:HAS_INDICATOR]->(n)
    """
    await Neo4jConnection.query(query, {"indicators": indicators})


async def batch_create_questions(questions: list[dict]):
    query = """
        UNWIND $questions AS row
        MATCH (i:Indicator {indicator_id: row.indicator_id})
        CREATE (n:Question {
            question_id: row.question_id,
            code: row.code,
            name: row.name,
            question_scale_label: row.scale_label,
            flipped: row.flipped
        })
        MERGE (i)-[:HAS_QUESTION]->(n)
    """
    await Neo4jConnection.query(query, {"questions": questions})


async def get_batch_info_for_version(version_id: str):
    query = """
        MATCH (b:Batch)-[:USES]->(cv:CurriculumVersion {curriculum_version_id: toInteger($version_id)})
        OPTIONAL MATCH (s:Student)-[:IS_FROM_BATCH]->(b)
        RETURN b.batch_id AS batch_id, count(DISTINCT s) AS student_count
        ORDER BY b.batch_id
    """
    return await Neo4jConnection.query(query, {"version_id": version_id})


async def link_version_to_batch(version_id: int, batch_id: str):
    query = """
        MATCH (cv:CurriculumVersion {curriculum_version_id: $version_id})
        MERGE (b:Batch {batch_id: $batch_id})
        MERGE (b)-[:USES]->(cv)
    """
    await Neo4jConnection.query(query, {"version_id": version_id, "batch_id": batch_id})
    