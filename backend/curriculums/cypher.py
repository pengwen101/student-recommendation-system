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
        upper_text: split(qs.question_scale_label, ",")[3]
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
    