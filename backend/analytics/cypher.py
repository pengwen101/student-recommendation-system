from backend.database import Neo4jConnection


async def support_lack_gap(curriculum_type: str, curriculum_id: str | None = None, study_level_ids: list | None = None, resource_types: list | None = None, organizer_ids: list | None = None):
    query = f"""
    MATCH (c:{curriculum_type})
    WHERE $curriculum_id IS NULL
    OR EXISTS {{
           MATCH (c)<-[*1..3]-(parent)
           WHERE COALESCE(parent.cpl_id, parent.sub_cpl_id, parent.quality_id, parent.indicator_id) = $curriculum_id
       }}
    MATCH (cst:Config:StudentTarget)
 
    CALL {{
        WITH c, cst
        OPTIONAL MATCH (s:Student)-[rh:HAS]->(c)
        WHERE ($study_level_ids IS NULL OR EXISTS {{
            MATCH (s)-[:CURRENTLY_IN]->(sl:StudyLevel)
            WHERE sl.study_level_id IN $study_level_ids
        }})
        
        WITH c, cst, rh
        WHERE rh IS NOT NULL
        
        RETURN 
            sum(CASE WHEN cst.target_score - rh.weight > 0 THEN 1 ELSE 0 END) as student_count,
            sum(CASE WHEN cst.target_score - rh.weight < 0 THEN 0 ELSE cst.target_score - rh.weight END) AS lack_score
    }}
 
    WITH c, coalesce(student_count, 0) as student_count, coalesce(lack_score, 0) as lack_score,
         CASE WHEN student_count = 0 THEN 0 ELSE lack_score / student_count END AS avg_lack_score

    CALL {{
        WITH c
        OPTIONAL MATCH (r:UniResource)-[rs:SUPPORTS]->(c)
        WITH r, rs WHERE r IS NOT NULL
        WITH r, rs, tolower(head([l IN labels(r) WHERE l <> 'UniResource'])) AS r_type 
        WHERE ($resource_types IS NULL OR r_type IN $resource_types)
        AND ($organizer_ids IS NULL OR r_type <> 'event' OR EXISTS {{
            MATCH (o:Organizer)-[:ORGANIZES]->(r)
            WHERE o.organizer_id IN $organizer_ids
        }})
        AND ($study_level_ids IS NULL OR r_type <> 'event' OR EXISTS {{
            MATCH (r)-[:AVAILABLE_FOR]->(sl:StudyLevel)
            WHERE sl.study_level_id IN $study_level_ids
        }})
        WITH r, rs WHERE r IS NOT NULL
        
        RETURN 
            count(DISTINCT r.resource_id) as resource_count,
            sum(rs.weight * r.internal_weight) as support_score, 
            coalesce(avg(rs.weight * r.internal_weight), 0) as avg_support_score
    }}
 
    RETURN
        COALESCE(c.cpl_id, c.sub_cpl_id, c.quality_id, c.indicator_id) AS id,
        c.code AS code, 
        c.name AS name, 
        student_count,
        lack_score,
        avg_lack_score,
        coalesce(resource_count, 0) as resource_count,
        coalesce(support_score, 0) as support_score,
        coalesce(avg_support_score, 0) as avg_support_score
    """
    
    result = await Neo4jConnection.query(query, {"curriculum_id": curriculum_id, "study_level_ids": study_level_ids, "resource_types": resource_types, "organizer_ids": organizer_ids})
    return result

