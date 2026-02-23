from fastapi import FastAPI, Request
from backend.students import routers as student_routers
from backend.events import routers as event_routers
from backend.qualities import routers as quality_routers
from backend.topics import routers as topic_routers
from contextlib import asynccontextmanager
from backend.database import Neo4jConnection
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
import os
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Neo4jConnection.get_driver()
    yield
    await Neo4jConnection.close_driver()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY"))

oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@app.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth")
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        user = token.get('userinfo')
        request.session['user'] = user
        return RedirectResponse(url='http://localhost:5173')
    except Exception as e:
        return {"error": str(e)}

@app.get("/users/me")
async def get_current_user(request: Request):
    user = request.session.get('user')
    if user:
        return {"authenticated": True, "user": user}
    return {"authenticated": False}

@app.get("/logout")
async def logout(request: Request):
    request.session.pop('user', None)
    return {"message": "Logged out"}

app.include_router(student_routers.topics_router)
app.include_router(student_routers.recommendations_router)
app.include_router(student_routers.qualities_router)
app.include_router(event_routers.events_router)
app.include_router(quality_routers.qualities_router)
app.include_router(topic_routers.topics_router)