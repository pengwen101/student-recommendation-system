from backend.database import Neo4jConnection
from backend.events.schemas import EventDetailsResponse, AllEventsResponse, EventDetailsInput

async def event_exists(event_id: str):
    query = """
    MATCH (e: Event {event_id: $event_id})
    RETURN count(e) > 0 as exists
    """
    params = {"event_id": event_id}
    response = await Neo4jConnection.query(query, params)
    return response[0]['exists'] if response else False

async def read_events():
    query = """
    MATCH (e:Event)
    RETURN e.event_id as event_id, 
           e.name,
           [(e)-[rs:SUPPORTS]->(q:Quality) | {
                quality_id: q.quality_id,
                name: q.name, 
                weight: toFloat(rs.weight)
           }] as qualities,
           [(e)-[rc:COVERS]->(t:Topic) | {
                topic_id: t.topic_id, 
                name: t.name, 
                weight: toFloat(rc.weight)
           }] as topics
    """
    response = await Neo4jConnection.query(query)
    return response


async def read_event_details(event_id: str):
    query = """
    MATCH (e:Event {event_id: $event_id})
    RETURN e.event_id as event_id, 
           e.name,
           [(e)-[rs:SUPPORTS]->(q:Quality) | {
                quality_id: q.quality_id,
                name: q.name, 
                weight: toFloat(rs.weight)
           }] as qualities,
           [(e)-[rc:COVERS]->(t:Topic) | {
                topic_id: t.topic_id, 
                name: t.name, 
                weight: toFloat(rc.weight)
           }] as topics
    """
    params = {"event_id": event_id}
    response = await Neo4jConnection.query(query, params)
    return response[0] if response else None

async def create_event(event_id: str, data: dict):
    query = """
    MERGE (e:Event {event_id: $event_id})
    SET e.name = $name
    WITH e
    UNWIND $topics as topic
    MATCH (t:Topic {topic_id: topic.topic_id})
    MERGE (e)-[rc:COVERS]->(t)
    SET rc.weight = topic.weight
    WITH e
    UNWIND $qualities as quality
    MATCH (q:Quality {quality_id: quality.quality_id})
    MERGE (e)-[rs:SUPPORTS]->(q)
    SET rs.weight = quality.weight
    """
    
    params = {"event_id": event_id, "name": data['name'], "topics": data['topics'], "qualities": data['qualities']}
    await Neo4jConnection.query(query, params)

async def update_event(event_id: str, data: dict):
    
    query = """
    MATCH (e:Event {event_id: $event_id})
    SET e.name = $name
    WITH e
    OPTIONAL MATCH (e)-[old_rc:COVERS]->(:Topic)
    DELETE old_rc
    WITH e
    OPTIONAL MATCH (e)-[old_rs:SUPPORTS]->(:Quality)
    DELETE old_rs
    WITH e
    UNWIND $topics as topic
    MATCH (t:Topic {topic_id: topic.topic_id})
    MERGE (e)-[rc:COVERS]->(t)
    SET rc.weight = topic.weight
    WITH e
    UNWIND $qualities as quality
    MATCH (q:Quality {quality_id: quality.quality_id})
    MERGE (e)-[rs:SUPPORTS]->(q)
    SET rs.weight = quality.weight
    """
    
    params = {"event_id": event_id, "name": data['name'], "topics": data['topics'], "qualities": data['qualities']}
    await Neo4jConnection.query(query, params)