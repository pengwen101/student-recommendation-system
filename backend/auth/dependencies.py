from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.auth.jwt import decode_token

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    payload = decode_token(credentials.credentials)
    return payload


def require_admin():
    def role_checker(request: Request):
        user = getattr(request.state, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        role = user.get("role")
        if role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return user
    return role_checker


def require_student():
    def role_checker(request: Request):
        user = getattr(request.state, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        role = user.get("role")
        if role != "student":
            raise HTTPException(status_code=403, detail="Student access required")
        return user
    return role_checker


def require_any():
    def role_checker(request: Request):
        user = getattr(request.state, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        return user
    return role_checker