async def resource_supporting_x(curriculum_id: str | None = None, study_level_ids: list | None = None, resource_types: list | None = None, organizer_ids: list | None = None):
    query = f"""
    MATCH (n:Cpl|SubCpl|Quality|Indicator) 
    WHERE $curriculum_id IS NULL 
       OR n.cpl_id = $curriculum_id 
       OR n.sub_cpl_id = $curriculum_id 
       OR n.quality_id = $curriculum_id 
       OR n.indicator_id = $curriculum_id
    
    MATCH (r:UniResource)-[:SUPPORTS]->(n)
    WITH DISTINCT r, tolower(head([l IN labels(r) WHERE l <> 'UniResource'])) AS r_type 
    WHERE ($resource_types IS NULL OR r_type IN $resource_types)
      
      AND ($study_level_ids IS NULL OR r_type <> 'event' OR EXISTS {{
          MATCH (r)-[:AVAILABLE_FOR]->(sl:StudyLevel)
          WHERE sl.study_level_id IN $study_level_ids
      }})
      
      AND ($organizer_ids IS NULL OR r_type <> 'event' OR EXISTS {{
          MATCH (r)<-[:ORGANIZES]-(o:Organizer)
          WHERE o.organizer_id IN $organizer_ids
      }})

    RETURN 
        r.title as resource_title, 
        tolower(head([l IN labels(r) WHERE l <> 'UniResource'])) as resource_type, 
        coalesce(r.status, '-') as status, 
        [(r)<-[:ORGANIZES]-(o:Organizer) | o.name] AS organizers,
        [(r)-[:COVERS]->(t:Topic) | t.name] AS topics,
        COUNT {{ (s:Student)-[:ATTENDS]->(r) }} AS attendees
    """
    result = await Neo4jConnection.query(query, {"curriculum_id": curriculum_id, "study_level_ids": study_level_ids, "resource_types": resource_types, "organizer_ids": organizer_ids})
    return result

async def organizer_support(curriculum_type: str, study_level_ids: list | None = None, resource_types: list | None = None):
    query = f"""
    MATCH (o:Organizer)
    MATCH (c:{curriculum_type})
    CALL {{
        WITH o, c
        OPTIONAL MATCH (o)-[:ORGANIZES]->(r:UniResource)-[rs:SUPPORTS]->(c)
        WITH o, c, r, rs, tolower(head([l IN labels(r) WHERE l <> 'UniResource'])) AS r_type
        WHERE r IS NOT NULL
          AND ($resource_types IS NULL OR r_type IN $resource_types)
          AND ($study_level_ids IS NULL OR r_type <> 'event' OR EXISTS {{
              MATCH (r)-[:AVAILABLE_FOR]->(sl:StudyLevel)
              WHERE sl.study_level_id IN $study_level_ids
          }})
        RETURN sum(rs.weight * r.internal_weight) AS support_score
    }}
    RETURN 
        o.organizer_id AS organizer_id, 
        o.name AS organizer_name,
        COALESCE(c.cpl_id, c.sub_cpl_id, c.quality_id, c.indicator_id) AS curriculum_id,
        c.code AS curriculum_code,
        c.name AS curriculum_name,
        COALESCE(support_score, 0) AS support_score
    """
    
    result = await Neo4jConnection.query(query, {
        "study_level_ids": study_level_ids, 
        "resource_types": resource_types
    })
    return result


