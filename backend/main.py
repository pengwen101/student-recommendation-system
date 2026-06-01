from fastapi import FastAPI, Request, Depends
from starlette.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from authlib.integrations.starlette_client import OAuth
import os
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from backend.dependencies import get_current_user, create_access_token
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
from backend.configs import routers as config_routers
from backend.admins import services as admin_services
from backend.admins import schemas as admin_schemas

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

oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@app.get("/student/login")
async def student_login(request: Request):
    request.session['login_intent'] = 'student'
    redirect_uri = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/admin/login")
async def admin_login(request: Request):
    request.session['login_intent'] = 'admin'
    redirect_uri = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth")
async def auth(request: Request):
    try:
        auth_token = await oauth.google.authorize_access_token(request)
        user = auth_token.get('userinfo')
        email = user.get('email')
        name = user.get('name')
        
        intent = request.session.pop('login_intent', 'student')
        
        jwt_payload = {}
        redirect_url = ""

        if intent == 'student':
            if not email.endswith("@john.petra.ac.id"):
                return RedirectResponse(url='http://localhost:5173/login?error=invalid_domain')
            
            nrp = email.split("@")[0]
            await Neo4jConnection.query("MERGE (s:Student {email: $email}) ON CREATE SET s.nrp = $nrp, s.name = $name", {
                "email": email,
                "nrp": nrp,
                "name": name
            })
  
            jwt_payload = {"sub": nrp, "role": "student", "email": email, "name": name}
            token = create_access_token(jwt_payload)
            redirect_url = f'http://localhost:5173?token={token}'

        elif intent == 'admin':
            admin_id = await admin_services.get_id_from_email(email)
            admin_exists = admin_id is not None
            
            if admin_exists:
                is_approved = (await admin_services.read_admin_details(admin_id))["approved"]
                role = "admin" if is_approved else "pending_admin"
            else:
                admin_details = await admin_services.create_admin(admin_schemas.AdminCreateInput(email=email, name=name))
                admin_id = admin_details['admin_id']
                is_root_admin = email == os.getenv("ROOT_ADMIN_EMAIL")
                
                if is_root_admin:
                    await admin_services.approve_admin(admin_id)
                    role = "admin"
                else:
                    role = "pending_admin"

            jwt_payload = {"sub": str(admin_id), "role": role, "email": email, "name": name}
            token = create_access_token(jwt_payload)
            
            if role == 'admin':
                redirect_url = f'http://localhost:5173/admin?token={token}'
            else:
                redirect_url = f'http://localhost:5173/admin/login?error=pending_approval'

        return RedirectResponse(url=redirect_url)

    except Exception as e:
        return {"error": str(e)}

@app.get("/users/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    This endpoint now requires a valid JWT in the Authorization header.
    React must send: Headers: { Authorization: "Bearer <token>" }
    """
    return {
        "authenticated": True,
        "user_id": current_user.get("sub"),
        "role": current_user.get("role"),
        "email": current_user.get("email"),
        "name": current_user.get("name")
    }

@app.get("/logout")
async def logout(request: Request):
    request.session.pop('user', None)
    return {"message": "Logged out"}

app.include_router(student_routers.topics_router)
app.include_router(student_routers.recommendations_router)
app.include_router(student_routers.indicators_router)
app.include_router(student_routers.subcpls_router)
app.include_router(student_routers.cpls_router)
app.include_router(student_routers.attendance_router)
app.include_router(resource_routers.resources_router)
app.include_router(quality_routers.qualities_router)
app.include_router(topic_routers.topics_router)
app.include_router(subcpl_routers.subcpls_router)
app.include_router(admin_routers.admins_router)
app.include_router(organizer_routers.organizers_router)
app.include_router(curriculum_routers.curriculums_router)
app.include_router(curriculum_routers.curriculum_versions_router)
app.include_router(analytic_routers.analytic_router)
app.include_router(demography_routers.demography_router)
app.include_router(config_routers.configs_router)