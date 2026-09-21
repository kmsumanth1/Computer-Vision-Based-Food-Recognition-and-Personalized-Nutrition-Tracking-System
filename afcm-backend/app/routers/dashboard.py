import datetime as dt

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import client_today, date_or_today, get_current_profile, get_current_user
from app.db.session import get_db
from app.models.user import Profile, User
from app.schemas.nutrition import DashboardData, HistoryRange, HistoryResponse
from app.services import meal_service, tracking_service
from app.services.nutrition_plan import compute_plan


router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardData)
def dashboard(
    day: dt.date = Depends(date_or_today),
    user: User = Depends(get_current_user),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
):
    plan = compute_plan(profile)
    view = meal_service.day_view(db, user.id, day)
    return DashboardData(
        date=view.date,
        plan=plan,
        totals=view.totals,
        water=tracking_service.water_summary(db, user.id, day, plan),
        entries=view.entries,
    )


@router.get("/history", response_model=HistoryResponse)
def history(
    range: HistoryRange = "last_7_days",
    today: dt.date = Depends(client_today),
    user: User = Depends(get_current_user),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
):
    return tracking_service.build_history(db, user.id, range, today, compute_plan(profile))
