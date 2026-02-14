from fastapi import FastAPI
from backend.students import routers

# Create FastAPI app instance
app = FastAPI()

app.include_router(routers.topics_router)
app.include_router(routers.recommendations_router)