async def resource_characteristic(study_level_ids: list | None = None, resource_types: list | None = None, organizer_ids: list | None = None):
    query = """
    MATCH (r:UniResource)
    WITH r, tolower(head([l IN labels(r) WHERE l <> 'UniResource'])) AS r_type
    WHERE ($resource_types IS NULL OR r_type IN $resource_types)
    
    AND ($study_level_ids IS NULL OR r_type <> 'event' OR EXISTS {
        MATCH (r)-[:AVAILABLE_FOR]->(sl:StudyLevel)
        WHERE sl.study_level_id IN $study_level_ids
    })
    
    AND ($organizer_ids IS NULL OR r_type <> 'event' OR EXISTS {
        MATCH (r)<-[:ORGANIZES]-(o:Organizer)
        WHERE o.organizer_id IN $organizer_ids
    })
    
    MATCH (r)-[rs:SUPPORTS]->(s:SubCpl)
        
    RETURN 
        r.resource_id as resource_id, 
        COUNT(DISTINCT s) as sub_cpl_count, 
        AVG(rs.weight) as sub_cpl_avg_support
    """
    
    result = await Neo4jConnection.query(query, {
        "resource_types": resource_types, 
        "study_level_ids": study_level_ids, 
        "organizer_ids": organizer_ids
    })
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
    
    WHERE $resource_type IS NULL OR tolower(head([l IN labels(r) WHERE l <> 'UniResource'])) = $resource_type
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
    WHERE $resource_type IS NULL OR tolower(head([l IN labels(r) WHERE l <> 'UniResource'])) = $resource_type
    WHERE $organizer_id IS NULL OR o.organizer_id = $organizer_id
    
    RETURN c.code as code, c.name as name, sum(r.internal_weight * rs.weight) as support_score
    """
    
    result = await Neo4jConnection.query(query, {"curriculum_id": curriculum_id, "study_level_id": study_level_id, "resource_type": resource_type, "organizer_id": organizer_id})
    return result


async def student_mastery(curriculum_type: str, curriculum_id: str | None = None, nrp: str | None = None, major_ids: list | None = None, batch_ids: list | None = None):
    query = f"""
    MATCH (c:{curriculum_type})
    WHERE $curriculum_id IS NULL
       OR COALESCE(c.cpl_id, c.sub_cpl_id, c.quality_id, c.indicator_id) = $curriculum_id
       OR EXISTS {{
           MATCH (c)<-[*1..3]-(parent)
           WHERE COALESCE(parent.cpl_id, parent.sub_cpl_id, parent.quality_id, parent.indicator_id) = $curriculum_id
       }}
    CALL (c) {{
        OPTIONAL MATCH (s:Student)-[rh:HAS]->(c)
        WHERE rh IS NOT NULL
          AND ($nrp IS NULL OR s.nrp = $nrp)
          
          AND ($batch_ids IS NULL OR EXISTS {{
              MATCH (s)-[]->(b:Batch)
              WHERE b.batch_id IN $batch_ids
          }})
          
          AND ($major_ids IS NULL OR EXISTS {{
              MATCH (s)-[]->(m:Major)
              WHERE m.major_id IN $major_ids
          }})
        OPTIONAL MATCH (s)-[]->(b:Batch)-[]->(cf:Config:StudentTarget)
        RETURN 
            avg(rh.weight) AS mastery_score, 
            avg(cf.target_score) AS target_score
    }}
    RETURN 
        COALESCE(c.cpl_id, c.sub_cpl_id, c.quality_id, c.indicator_id) AS curriculum_id, 
        c.code AS curriculum_code, 
        c.name AS curriculum_name, 
        COALESCE(mastery_score, 0) AS mastery_score, 
        COALESCE(target_score, 0) AS target_score
    """
    result = await Neo4jConnection.query(query, {
        "batch_ids": batch_ids, 
        "major_ids": major_ids, 
        "nrp": nrp, 
        "curriculum_id": curriculum_id
    })
    return result

async def student_comparison(curriculum_type: str, curriculum_id: str | None = None, nrp: str | None = None, major_ids: list | None = None, batch_ids: list | None = None):
    query = """
    MATCH (s:Student)
    CALL (s) {
        OPTIONAL MATCH (s)-[ra:ATTENDED]->(r:UniResource)
        WITH count(ra) AS total_attended, 
             sum(CASE WHEN ra.recommendation_score > 0 THEN 1.0 ELSE 0.0 END) AS rec_attended
        RETURN CASE 
            WHEN total_attended > 0 AND (rec_attended / total_attended) > 0.5 THEN true 
            ELSE false 
        END AS follow_rec
    }
    CALL (s) {
        OPTIONAL MATCH (s)-[rh:HAS]->(sc:SubCpl)
        RETURN avg(rh.weight) AS student_avg_score
    }
    WHERE student_avg_score IS NOT NULL
    RETURN 
        follow_rec, 
        avg(student_avg_score) AS sub_cpl_avg_score
    """
    
    result = await Neo4jConnection.query(query)
    return result
    

async def student_history(academic_year: str, nrp: str | None = None, major_ids: list | None = None, study_level_ids: list | None = None):
    query = """
    
    MATCH (s:Student)-[]->(m:Major)
    WHERE ($nrp IS NULL OR s.nrp = $nrp) AND ($major_ids IS NULL OR m.major_id IN $major_ids)
    MATCH (s)-[]->(sl:StudyLevel)
    WHERE $study_level_ids IS NULL OR sl.study_level_id IN $study_level_ids
    MATCH (s)-[rh:HAS]->(c:Cpl)
    OPTIONAL MATCH (s)-[:LOGGED_SCORE]->(ch:CplHistory)
    
    """
    
    