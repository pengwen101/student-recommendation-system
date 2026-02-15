from fastapi import FastAPI
from backend.students import routers as student_routers
from backend.events import routers as event_routers
from contextlib import asynccontextmanager
from backend.database import Neo4jConnection

@asynccontextmanager
async def lifespan(app: FastAPI):
    Neo4jConnection.get_driver()
    yield
    await Neo4jConnection.close_driver()

app = FastAPI(lifespan=lifespan)

app.include_router(student_routers.topics_router)
app.include_router(student_routers.recommendations_router)
app.include_router(student_routers.qualities_router)
app.include_router(event_routers.events_router)