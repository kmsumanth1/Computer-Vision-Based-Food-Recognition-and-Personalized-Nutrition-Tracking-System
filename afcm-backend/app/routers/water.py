import datetime as dt

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import client_today, date_or_today, get_current_profile, get_current_user
from app.db.session import get_db
from app.models.user import Profile, User
from app.schemas.nutrition import AddWaterRequest, WaterSummary
from app.services import tracking_service
from app.services.meal_service import parse_date
from app.services.nutrition_plan import compute_plan

router = APIRouter(prefix="/water", tags=["water"])


@router.get("", response_model=WaterSummary)
def get_water(
    day: dt.date = Depends(date_or_today),
    user: User = Depends(get_current_user),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
):
    return tracking_service.water_summary(db, user.id, day, compute_plan(profile))


@router.post("", response_model=WaterSummary)
def add_water(
    body: AddWaterRequest,
    today: dt.date = Depends(client_today),
    user: User = Depends(get_current_user),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
):
    day = parse_date(body.date) if body.date else today
    tracking_service.add_water(db, user.id, day, body.amount_ml)
    return tracking_service.water_summary(db, user.id, day, compute_plan(profile))
