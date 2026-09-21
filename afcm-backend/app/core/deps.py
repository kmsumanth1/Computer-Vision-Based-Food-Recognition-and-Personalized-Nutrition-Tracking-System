import datetime as dt
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import Depends, Header, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import Profile, User
from app.services import profile_service
from app.services.meal_service import parse_date

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = AppError(401, "UNAUTHORIZED", "Please log in again.")
    if credentials is None:
        raise unauthorized
    user_id = decode_access_token(credentials.credentials)
    user = db.get(User, user_id) if user_id else None
    if user is None:
        raise unauthorized
    return user


def get_current_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Profile:
    return profile_service.get_profile(db, user)


def _zone(name: str | None) -> dt.tzinfo:
    """
    The user's timezone, else APP_TIMEZONE, else UTC.

    Windows (and some slim Docker images) ship no timezone database, so ZoneInfo() fails until the `tzdata`
    package is installed. This never raises: worst case the date is computed in UTC.
    """
    for candidate in (name, get_settings().app_timezone):
        if not candidate:
            continue
        try:
            return ZoneInfo(candidate)
        except (ZoneInfoNotFoundError, ValueError, OSError):
            continue
    return dt.timezone.utc


def client_today(x_timezone: str | None = Header(default=None)) -> dt.date:
    """Today's date where the user is. The frontend sends its IANA timezone in X-Timezone."""
    return dt.datetime.now(_zone(x_timezone)).date()


def date_or_today(
    date: str | None = Query(default=None, description="YYYY-MM-DD. Defaults to today."),
    today: dt.date = Depends(client_today),
) -> dt.date:
    return parse_date(date) if date else today