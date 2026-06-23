from backend.database import Neo4jConnection

TOPIC_EMBEDDING_PROPERTY = "embedding"

async def read_student_topics(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[r:INTERESTED_IN]->(t:Topic)
        RETURN t.topic_id as topic_id, t.code as code, t.name as name
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response

async def student_exists(nrp: str):
    query = """
    MATCH (s: Student {nrp: $nrp})
    RETURN count(s) > 0 as exists
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False

async def create_student_question_relation(nrp: str, data: list[dict]):
    query = """
    MATCH (s:Student {nrp: $nrp})
    UNWIND $relations as relation
    MATCH (qs:Question {question_id: relation.question_id})
    MERGE (s)-[ra:ANSWERED]->(qs)
    SET ra.score = relation.answer
    SET ra.valid_score = CASE WHEN qs.flipped = false THEN relation.answer ELSE 11 - relation.answer END
    
    WITH DISTINCT s
    MATCH (s)-[ra:ANSWERED]->(:Question)<-[:HAS_QUESTION]-(i:Indicator)
    WITH s, i, (avg(ra.valid_score)-1.0)/9.0 AS ind_avg_score
    MERGE (s)-[rli:HAS]->(i)
    SET rli.weight = ind_avg_score

    WITH s
    MATCH (s)-[rli:HAS]->(i:Indicator)<-[:HAS_INDICATOR]-(q:Quality)
    WITH s, q, avg(rli.weight) AS qual_avg_score
    MERGE (s)-[rlq:HAS]->(q)
    SET rlq.weight = qual_avg_score

    WITH s
    MATCH (s)-[rlq:HAS]->(q:Quality)<-[sq:HAS_QUALITY]-(sc:SubCpl)
    WITH s, sc, 
        sum(rlq.weight * sq.weight) AS weighted_score_sum,
        sum(sq.weight) AS total_weight
    WITH s, sc, weighted_score_sum / total_weight as subcpl_avg_score
    MERGE (s)-[rls:HAS]->(sc)
    SET rls.weight = subcpl_avg_score
    
    WITH s
    MATCH (s)-[rls:HAS]->(sc:SubCpl)<-[:HAS_SUB_CPL]-(c:Cpl)
    WITH s, c, avg(rls.weight) as cpl_avg_score
    MERGE (s)-[rlc:HAS]->(c)
    SET rlc.weight = cpl_avg_score
    """
    await Neo4jConnection.query(query, {"nrp": nrp, "relations": data})
    
    
async def create_student_topics(nrp: str, topic_list: list):
    query = """
        MATCH (s:Student {nrp: $nrp})
        UNWIND $topics as topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (s)-[r:INTERESTED_IN]->(t)
    """
    params = {"nrp": nrp, "topics": topic_list}
    await Neo4jConnection.query(query, params)

async def update_student_topics(nrp: str, topic_list: list):
    query = """
        MATCH (s:Student {nrp: $nrp})
        OPTIONAL MATCH (s)-[r:INTERESTED_IN]->(:Topic)
        DELETE r
        WITH s
        UNWIND $topics as topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (s)-[r:INTERESTED_IN]->(t)
    """
    params = {"nrp": nrp, "topics": topic_list}
    await Neo4jConnection.query(query, params)


async def set_student_topic_embedding(nrp: str, embedding: list[float]):
    query = f"""
        MATCH (s:Student {{nrp: $nrp}})
        CALL db.create.setNodeVectorProperty(s, '{TOPIC_EMBEDDING_PROPERTY}', $embedding)
    """
    await Neo4jConnection.query(query, {"nrp": nrp, "embedding": embedding})


async def clear_student_topic_embedding(nrp: str):
    query = f"""
        MATCH (s:Student {{nrp: $nrp}})
        REMOVE s.{TOPIC_EMBEDDING_PROPERTY}
    """
    await Neo4jConnection.query(query, {"nrp": nrp})
    
    
async def read_student_lack_indicators(nrp: str):
    query = """
    MATCH (cf:Config:StudentTarget)
    MATCH (s:Student {nrp: $nrp})-[r:HAS]->(i:Indicator)
    WITH i, cf.target_score - r.weight AS calculated_weight
    WHERE calculated_weight > 0
    RETURN i.indicator_id as indicator_id, 
           i.code as code, 
           i.name as name, 
           calculated_weight as weight
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response

async def read_student_subcpls(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[r:HAS]->(sc:SubCpl)
        RETURN sc.sub_cpl_id as sub_cpl_id, sc.code as code, sc.name as name, r.weight as weight
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response

async def read_student_cpls(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[r:HAS]->(c:Cpl)
        RETURN c.cpl_id as cpl_id, c.code as code, c.name as name, r.weight as weight
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response
    
async def has_topics(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[ri:INTERESTED_IN]->(t:Topic)
        RETURN count(ri) > 0 as has_topics
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response[0]['has_topics'] if response else False

async def has_indicators(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[rl:HAS]->(i:Indicator)
        RETURN count(rl) > 0 as has_indicators
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response[0]['has_indicators'] if response else False

async def get_student_recommendations(nrp: str, label: str, top_k: int):
    query = f"""
        MATCH (s:Student {{nrp: $nrp}})
        MATCH (st:Config:StudentTarget)
        MATCH (cf:Config:RecommendationWeight)
        CALL (s, st) {{
            OPTIONAL MATCH (s)-[rl:HAS]->(:Indicator)
            RETURN sum(CASE
                WHEN rl IS NOT NULL AND (st.target_score - rl.weight) > 0
                THEN (st.target_score - rl.weight)
                ELSE 0.0 END) AS total_lack_weight
        }}
        CALL (s) {{
            OPTIONAL MATCH (s)-[ri:INTERESTED_IN]->(:Topic)
            RETURN count(ri) AS total_interest_count
        }}

        MATCH (s)-[:CURRENTLY_IN]->(sl:StudyLevel)
        MATCH (r:UniResource:{label})
        WHERE r.is_active = true
          AND (NOT 'Event' IN labels(r) OR (r)-[:AVAILABLE_FOR]->(sl))

        CALL (s, r, st) {{
            OPTIONAL MATCH (s)-[rl:HAS]->(i:Indicator)<-[rp:SUPPORTS]-(r)
            WITH rl, rp, st,
                 CASE
                    WHEN rl IS NOT NULL AND (st.target_score - rl.weight) > 0
                    THEN (st.target_score - rl.weight)
                    ELSE 0.0 END AS specific_lack_weight

            RETURN sum(CASE
                WHEN rl IS NULL OR rp IS NULL THEN 0.0
                WHEN specific_lack_weight < rp.weight THEN specific_lack_weight
                ELSE rp.weight END) AS indicator_intersection
        }}

        CALL (s, r) {{
            OPTIONAL MATCH (s)-[ri:INTERESTED_IN]->(t:Topic)<-[rt:COVERS]-(r)
            RETURN sum(CASE WHEN ri IS NULL OR rt IS NULL THEN 0.0 ELSE 1.0 END) AS topic_intersection
        }}

        WITH s, r, cf, total_lack_weight, total_interest_count, indicator_intersection, topic_intersection,
               (CASE WHEN total_lack_weight > 0 THEN indicator_intersection / total_lack_weight ELSE 0.0 END) AS need_score,
               (CASE WHEN total_interest_count > 0 THEN topic_intersection / total_interest_count ELSE 0.0 END) AS topic_fuzzy_score

           WITH s, r, cf, need_score, topic_fuzzy_score,
               CASE
                   WHEN s.{TOPIC_EMBEDDING_PROPERTY} IS NULL OR r.embedding IS NULL THEN 0.0
                   ELSE vector.similarity.cosine(s.{TOPIC_EMBEDDING_PROPERTY}, r.embedding)
               END AS vector_similarity

         WITH s, r, need_score, topic_fuzzy_score, vector_similarity,
             ((cf.need_weight * need_score) + (cf.interest_weight * ((topic_fuzzy_score + vector_similarity) / 2.0)))
             * coalesce(r.internal_weight, 1.0) AS score

        ORDER BY score DESC
        LIMIT $top_k
        RETURN {{
            resource_id: r.resource_id,
            type: tolower(head([l IN labels(r) WHERE l <> 'UniResource'])),
            title: r.title,
            is_active: r.is_active,
            description: r.description,
            content_link: r.content_link,
            article_text: r.article_text,
            isbn: r.isbn,
            authors: r.authors,
            published_date: CASE WHEN r.published_date IS NOT NULL THEN apoc.temporal.format(r.published_date, "yyyy-MM-dd") ELSE null END,
            publisher: r.publisher,
            status: r.status,
            internal_weight: r.internal_weight,
            sessions: [(r)-[:HAS_SESSION]->(ss:Session) | {{
                session_id: ss.session_id,
                start_datetime: apoc.temporal.format(ss.start_datetime, "yyyy-MM-dd'T'HH:mm:ss"),
                end_datetime: apoc.temporal.format(ss.end_datetime, "yyyy-MM-dd'T'HH:mm:ss")
            }}],
            organizers: [(r)<-[og:ORGANIZES]-(o:Organizer) | {{
                organizer_id: o.organizer_id,
                name: o.name
            }}],
            study_levels: [(r)-[af:AVAILABLE_FOR]->(sl:StudyLevel) | {{
                study_level_id: sl.study_level_id
            }}],
            resource_assessments: [(r)-[rh:HAS]->(ra:ResourceAssessment) | {{
                resource_assessment_id: ra.resource_assessment_id,
                display_name: ra.display_name,
                resource_type: ra.resource_type,
                weight: toFloat(ra.weight),
                resource_weight: toFloat(rh.weight),
                lower_text: ra.lower_text,
                upper_text: ra.upper_text
            }}],
            indicators: [(r)-[rsi:SUPPORTS]->(i:Indicator) | {{
                indicator_id: i.indicator_id
            }}],
            topics: [(r)-[rc:COVERS]->(t:Topic) | {{
                topic_id: t.topic_id,
                code: t.code,
                name: t.name
            }}],
            calculations: {{
                indicators: [(r)-[rsi:SUPPORTS]->(i:Indicator) | {{
                    indicator_id: i.indicator_id,
                    code: i.code,
                    name: i.name,
                    weight: toFloat(rsi.weight)
                }}],
                qualities: [(r)-[rsq:SUPPORTS]->(q:Quality) | {{
                    quality_id: q.quality_id,
                    code: q.code,
                    name: q.name,
                    weight: toFloat(rsq.weight)
                }}],
                subcpls: [(r)-[rss:SUPPORTS]->(sc:SubCpl) | {{
                    sub_cpl_id: sc.sub_cpl_id,
                    code: sc.code,
                    name: sc.name,
                    weight: toFloat(rss.weight)
                }}]
            }}
        }} AS resource,
        score,
        need_score,
        topic_fuzzy_score,
        vector_similarity
    """

    params = {
        "nrp": nrp,
        "top_k": top_k,
    }
    response = await Neo4jConnection.query(query, params)
    return response


async def create_student(nrp: str, email: str, name: str):
    query = """
        MATCH (acy:CurrentAcademicYear)
        WITH acy,
             toInteger(right(split(acy.value, '/')[0], 2)) AS current_academic_year,
             toInteger(substring($nrp, 3, 2)) AS student_batch
        WITH acy,
             current_academic_year,
             student_batch,
             toString(CASE WHEN current_academic_year - student_batch + 1 > 4 THEN 4 ELSE current_academic_year - student_batch + 1 END) AS study_level_id,
             "20" + substring($nrp, 3, 2) + "/20" + toString(toInteger(substring($nrp, 3, 2)) + 1) AS batch_id
        MERGE (sl:StudyLevel {study_level_id: study_level_id})
        MERGE (s:Student {nrp: $nrp})
        ON CREATE SET s.email = $email,
                      s.name = $name
        ON MATCH SET s.email = $email,
                     s.name = $name
        MERGE (b:Batch {batch_id: batch_id})
        MERGE (s)-[:CURRENTLY_IN]->(sl)
        MERGE (s)-[:IS_FROM_BATCH]->(b)
        RETURN s.nrp AS nrp,
               s.email AS email,
               s.name AS name,
               sl.study_level_id AS study_level_id,
               b.batch_id AS batch_id,
               acy.value AS current_academic_year
    """

    params = {
        "nrp": nrp,
        "email": email,
        "name": name,
    }
    response = await Neo4jConnection.query(query, params)
    return response


async def record_student_attendance(resource_id: str, nrps: list[str]):
    query = f"""
        MATCH (r:UniResource {{resource_id: $resource_id}})
        MATCH (st:Config:StudentTarget)
        MATCH (cf:Config:RecommendationWeight)      
        UNWIND $nrps AS nrp
        MATCH (s:Student {{nrp: nrp}})       
        CALL (s, st) {{
            OPTIONAL MATCH (s)-[rl:HAS]->(:Indicator)
            RETURN sum(CASE 
                WHEN rl IS NOT NULL AND (st.target_score - rl.weight) > 0 
                THEN (st.target_score - rl.weight) 
                ELSE 0.0 END) AS total_lack_weight
        }}       
        CALL (s) {{
            OPTIONAL MATCH (s)-[ri:INTERESTED_IN]->(:Topic)
            RETURN count(ri) AS total_interest_count
        }}       
        CALL (s, r, st) {{
            OPTIONAL MATCH (s)-[rl:HAS]->(i:Indicator)<-[rp:SUPPORTS]-(r)
            WITH rl, rp, st,
                 CASE 
                    WHEN rl IS NOT NULL AND (st.target_score - rl.weight) > 0 
                    THEN (st.target_score - rl.weight) 
                    ELSE 0.0 END AS specific_lack_weight
            
            RETURN sum(CASE 
                WHEN rl IS NULL OR rp IS NULL THEN 0.0
                WHEN specific_lack_weight < rp.weight THEN specific_lack_weight
                ELSE rp.weight END) AS indicator_intersection
        }}       
        CALL (s, r) {{
            OPTIONAL MATCH (s)-[ri:INTERESTED_IN]->(t:Topic)<-[rt:COVERS]-(r)
            RETURN sum(CASE WHEN ri IS NULL OR rt IS NULL THEN 0.0 ELSE 1.0 END) AS topic_intersection
        }}        
        WITH s, r, cf, total_lack_weight, total_interest_count, indicator_intersection, topic_intersection,
             CASE
                 WHEN s.{TOPIC_EMBEDDING_PROPERTY} IS NULL OR r.embedding IS NULL THEN 0.0
                 ELSE vector.similarity.cosine(s.{TOPIC_EMBEDDING_PROPERTY}, r.embedding)
             END AS vector_similarity

        WITH s, r,
             ((
                cf.need_weight * (CASE WHEN total_lack_weight > 0 THEN indicator_intersection / total_lack_weight ELSE 0.0 END)
             ) + (
                cf.interest_weight * (((CASE WHEN total_interest_count > 0 THEN topic_intersection / total_interest_count ELSE 0.0 END) + vector_similarity) / 2.0)
             )) * coalesce(r.internal_weight, 1.0) AS final_score
    
        MERGE (s)-[att:ATTENDED]->(r)
        SET att.recommendation_score = final_score,
            att.recorded_at = datetime({{timezone: 'Asia/Jakarta'}})
    """
    
    params = {
        "resource_id": resource_id,
        "nrps": nrps
    }
    
    await Neo4jConnection.query(query, params)
    await add_student_score(resource_id, nrps)
    
    
async def delete_student_attendance(resource_id: str, nrp: str | None = None):
    query = """
        MATCH (r:UniResource {resource_id: $resource_id})<-[ra:ATTENDED]-(s:Student)
        WHERE $nrp IS NULL OR s.nrp = $nrp
        DELETE ra
    """
    params = {
        "resource_id": resource_id,
        "nrp": nrp
    }
    
    await Neo4jConnection.query(query, params)
    await delete_student_score(resource_id, nrp)
    
async def add_student_score(resource_id: str, nrps: list[str]):
    query = """
        MATCH (r:UniResource {resource_id: $resource_id})
        MATCH (cf:Config:AddScoreConstant)
        
        UNWIND $nrps as nrp
        MATCH (s:Student {nrp: nrp})
        
        CALL (s, r, cf) {
            MATCH (r)-[rs:SUPPORTS]->(i:Indicator)       
            MATCH (s)-[rh:HAS]->(i)
            
            WITH s, r, i, rh, cf, rs,
                 rh.weight + (cf.weight * rs.weight * coalesce(r.internal_weight, 1.0)) AS calc_score
    
            CREATE (st:ScoreTransaction {
                score_transaction_id: randomUUID(),
                timestamp: datetime({timezone: 'Asia/Jakarta'})
            })
            
            SET st.previous_score = rh.weight,
                st.new_score = CASE WHEN calc_score <= 1.0 THEN calc_score ELSE 1.0 END,
                st.delta_score = CASE WHEN calc_score <= 1.0 THEN calc_score - rh.weight ELSE 1.0 - rh.weight END

            MERGE (s)-[:EARNED]->(st)
            MERGE (st)-[:AFFECTS]->(i)
            MERGE (st)-[:FROM_SOURCE]->(r)

            SET rh.weight = st.new_score
        }

        CALL (s) {
            MATCH (s)-[rh:HAS]->(:Indicator)<-[:HAS_INDICATOR]-(q:Quality)
            WITH s, q, avg(rh.weight) AS qual_avg_score
            MATCH (s)-[rlq:HAS]->(q)
            SET rlq.weight = qual_avg_score
        }
        CALL (s) {
            MATCH (s)-[rlq:HAS]->(q:Quality)<-[sq:HAS_QUALITY]-(sc:SubCpl)
            WITH s, sc,
                 sum(rlq.weight * sq.weight) AS weighted_score_sum,
                 sum(sq.weight) AS total_weight
            WITH s, sc, weighted_score_sum / total_weight AS subcpl_avg_score
            MATCH (s)-[rls:HAS]->(sc)
            SET rls.weight = subcpl_avg_score
        }

        CALL (s) {
            MATCH (s)-[rls:HAS]->(sc:SubCpl)<-[:HAS_SUB_CPL]-(c:Cpl)
            WITH s, c, avg(rls.weight) AS cpl_avg_score
            MATCH (s)-[rlc:HAS]->(c)
            SET rlc.weight = cpl_avg_score
        }
    """
    
    params = {
        "resource_id": resource_id,
        "nrps": nrps
    }
    
    await Neo4jConnection.query(query, params)
    
    
async def delete_student_score(resource_id: str, nrp: str | None = None):
    query = """
        MATCH (r:UniResource {resource_id: $resource_id})
        MATCH (s:Student)
        WHERE ($nrp IS NOT NULL AND s.nrp = $nrp) 
        OR ($nrp IS NULL AND EXISTS { (s)-[:EARNED]->(:ScoreTransaction)-[:FROM_SOURCE]->(r) })
        
        CALL (s, r) {
            MATCH (r)-[:SUPPORTS]->(i:Indicator)
            MATCH (s)-[re:EARNED]->(st:ScoreTransaction)-[:AFFECTS]->(i)
            MATCH (st)-[:FROM_SOURCE]->(r)
            MATCH (s)-[rh:HAS]->(i)
            SET rh.weight = CASE 
                WHEN rh.weight - st.delta_score < 0.0 THEN 0.0 
                ELSE rh.weight - st.delta_score 
            END
            DETACH DELETE st
        }

        CALL (s) {
            MATCH (s)-[rh:HAS]->(:Indicator)<-[:HAS_INDICATOR]-(q:Quality)
            WITH s, q, avg(rh.weight) AS qual_avg_score
            MATCH (s)-[rlq:HAS]->(q)
            SET rlq.weight = qual_avg_score
        }
        CALL (s) {
            MATCH (s)-[rlq:HAS]->(q:Quality)<-[sq:HAS_QUALITY]-(sc:SubCpl)
            WITH s, sc,
                 sum(rlq.weight * sq.weight) AS weighted_score_sum,
                 sum(sq.weight) AS total_weight
            WITH s, sc, weighted_score_sum / total_weight AS subcpl_avg_score
            MATCH (s)-[rls:HAS]->(sc)
            SET rls.weight = subcpl_avg_score
        }

        CALL (s) {
            MATCH (s)-[rls:HAS]->(sc:SubCpl)<-[:HAS_SUB_CPL]-(c:Cpl)
            WITH s, c, avg(rls.weight) AS cpl_avg_score
            MATCH (s)-[rlc:HAS]->(c)
            SET rlc.weight = cpl_avg_score
        }
    """
    
    params = {
        "resource_id": resource_id,
        "nrp": nrp
    }
    
    await Neo4jConnection.query(query, params)
    
async def check_missing_nrps(nrps: list[str]) -> list[str]:
    query = """
        UNWIND $nrps AS nrp
        OPTIONAL MATCH (s:Student {nrp: nrp})
        WITH nrp, s
        WHERE s IS NULL
        RETURN nrp AS missing_nrp
    """
    result = await Neo4jConnection.query(query, {"nrps": nrps})
    if not result:
        return []
        
    return [row["missing_nrp"] for row in result]


async def record_all_students_history():
    query = """
    MATCH (s:Student)
    CALL (s) {
        WITH datetime({timezone: 'Asia/Jakarta'}) AS now, s
        MERGE (s)-[:LOGGED_SCORE]->(ch:CplHistory {year: now.year, month: now.month})
        ON CREATE SET 
            ch.id = randomUUID(), 
            ch.datetime = now
        WITH s, ch
        MATCH (s)-[rh:HAS]->(curriculum_node)
        WHERE curriculum_node:Cpl 
           OR curriculum_node:SubCpl 
           OR curriculum_node:Quality 
           OR curriculum_node:Indicator
        MERGE (ch)-[history_rel:HAS]->(curriculum_node)
        SET history_rel.weight = rh.weight
        
    } IN TRANSACTIONS OF 100 ROWS
    RETURN "Snapshot complete" AS status
    """
    await Neo4jConnection.query(query)
    
async def recalculate_all_student_scores():
    query = """
    MATCH (s:Student)

    OPTIONAL MATCH (s)-[ra:ANSWERED]->(:Question)<-[:HAS_QUESTION]-(i:Indicator)
    WITH s, i, (avg(ra.valid_score)-1.0)/9.0 AS ind_avg_score
    WHERE i IS NOT NULL
    MERGE (s)-[rli:HAS]->(i)
    SET rli.weight = ind_avg_score

    WITH s
    MATCH (s)-[rli:HAS]->(i:Indicator)<-[:HAS_INDICATOR]-(q:Quality)
    WITH s, q, avg(rli.weight) AS qual_avg_score
    MERGE (s)-[rlq:HAS]->(q)
    SET rlq.weight = qual_avg_score

    WITH s
    MATCH (s)-[rlq:HAS]->(q:Quality)<-[sq:HAS_QUALITY]-(sc:SubCpl)
    WITH s, sc,
         sum(rlq.weight * sq.weight) AS weighted_score_sum,
         sum(sq.weight) AS total_weight
    WITH s, sc, weighted_score_sum / total_weight AS subcpl_avg_score
    MERGE (s)-[rls:HAS]->(sc)
    SET rls.weight = subcpl_avg_score

    WITH s
    MATCH (s)-[rls:HAS]->(sc:SubCpl)<-[:HAS_SUB_CPL]-(c:Cpl)
    WITH s, c, avg(rls.weight) AS cpl_avg_score
    MERGE (s)-[rlc:HAS]->(c)
    SET rlc.weight = cpl_avg_score
    """
    await Neo4jConnection.query(query)


async def get_attended_students(resource_id: str):
    query = """
    MATCH (r:UniResource {resource_id: $resource_id})<-[:ATTENDED]-(s:Student)
    MATCH (s)-[]->(m:Major)
    RETURN s.nrp as nrp, s.full_name as full_name, m.name as major
    """
    
    result = await Neo4jConnection.query(query, {"resource_id": resource_id})
    return result