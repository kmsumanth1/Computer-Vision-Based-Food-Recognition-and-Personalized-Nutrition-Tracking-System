import datetime as dt

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.deps import date_or_today, get_current_profile, get_current_user
from app.db.session import get_db
from app.models.user import Profile, User
from app.schemas.meal import CreateMealRequest, MealEntryOut, MealsResponse, UpdateMealRequest
from app.services import meal_service

router = APIRouter(prefix="/meals", tags=["meals"])


@router.get("", response_model=MealsResponse)
def list_meals(
    day: dt.date = Depends(date_or_today),
    user: User = Depends(get_current_user),
    _profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db),
):
    return meal_service.day_view(db, user.id, day)


@router.post("", response_model=MealEntryOut, status_code=201)
def create_meal(body: CreateMealRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return meal_service.to_out(meal_service.create_entry(db, user.id, body))


@router.put("/{entry_id}", response_model=MealEntryOut)
def update_meal(entry_id: str, body: UpdateMealRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return meal_service.to_out(meal_service.update_entry(db, user.id, entry_id, body))


@router.delete("/{entry_id}", status_code=204)
def delete_meal(entry_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meal_service.delete_entry(db, user.id, entry_id)
    return Response(status_code=204)
