from backend.database import Neo4jConnection
import time


VECTOR_PROPERTY = "embedding_LazarusNLP_all_indo_e5_small_v4"
VECTOR_INDEX_NAME = "resource_embedding_LazarusNLP_all_indo_e5_small_v4"
VECTOR_DIM = 384

update_cleanup_query = """
    OPTIONAL MATCH (r)-[old_rel:ORGANIZES|COVERS|SUPPORTS|HAS_SESSION|AVAILABLE_FOR|HAS]-()
    DELETE old_rel
"""

create_update_base_query = """
    CALL (r) {
        UNWIND $study_levels AS study_level
        MATCH (sl:StudyLevel {study_level_id: study_level.study_level_id})
        MERGE (r)-[:AVAILABLE_FOR]->(sl)
    }
    
    CALL (r) {
        UNWIND $organizers AS org
        MATCH (o:Organizer {organizer_id: org.organizer_id})
        MERGE (r)<-[og:ORGANIZES]-(o)
    }
    
    CALL (r) {
        UNWIND $sessions AS session
        MERGE (r)-[hs:HAS_SESSION]->(ss:Session {session_id: session.session_id})
        SET ss.start_datetime = datetime(session.start_datetime + '[Asia/Jakarta]'), ss.end_datetime = datetime(session.end_datetime + '[Asia/Jakarta]')
    }
    
    CALL (r) {
        UNWIND CASE WHEN $topics IS NULL THEN [] ELSE $topics END AS topic
        MATCH (t:Topic {topic_id: topic.topic_id})
        MERGE (r)-[rc:COVERS]->(t)
    }
    WITH r, coalesce($resource_assessments, []) AS assessments
    CALL (r, assessments) {
        // We UNWIND a list that is guaranteed to have at least one element (even if it's null).
        // This prevents the subquery from returning zero rows and accidentally filtering out 'r' entirely.
        UNWIND (CASE WHEN size(assessments) = 0 THEN [null] ELSE assessments END) AS item
        
        // Match the assessment node if the item exists
        OPTIONAL MATCH (ra:ResourceAssessment {resource_assessment_id: item.resource_assessment_id})
        
        // Use FOREACH as a safe conditional block to create the relationship
        FOREACH (_ IN CASE WHEN item IS NOT NULL AND ra IS NOT NULL THEN [1] ELSE [] END |
            MERGE (r)-[rh:HAS]->(ra)
            SET rh.weight = toFloat(item.resource_weight)
        )
        
        // Calculate and return the sum. If the list was empty, this sums to 0.0
        RETURN sum(
            CASE WHEN item IS NOT NULL AND ra IS NOT NULL 
            THEN toFloat(item.resource_weight) * toFloat(ra.weight) 
            ELSE 0.0 END
        ) AS calculated_weight
    }

    // Finally, apply the weight to the resource (defaulting to 1.0 if the math yielded 0.0)
    SET r.internal_weight = CASE WHEN calculated_weight = 0.0 THEN 1.0 ELSE calculated_weight END
"""


async def set_node_vector_property(resource_id: str, embedding: list):
    query = """
    MATCH (r:UniResource {resource_id: $resource_id})
    CALL db.create.setNodeVectorProperty(r, $property_name, $embedding)
    """
    await Neo4jConnection.query(query, {
        "resource_id": resource_id,
        "property_name": VECTOR_PROPERTY,
        "embedding": embedding
    })


async def ensure_vector_index():
    query = f"""
    CREATE VECTOR INDEX {VECTOR_INDEX_NAME} IF NOT EXISTS
    FOR (r:UniResource) ON (r.{VECTOR_PROPERTY})
    OPTIONS {{ indexConfig: {{ `vector.dimensions`: {VECTOR_DIM} }} }}
    """
    await Neo4jConnection.query(query)


async def get_resource_topic_names(resource_id: str):
    query = """
    MATCH (r:UniResource {resource_id: $resource_id})-[:COVERS]->(t:Topic)
    RETURN t.name AS name
    """
    result = await Neo4jConnection.query(query, {"resource_id": resource_id})
    return [row["name"] for row in result]


