from fastapi import APIRouter, Request, Depends
from starlette.responses import RedirectResponse
from backend.auth.oauth import oauth
from backend.auth.jwt import create_access_token
from backend.auth.dependencies import get_current_user
from backend.students import services as student_services
from backend.admins import services as admin_services
from backend.admins import schemas as admin_schemas
import os

auth_router = APIRouter(tags=["auth"])


@auth_router.get("/student/login")
async def student_login(request: Request):
    request.session['login_intent'] = 'student'
    redirect_uri = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@auth_router.get("/admin/login")
async def admin_login(request: Request):
    request.session['login_intent'] = 'admin'
    redirect_uri = request.url_for('auth')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@auth_router.get("/auth")
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
            await student_services.create_student(nrp, email, name)

            jwt_payload = {"sub": nrp, "role": "student", "email": email, "name": name}
            token = create_access_token(jwt_payload)
            redirect_url = f'http://localhost:5173?token={token}'

        elif intent == 'admin':
            admin_id = await admin_services.get_id_from_email(email)
            admin_exists = admin_id is not None

            if admin_exists:
                is_approved = (await admin_services.read_admin_details(admin_id))["approved"]
                if not is_approved:
                    return RedirectResponse(url='http://localhost:5173/login?error=pending_approval')
            else:
                admin_details = await admin_services.create_admin(admin_schemas.AdminCreateInput(email=email, name=name))
                admin_id = admin_details['admin_id']
                is_root_admin = email == os.getenv("ROOT_ADMIN_EMAIL")

                if is_root_admin:
                    await admin_services.approve_admin(admin_id)
                else:
                    return RedirectResponse(url='http://localhost:5173/login?error=pending_approval')

            jwt_payload = {"sub": str(admin_id), "role": "admin", "email": email, "name": name}
            token = create_access_token(jwt_payload)
            redirect_url = f'http://localhost:5173/admin?token={token}'

        return RedirectResponse(url=redirect_url)

    except Exception as e:
        return {"error": str(e)}


@auth_router.get("/users/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "authenticated": True,
        "user_id": current_user.get("sub"),
        "role": current_user.get("role"),
        "email": current_user.get("email"),
        "name": current_user.get("name")
    }