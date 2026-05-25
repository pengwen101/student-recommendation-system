from backend.database import Neo4jConnection

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
    
    
async def read_student_indicators(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[r:HAS]->(i:Indicator)
        RETURN i.indicator_id as indicator_id, i.code as code, i.name as name, r.weight as weight
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response

async def read_student_subcpls(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[r:HAS]->(sc:SubCpl)
        RETURN sc.sub_cpl_id as sub_cpl_id, sc.code as code, sc.name as name, 1.0 - r.weight as weight
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response

async def read_student_cpls(nrp: str):
    query = """
        MATCH (s:Student {nrp: $nrp})-[r:HAS]->(c:Cpl)
        RETURN c.cpl_id as cpl_id, c.code as code, c.name as name, 1.0 - r.weight as weight
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response
    
async def create_student_indicators(nrp: str, indicator_list: list):
    query = """
        MATCH (s:Student {nrp: $nrp})
        UNWIND $indicators as indicator
        MATCH (i:Indicator {indicator_id: indicator.indicator_id})
        MERGE (s)-[r:HAS]->(i)
        SET r.weight = indicator.weight
    """
    params = {"nrp": nrp, "indicators": indicator_list}
    await Neo4jConnection.query(query, params)

async def update_student_indicators(nrp: str, indicator_list: list):
    query = """
        MATCH (s:Student {nrp: $nrp})
        OPTIONAL MATCH (s)-[r:HAS]->(i:Indicator)
        DELETE r
        WITH s
        UNWIND $indicators as indicator
        MATCH (i:Indicator {indicator_id: indicator.indicator_id})
        MERGE (s)-[r:HAS]->(i)
        SET r.weight = indicator.weight
    """
    params = {"nrp": nrp, "indicators": indicator_list}
    await Neo4jConnection.query(query, params)
    
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
        MATCH (s:Student {nrp: $nrp})-[rl:HAS]->(i:Indicators)
        RETURN count(rl) > 0 as has_indicators
    """
    params = {"nrp": nrp}
    response = await Neo4jConnection.query(query, params)
    return response[0]['has_indicators'] if response else False

async def get_student_recommendations(nrp: str, label: str):
    query = f"""
        MATCH (s:Student {{nrp: $nrp}})
        OPTIONAL MATCH (s)-[rl:HAS]->(:Indicator)
        MATCH (st:Config:StudentTarget)
        WITH s, CASE 
        WHEN (st.target_score - rl.weight) > 0 THEN (st.target_score - rl.weight) 
        ELSE 0 
        END AS lack_weight
        WITH s, sum(coalesce(lack_weight, 0)) as total_lack_weight, lack_weight
        OPTIONAL MATCH (s)-[ri:INTERESTED_IN]->(:Topic)
        WITH s, total_lack_weight, count(ri) as total_interest_count, lack_weight

        MATCH (s)-[:CURRENTLY_IN]->(:StudyLevel)<-[:AVAILABLE_FOR]-(r:UniResource:{label})
        OPTIONAL MATCH (s)-[rl:HAS]->(i:Indicator)<-[rp:SUPPORTS]-(r)
        WITH s, r, total_lack_weight, total_interest_count, lack_weight,
            sum(
                CASE 
                    WHEN rl IS NULL OR rp IS NULL THEN 0.0
                    WHEN lack_weight < rp.weight
                    THEN lack_weight
                    ELSE rp.weight
                END
            ) as indicator_intersection

        OPTIONAL MATCH (s)-[ri:INTERESTED_IN]->(t:Topic)<-[rt:COVERS]-(r)
        WITH s, r, total_lack_weight, total_interest_count, indicator_intersection,
            sum(
                CASE 
                    WHEN ri IS NULL OR rt IS NULL THEN 0.0
                    ELSE 1.0
                END
            ) as topic_intersection
            
        MATCH (cf:Config:RecommendationWeight)

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
                resource_weight: toFloat(rh.weight)
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
                subcpls: [(r)-[rss:SUPPORTS]->(s:SubCpl) | {{
                    sub_cpl_id: s.sub_cpl_id,
                    code: s.code,
                    name: s.name, 
                    weight: toFloat(rss.weight)
                }}]
            }}
                }} AS resource,
                ((
                    cf.need_weight * (CASE WHEN total_lack_weight > 0 
                                THEN indicator_intersection / total_lack_weight 
                                ELSE 0.0 END) 
                ) + (
                    cf.interest_weight * (CASE WHEN total_interest_count > 0 
                                THEN topic_intersection / total_interest_count 
                                ELSE 0.0 END)
                )) * r.internal_weight AS score
                ORDER BY score DESC
                LIMIT 10
    """
    params = {"nrp": nrp, "type": type}
    response = await Neo4jConnection.query(query, params)
    return response