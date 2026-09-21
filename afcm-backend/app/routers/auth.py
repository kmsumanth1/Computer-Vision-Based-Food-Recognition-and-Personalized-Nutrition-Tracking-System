from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.rate_limit import enforce, forgot_limiter, login_limiter
from app.db.session import get_db
from app.schemas.auth import AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest
from app.schemas.common import MessageResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register(db, body.name, body.email, body.password)


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    enforce(login_limiter, request, body.email)
    return auth_service.login(db, body.email, body.password)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    enforce(forgot_limiter, request, body.email)
    auth_service.request_password_reset(db, body.email)
    return MessageResponse(message=auth_service.RESET_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    auth_service.reset_password(db, body.token, body.password)
    return MessageResponse(message="Your password has been changed. You can log in now.")
