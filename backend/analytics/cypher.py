from backend.database import Neo4jConnection


async def support_lack_gap(curriculum_type: str, study_level_ids: list | None = None, resource_types: list | None = None, organizer_ids: list | None = None):
    query = f"""
    MATCH (c:{curriculum_type})
    MATCH (cst:Config:StudentTarget)
    
    OPTIONAL MATCH (s:Student)-[rh:HAS]->(c)
    MATCH (s)-[]->(sl:StudyLevel)
    WHERE $study_level_ids IS NULL OR sl.study_level_id IN $study_level_ids
        
    WITH c, sum(CASE WHEN cst.target_score - rh.weight > 0 THEN 1 ELSE 0 END) as student_count, sum(
        CASE WHEN cst.target_score - rh.weight < 0 THEN 0
        ELSE cst.target_score - rh.weight
        END
    ) AS lack_score
    
    WITH c, student_count, lack_score, CASE WHEN student_count = 0 THEN 0 ELSE lack_score / student_count END AS avg_lack_score

    OPTIONAL MATCH (r:UniResource)-[rs:SUPPORTS]->(c)
    WHERE $resource_types IS NULL OR r.type IN $resource_types
    
    OPTIONAL MATCH (o:Organizer)-[]->(r)-[]->(sl)
    WHERE $organizer_ids IS NULL OR o.organizer_id IN $organizer_ids
  
    WITH c, student_count, lack_score, avg_lack_score, 
    count(DISTINCT r.resource_id) as resource_count,
    sum(rs.weight * r.internal_weight) as support_score, 
    coalesce(avg(rs.weight * r.internal_weight), 0) as avg_support_score
 
    RETURN
        COALESCE(c.cpl_id, c.sub_cpl_id, c.quality_id, c.indicator_id) AS id,
        c.code AS code, 
        c.name AS name, 
        student_count,
        lack_score,
        avg_lack_score,
        resource_count,
        support_score,
        avg_support_score
    """
    
    result = await Neo4jConnection.query(query, {"study_level_ids": study_level_ids, "resource_types": resource_types, "organizer_ids": organizer_ids})
    return result

async def resource_supporting_x(curriculum_id: str | None = None, study_level_ids: list | None = None, resource_types: list | None = None, organizer_ids: list | None = None):
    query = f"""
    MATCH (n:Cpl|SubCpl|Quality|Indicator) WHERE $curriculum_id IS NULL OR n.cpl_id = $curriculum_id OR n.sub_cpl_id = $curriculum_id OR n.quality_id = $curriculum_id OR n.indicator_id = $curriculum_id
    
    MATCH (r:UniResource)-[:SUPPORTS]->(n)
    WHERE $resource_types IS NULL OR r.type IN $resource_types
    MATCH (r)-[]->(sl:StudyLevel)
    WHERE $study_level_ids IS NULL OR sl.study_level_id IN $study_level_ids
    
    OPTIONAL MATCH (r)<-[:ORGANIZES]-(o:Organizer)
    WHERE $organizer_ids IS NULL OR o.organizer_id IN $organizer_ids
    MATCH (r)-[:COVERS]->(t:Topic)
    OPTIONAL MATCH (s:Student)-[:ATTENDS]->(r)
    
    RETURN r.name as resource_name, r.type as resource_type, coalesce(collect(distinct o.name), []) as organizers, 
    coalesce(r.status, '-') as status, count(distinct s.nrp) as attendees, collect(distinct t.name) as topics
    
    """
    result = await Neo4jConnection.query(query, {"curriculum_id": curriculum_id, "study_level_ids": study_level_ids, "resource_types": resource_types, "organizer_ids": organizer_ids})
    return result

async def organizer_support(curriculum_type: str, study_level_ids: str | None, resource_types: str | None):
    query = f"""
    MATCH (o:Organizer)
    MATCH (c:{curriculum_type})
    OPTIONAL MATCH (o)-[]->(r:UniResource)-[rs:SUPPORTS]->(c)
    WHERE $resource_types IS NULL OR r.type IN $resource_types
    MATCH (r)-[]->(sl:StudyLevel)
    WHERE $study_level_ids IS NULL OR sl.study_level_id IN $study_level_ids
    WITH o, c, sum(rs.weight * r.internal_weight) as support_score
    RETURN o.organizer_id as organizer_id, o.name as organizer_name,
    coalesce(c.cpl_id, c.sub_cpl_id, c.quality_id, c.indicator_id) as curriculum_id,
    c.code as curriculum_code,
    c.name as curriculum_name,
    COALESCE(support_score, 0) AS support_score
    """
    
    result = await Neo4jConnection.query(query, {"study_level_ids": study_level_ids, "resource_types": resource_types})
    return result


async def resource_characteristic(study_level_ids: list | None = None, resource_types: str | None = None, organizer_ids: list | None = None):
    query = """
    MATCH (r:UniResource)-[rs:SUPPORTS]->(s:SubCpl)
    WHERE $resource_types IS NULL OR r.type IN $resource_types
    MATCH (r)-[]->(sl:StudyLevel)
    WHERE $study_level_ids IS NULL OR sl.study_level_id IN $study_level_ids 
    OPTIONAL MATCH (r)<-[]-(o:Organizer)
    WHERE $organizer_ids IS NULL OR o.organizer_id IN $organizer_ids
        
    RETURN r.resource_id as resource_id, COUNT(DISTINCT s) as sub_cpl_count, AVG(rs.weight) as sub_cpl_avg_support
    """
    
    result = await Neo4jConnection.query(query, {"resource_types": resource_types, "study_level_ids": study_level_ids, "organizer_ids": organizer_ids})
    return result

