from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from backend.auth.middleware import AuthMiddleware
from backend.auth.routers import auth_router
from backend.students.cypher import record_all_students_history

from backend.database import Neo4jConnection
from backend.students import routers as student_routers
from backend.resources import routers as resource_routers
from backend.qualities import routers as quality_routers
from backend.topics import routers as topic_routers
from backend.subcpls import routers as subcpl_routers
from backend.curriculums import routers as curriculum_routers
from backend.demography import routers as demography_routers
from backend.analytics import routers as analytic_routers
from backend.admins import routers as admin_routers
from backend.organizers import routers as organizer_routers
from backend.questions import routers as question_routers
from backend.cpls import routers as cpl_routers
from backend.configs import routers as config_routers
from backend.indicators import routers as indicator_routers
from backend import states

load_dotenv()
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Neo4jConnection.get_driver()
    
    scheduler.add_job(
        record_all_students_history,
        CronTrigger(day=1, hour=0, minute=1, timezone='Asia/Jakarta'),
        id="monthly_history_snapshot",
        replace_existing=True
    )
    scheduler.start()
    print("Monthly snapshot scheduler started.")
    states.load_state()
    yield
    await Neo4jConnection.close_driver()
    
    scheduler.shutdown()
    print("Scheduler shut down.")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY"))
app.add_middleware(AuthMiddleware)

app.include_router(auth_router)
app.include_router(student_routers.topics_router)
app.include_router(student_routers.recommendations_router)
app.include_router(student_routers.indicators_router)
app.include_router(student_routers.subcpls_router)
app.include_router(student_routers.cpls_router)
app.include_router(student_routers.questions_router)
app.include_router(student_routers.attendance_router)
app.include_router(resource_routers.resources_router)
app.include_router(resource_routers.recommendation_configs_router)
app.include_router(quality_routers.qualities_router)
app.include_router(topic_routers.topics_router)
app.include_router(subcpl_routers.subcpls_router)
app.include_router(admin_routers.admins_router)
app.include_router(organizer_routers.organizers_router)
app.include_router(question_routers.questions_update_router)
app.include_router(cpl_routers.cpls_router)
app.include_router(indicator_routers.indicators_router)
app.include_router(curriculum_routers.curriculums_router)
app.include_router(curriculum_routers.curriculums_q_router)
app.include_router(curriculum_routers.curriculum_versions_router)
app.include_router(analytic_routers.analytic_router)
app.include_router(demography_routers.demography_router)
app.include_router(config_routers.configs_router)