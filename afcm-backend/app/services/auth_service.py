from datetime import timedelta
from urllib.parse import quote

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    hash_password,
    hash_reset_token,
    needs_rehash,
    new_reset_token,
    verify_password,
)
from app.models.user import PasswordResetToken, User, utcnow
from app.schemas.auth import AuthResponse, AuthUser
from app.services.email_service import send_email

RESET_MESSAGE = "Password reset instructions have been sent to your email."


def to_auth_user(user: User) -> AuthUser:
    return AuthUser(id=user.id, name=user.name, email=user.email, profile_completed=user.profile is not None)


def make_session(user: User) -> AuthResponse:
    return AuthResponse(access_token=create_access_token(user.id), user=to_auth_user(user))


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.strip().lower()))


def register(db: Session, name: str, email: str, password: str) -> AuthResponse:
    email = email.strip().lower()
    if get_user_by_email(db, email):
        raise AppError(409, "EMAIL_EXISTS", "An account with this email already exists.")
    user = User(name=name, email=email, password_hash=hash_password(password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # two sign-ups at the same moment
        db.rollback()
        raise AppError(409, "EMAIL_EXISTS", "An account with this email already exists.") from None
    return make_session(user)


def login(db: Session, email: str, password: str) -> AuthResponse:
    user = get_user_by_email(db, email)
    if not verify_password(password, user.password_hash if user else None):
        raise AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.")
    assert user is not None
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
        db.commit()
    return make_session(user)


def request_password_reset(db: Session, email: str) -> None:
    """Always succeeds from the caller's point of view, so it can't be used to find out who has an account."""
    user = get_user_by_email(db, email)
    if user is None:
        return
    settings = get_settings()
    token, token_hash = new_reset_token()
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=utcnow() + timedelta(minutes=settings.reset_token_expire_minutes),
        )
    )
    db.commit()

    link = f"{settings.frontend_url.rstrip('/')}/reset-password?token={quote(token)}"
    send_email(
        to=user.email,
        subject="Reset your AI Food Calories Meter password",
        body=(
            f"Hi {user.name},\n\n"
            f"Use this link to choose a new password. It works for {settings.reset_token_expire_minutes} minutes:\n\n"
            f"{link}\n\n"
            "If you didn't ask for this, you can ignore this email."
        ),
    )


def reset_password(db: Session, token: str, new_password: str) -> None:
    row = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == hash_reset_token(token)))
    if row is None or row.used_at is not None or row.expires_at < utcnow():
        raise AppError(400, "INVALID_RESET_TOKEN", "This reset link is invalid or has expired. Request a new one.")
    user = db.get(User, row.user_id)
    if user is None:
        raise AppError(400, "INVALID_RESET_TOKEN", "This reset link is invalid or has expired. Request a new one.")
    user.password_hash = hash_password(new_password)
    row.used_at = utcnow()
    db.commit()