async def coverage_interest_gap(study_level_id: list | None = None, resource_type: str | None = None, organizer_id: str | None = None):
    query = f"""
    MATCH (t:Topic)
    OPTIONAL MATCH (s:Student)-[ri:INTERESTED_IN]->(t)
    OPTIONAL MATCH (s)-[]->(sl:StudyLevel)
    MATCH (all:StudyLevel)
    WHERE $study_level_id IS NULL OR sl.study_level_id IN $study_level_id
        
    WITH t, COUNT(DISTINCT s.nrp) AS interest_count

    OPTIONAL MATCH (r:UniResource)-[rc:COVERS]->(t)
    MATCH (o:Organizer)-[]->(r)-[]->(sl)
    
    WHERE $resource_type IS NULL OR r.type = $resource_type
    WHERE $organizer_id IS NULL OR o.organizer_id = $organizer_id
  
    WITH t, interest_count, COUNT(DISTINCT r.resource_id) as coverage_count
   
    RETURN
        t.code AS code, 
        t.name AS name, 
        COALESCE(interest_count, 0) AS interest_count,
        COALESCE(coverage_count, 0) AS coverage_count
    """
    
    result = await Neo4jConnection.query(query, {"study_level_id": study_level_id, "resource_type": resource_type, "organizer_id": organizer_id})
    return result

async def resource_support(curriculum_type: str, curriculum_id: str, study_level_id: list | None = None, resource_type: str | None = None, organizer_id: str | None = None):
    
    query = f"""
    MATCH (c:{curriculum_type})
    WHERE $curriculum_id IS NULL OR c.id = $curriculum_id
    OPTIONAL MATCH (r:UniResource)-[rs:SUPPORTS]->(c)
    OPTIONAL MATCH (o:Organizer)-[]->(r)-[]->(sl)
    WHERE $study_level_id IS NULL OR sl.study_level_id IN $study_level_id
    WHERE $resource_type IS NULL OR r.type = $resource_type
    WHERE $organizer_id IS NULL OR o.organizer_id = $organizer_id
    
    RETURN c.code as code, c.name as name, sum(r.internal_weight * rs.weight) as support_score
    """
    
    result = await Neo4jConnection.query(query, {"curriculum_id": curriculum_id, "study_level_id": study_level_id, "resource_type": resource_type, "organizer_id": organizer_id})
    return result


async def student_mastery(curriculum_type: str, curriculum_id: str | None = None, nrp: str | None = None, major_ids: list | None = None, batch_ids: list | None = None):
    query = f"""
    MATCH (c:{curriculum_type})
    """
    
    query = query + """
    WHERE $curriculum_id IS NULL
        OR COALESCE(c.cpl_id, c.sub_cpl_id, c.quality_id, c.indicator_id) = $curriculum_id
       OR EXISTS {
           MATCH (c)<-[*1..3]-(parent)
           WHERE COALESCE(parent.cpl_id, parent.sub_cpl_id, parent.quality_id, parent.indicator_id) = $curriculum_id
       }
    OPTIONAL MATCH (s:Student)-[rh:HAS]->(c)
    WHERE $nrp IS NULL OR s.nrp = $nrp
    MATCH (s)-[]->(b:Batch)
    WHERE $batch_ids IS NULL OR b.batch_id IN $batch_ids
    MATCH (s)-[]->(m:Major)
    WHERE $major_ids iS NULL OR m.major_id IN $major_ids
    
    MATCH (b)-[]->(cf:Config:StudentTarget)
    
    RETURN COALESCE(c.cpl_id, c.sub_cpl_id, c.quality_id, c.indicator_id) AS curriculum_id, c.code as curriculum_code, c.name as curriculum_name, avg(rh.weight) as mastery_score, cf.target_score as target_score
    """
    
    result = await Neo4jConnection.query(query, {"batch_ids": batch_ids, "major_ids": major_ids, "nrp": nrp, "curriculum_id": curriculum_id})
    return result


# async def student_history(academic_year: str, semester: str, nrp: str | None = None, major_ids = list | None = None, study_level_ids: list | None = None):
#     query = """
    
#     MATCH (s:Student)-[]->(m:Major)
#     WHERE ($nrp IS NULL OR s.nrp = $nrp) AND ($major_ids IS NULL OR m.major_id IN $major_ids)
#     MATCH (s)-[]->(sl:StudyLevel)
#     WHERE $study_level_ids IS NULL OR sl.study_level_id IN $study_level_ids
#     MATCH (s)-[rh:HAS]->(c:Cpl)
#     OPTIONAL MATCH (s)-[:LOGGED_SCORE]->(h:ScoreHistory)
#     WHERE h.date >= min_year AND h.date <= max_year AND h.date >= min_month and h.date <= max_month
    
#     WITH avg(rh.weight) AS latest_mastery, h ORDER BY h.date
#     WITH latest_mastery, collect(h) as periods
#     UNWIND range(0, size(periods)-1) AS i
#     WITH periods[i] as current, periods[i-1] as prev
#     WHERE current.avg_cpl_weight IS NULL
#     SET current.value = previous.value
#     """