async def resource_exists(resource_id: str):
    query = """
    MATCH (r:UniResource {resource_id: $resource_id})
    RETURN count(r) > 0 as exists
    """
    params = {"resource_id": resource_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False
    
async def read_resources(label: str | None = None, resource_id: str | None = None):
    if not label:
        match_query = "MATCH (r:UniResource)"
    else:
        match_query = f"MATCH (r:UniResource:{label})"
        
    query = f"""{match_query}
    WHERE $resource_id IS NULL OR r.resource_id = $resource_id
    RETURN r.resource_id as resource_id, 
    tolower(head([l IN labels(r) WHERE l <> 'UniResource'])) AS type,
    r.title as title,
    r.is_active as is_active,
    r.description as description,
    r.content_link as content_link,
    r.text_hash as text_hash,
    r.article_text as article_text,
    r.isbn as isbn,
    r.authors as authors,
    CASE WHEN r.published_date IS NOT NULL THEN apoc.temporal.format(r.published_date, "yyyy-MM-dd") ELSE null END as published_date,
    r.publisher as publisher,
    r.status as status,
    r.internal_weight as internal_weight,
    [(r)-[:HAS_SESSION]->(ss:Session) | {{
        session_id: ss.session_id,
        start_datetime: apoc.temporal.format(ss.start_datetime, "yyyy-MM-dd'T'HH:mm:ss"),
        end_datetime: apoc.temporal.format(ss.end_datetime, "yyyy-MM-dd'T'HH:mm:ss")
    }}] as sessions,
    [(r)<-[og:ORGANIZES]-(o:Organizer) | {{
        organizer_id: o.organizer_id,
        name: o.name
    }}] as organizers,
    [(r)-[af:AVAILABLE_FOR]->(sl:StudyLevel) | {{
        study_level_id: sl.study_level_id
    }}] as study_levels,
    [(r)-[rh:HAS]->(ra:ResourceAssessment) | {{
        resource_assessment_id: ra.resource_assessment_id,
        display_name: ra.display_name,
        resource_type: ra.resource_type,
        weight: toFloat(ra.weight),
        resource_weight: toFloat(rh.weight)
    }}] AS resource_assessments,
    [(r)-[rsi:SUPPORTS]->(i:Indicator) | {{
        indicator_id: i.indicator_id
    }}] as indicators,
    [(r)-[rc:COVERS]->(t:Topic) | {{
        topic_id: t.topic_id, 
        code: t.code,
        name: t.name
    }}] as topics,
    {{
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
    }} AS calculations
    """
    response = await Neo4jConnection.query(query, {"resource_id": resource_id})
    if not response:
        return None if resource_id else []
    
    return response[0] if resource_id else response

async def create_resource(resource_id: str, label: str, data: dict, current_user: dict):
    query = f"""
    MERGE (r:UniResource:{label} {{resource_id: $resource_id}})
    SET r += $resource_properties
    SET r.published_date =  datetime($published_date + '[Asia/Jakarta]')
    WITH r
    OPTIONAL MATCH (a:Admin {{admin_id: $updater_actor_id}})
    OPTIONAL MATCH (o:Organizer {{organizer_id: $updater_actor_id}})
    WITH r, coalesce(a, o) AS actor
    MERGE (r)-[u:UPDATED_BY]->(actor)
    SET u.updated_at = datetime({{timezone: 'Asia/Jakarta'}})
    WITH r
    OPTIONAL MATCH (a:Admin {{admin_id: $creator_actor_id}})
    OPTIONAL MATCH (o:Organizer {{organizer_id: $creator_actor_id}})
    WITH r, coalesce(a, o) AS actor
    MERGE (r)-[u:CREATED_BY]->(actor)
    SET u.created_at = datetime({{timezone: 'Asia/Jakarta'}})
    WITH r
    {create_update_base_query}
    """
    resource_properties = {k: v for k, v in data.items() if k not in {"study_levels", "organizers", "sessions", "topics", "resource_assessments", "indicators", "published_date", VECTOR_PROPERTY}}
    
    
    params = {"resource_id": resource_id, 
              "resource_properties": resource_properties,
              "published_date": data.get("published_date"),
              "study_levels": data.get("study_levels"),
              "sessions": data.get('sessions'),
              "organizers": data.get('organizers'),
              "topics": data['topics'],
              "creator_actor_id": current_user['sub'],
              "updater_actor_id": current_user['sub'],
              "resource_assessments": data['resource_assessments']
              }
    
    await Neo4jConnection.query(query, params)
    await calculate_support_weights(resource_id, data['indicators'])
    
async def update_resource(resource_id: str, data: dict, current_user: dict):
    query = f"""
    MERGE (r:UniResource {{resource_id: $resource_id}})
    SET r += $resource_properties
    SET r.published_date =  datetime($published_date + '[Asia/Jakarta]')
    WITH r
    {update_cleanup_query}
    WITH DISTINCT r
    OPTIONAL MATCH (a:Admin {{admin_id: $updater_actor_id}})
    OPTIONAL MATCH (o:Organizer {{organizer_id: $updater_actor_id}})
    WITH r, coalesce(a, o) AS actor
    MERGE (r)-[u:UPDATED_BY]->(actor)
    SET u.updated_at = datetime({{timezone: 'Asia/Jakarta'}})
    WITH r
    {create_update_base_query}
    """
    resource_properties = {k: v for k, v in data.items() if k not in {"study_levels", "organizers", "sessions", "topics", "resource_assessments", "indicators", "published_date", VECTOR_PROPERTY}}
    params = {"resource_id": resource_id, 
              "resource_properties": resource_properties,
              "published_date": data.get("published_date"),
              "study_levels": data.get("study_levels"),
              "sessions": data.get('sessions'),
              "organizers": data.get('organizers'),
              "topics": data['topics'],
              "updater_actor_id": current_user['sub'],
              "resource_assessments": data['resource_assessments']
              }
    start_time = time.perf_counter()
    await Neo4jConnection.query(query, params)
    print(f"[TIME] Neo4j Connection Query took: {time.perf_counter() - start_time:.4f} seconds")
    await calculate_support_weights(resource_id, data['indicators'])
        
    
async def check_organizer_update_authorization(resource_id, organizer_id):
    query = """
    MATCH (o:Organizer {organizer_id: $organizer_id})-[:ORGANIZES]->(r:UniResource {resource_id: $resource_id})
    RETURN count(r) > 0 AS authorized
    """
    response = await Neo4jConnection.query(query, {"organizer_id": organizer_id, "resource_id": resource_id})
    return response[0]['authorized'] if response else False
    
async def activate_resource(resource_id: str):
    query = """
    MATCH (r:UniResource {resource_id: $resource_id})
    SET r.is_active = true
    """
    params = {"resource_id": resource_id}
    await Neo4jConnection.query(query, params)
    
async def archive_resource(resource_id: str):
    query = """
    MATCH (r:UniResource {resource_id: $resource_id})
    SET r.is_active = false
    """
    params = {"resource_id": resource_id}
    await Neo4jConnection.query(query, params)

async def delete_resource(resource_id: str):
    query = """
    MATCH (r:UniResource {resource_id: $resource_id})
    DETACH DELETE r
    """
    params = {"resource_id": resource_id}
    await Neo4jConnection.query(query, params)
    
async def calculate_support_weights(resource_id: str, indicators: list[dict]):
    query = """
    MATCH (r:UniResource {resource_id: $resource_id})
    MATCH (i:Indicator)
    WHERE i.indicator_id IN [ind IN $indicators | ind.indicator_id]
    
    MERGE (r)-[rsi:SUPPORTS]->(i)
    SET rsi.weight = 1.0
    
    WITH r, i
    MATCH (q:Quality)-[:HAS_INDICATOR]->(i)
    WITH r, q, count(i) AS resource_indicator_count
    WITH r, q, resource_indicator_count, COUNT { (q)-[:HAS_INDICATOR]->() } AS total_indicators
    
    MERGE (r)-[rsq:SUPPORTS]->(q)
    SET rsq.weight = toFloat(resource_indicator_count) / toFloat(total_indicators)
 
    WITH DISTINCT r
    MATCH (s:SubCpl)-[sq:HAS_QUALITY]->(q:Quality)<-[rsq:SUPPORTS]-(r)
    WITH r, s, sum(sq.weight * rsq.weight) AS resource_quality_weight
    
    MATCH (s)-[sq_all:HAS_QUALITY]->()
    WITH r, s, resource_quality_weight, sum(sq_all.weight) AS subcpl_quality_weight
    
    MERGE (r)-[rss:SUPPORTS]->(s)
    SET rss.weight = toFloat(resource_quality_weight) / toFloat(subcpl_quality_weight)
    
    WITH DISTINCT r
    MATCH (c:Cpl)-[:HAS_SUB_CPL]->(s:SubCpl)<-[rss:SUPPORTS]-(r)
    WITH r, c, sum(rss.weight) AS resource_subcpl_weight
    WITH r, c, resource_subcpl_weight, COUNT { (c)-[:HAS_SUB_CPL]->() } AS cpl_subcpl_count
    
    MERGE (r)-[rsc:SUPPORTS]->(c)
    SET rsc.weight = toFloat(resource_subcpl_weight) / toFloat(cpl_subcpl_count)
    """
   
    await Neo4jConnection.query(query, {"resource_id": resource_id, "indicators": indicators})
    
async def get_indicator_recommendation(query_embedding: list):
    query = """
    MATCH (r:UniResource)
    WHERE r.embedding_LazarusNLP_all_indo_e5_small_v4 IS NOT NULL
    WITH r, vector.similarity.cosine(r.embedding_LazarusNLP_all_indo_e5_small_v4, $query_embedding) AS similarity
    WHERE similarity >= 0.6
    ORDER BY similarity DESC
    LIMIT 1
    OPTIONAL MATCH (r)-[:SUPPORTS]->(suggested_indicator:Indicator)
    RETURN r.resource_id AS similar_resource_id,
           tolower(head([l IN labels(r) WHERE l <> 'UniResource'])) AS similar_resource_type,
           r.title AS similar_resource_title,
           collect(DISTINCT suggested_indicator.indicator_id) AS suggested_indicator_ids
    """
    result = await Neo4jConnection.query(query, {"query_embedding": query_embedding})
    return result[0] if result else None


async def get_resources_similarity(label, query_vector):
    query = f"""
    MATCH (r:UniResource:{label})
    WHERE r['embedding_LazarusNLP_all_indo_e5_small_v4'] IS NOT NULL
    WITH r, vector.similarity.cosine(r['embedding_LazarusNLP_all_indo_e5_small_v4'], $queryEmbedding) AS similarityScore
    RETURN r.resource_id AS resource_id,
        similarityScore AS similarity_score
    """
    return await Neo4jConnection.query(query, {"queryEmbedding": query_vector})