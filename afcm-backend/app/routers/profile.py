import datetime as dt

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import client_today, get_current_profile, get_current_user
from app.db.session import get_db
from app.models.user import Profile, User
from app.schemas.nutrition import NutritionPlan
from app.schemas.profile import ProfileResponse, ProfileUpdate, UserProfile
from app.services import profile_service
from app.services.nutrition_plan import compute_plan

router = APIRouter(tags=["profile"])


@router.post("/profile/setup", response_model=ProfileResponse)
def setup_profile(
    body: UserProfile,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    today: dt.date = Depends(client_today),
):
    profile = profile_service.setup_profile(db, user, body, today)
    # The plan is calculated by POST /nutrition/calculate, which the frontend calls next.
    return ProfileResponse(profile=profile_service.to_schema(profile), plan=None)


@router.get("/profile", response_model=ProfileResponse)
def get_profile(profile: Profile = Depends(get_current_profile)):
    return ProfileResponse(profile=profile_service.to_schema(profile), plan=compute_plan(profile))


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    today: dt.date = Depends(client_today),
):
    profile = profile_service.update_profile(db, user, body, today)
    # Targets are recalculated from the new values on every read.
    return ProfileResponse(profile=profile_service.to_schema(profile), plan=compute_plan(profile))


@router.post("/nutrition/calculate", response_model=NutritionPlan)
def calculate(profile: Profile = Depends(get_current_profile)):
    return compute_plan(profile)
