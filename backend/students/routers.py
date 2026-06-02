from fastapi import APIRouter, status, UploadFile, File, HTTPException
from backend.students.schemas import (TopicActionResponse, StudentRecommendationsResponse,\
                                    IndicatorActionResponse, StudentIndicatorsInputBatch, StudentTopicsInputBatch, SubCplActionResponse, CplActionResponse, AttendedStudents, StudentQuestionRelation)
from backend.students import services
from typing import List
from backend.resources.schemas import ResourceType

topics_router = APIRouter(prefix="/student/topics", tags=["student_topics"])
recommendations_router = APIRouter(prefix="/student/recommendations", tags=["student_recommendations"])
indicators_router = APIRouter(prefix="/student/indicators", tags=["student_indicators"])
subcpls_router = APIRouter(prefix="/student/subcpls", tags=["student_subcpls"])
cpls_router = APIRouter(prefix="/student/cpls", tags=["student_cpls"])
attendance_router = APIRouter(prefix="/student/attendance", tags=["student_attendance"])
questions_router = APIRouter(prefix="/student/questions", tags=["student_questions"])

@topics_router.get("/{nrp}", response_model=TopicActionResponse)
async def read_student_topics(nrp: str):
    topics = await services.read_student_topics(nrp)
    return {"message": "Student topic relations successfully retrieved.", "count": len(topics), "topics": topics}

@topics_router.post("/{nrp}", response_model=TopicActionResponse)
async def create_student_topics(nrp: str, data: StudentTopicsInputBatch):
    topics = await services.create_student_topics(nrp, data.topics)
    return {"message": "Student topic relations successfully added.", "count": len(topics), "topics": topics}

@questions_router.post("/{nrp}")
async def create_student_question_relation(nrp: str, data: List[StudentQuestionRelation]):
    await services.create_student_question_relation(nrp, data)

@topics_router.put("/{nrp}", response_model=TopicActionResponse)
async def update_student_topics(nrp: str, data: StudentTopicsInputBatch):
    topics = await services.update_student_topics(nrp, data.topics)
    return {"message": "Student topic relations successfully updated.", "count": len(topics), "topics": topics}

@indicators_router.get("/{nrp}", response_model=IndicatorActionResponse)
async def read_student_indicators(nrp: str):
    indicators = await services.read_student_indicators(nrp)
    return {"message": "Student indicators relations successfully retrieved.", "count": len(indicators), "indicators": indicators}

@subcpls_router.get("/{nrp}", response_model=SubCplActionResponse)
async def read_student_subcpls(nrp: str):
    subcpls = await services.read_student_subcpls(nrp)
    return {"message": "Student subcpls relations successfully retrieved.", "count": len(subcpls), "subcpls": subcpls}

@cpls_router.get("/{nrp}", response_model=CplActionResponse)
async def read_student_cpls(nrp: str):
    cpls = await services.read_student_cpls(nrp)
    return {"message": "Student cpls relations successfully retrieved.", "count": len(cpls), "cpls": cpls}

@indicators_router.post("/{nrp}", response_model=IndicatorActionResponse)
async def create_student_indicators(nrp: str, data: StudentIndicatorsInputBatch):
    indicators = await services.create_student_indicators(nrp, data.indicators)
    return {"message": "Student indicators relations successfully added.", "count": len(indicators), "indicators": indicators}

@indicators_router.put("/{nrp}", response_model=IndicatorActionResponse)
async def update_student_indicators(nrp: str, data: StudentIndicatorsInputBatch):
    indicators = await services.update_student_indicators(nrp, data.indicators)
    return {"message": "Student indicators relations successfully updated.", "count": len(indicators), "indicators": indicators}

@topics_router.get("/has_topics/{nrp}", response_model=bool)
async def has_student_topics(nrp: str):
    return await services.has_topics(nrp)

@indicators_router.get("/has_indicators/{nrp}", response_model=bool)
async def has_student_indicators(nrp: str):
    return await services.has_indicators(nrp)

@recommendations_router.get("/{nrp}", response_model=StudentRecommendationsResponse)
async def get_student_recommendations(nrp: str, type: ResourceType):
    recommendations = await services.get_student_recommendations(nrp, type)
    return {"message": "Student recommendations successfully retrieved.", "count": len(recommendations), "recommendations": recommendations}

@attendance_router.post("/{resource_id}")
async def record_student_attendance(resource_id: str, file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Please upload an Excel (.xlsx or .xls) or CSV (.csv) file."
        )
    try:
        contents = await file.read()
        result = await services.record_student_attendance(resource_id, contents, file.filename)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
@attendance_router.get("/{resource_id}", response_model = List[AttendedStudents])
async def get_attended_students(resource_id: str):
    return await services.get_attended_students(resource_id)