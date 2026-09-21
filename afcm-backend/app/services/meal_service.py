import datetime as dt

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError, not_found
from app.models.meal import MealEntry
from app.schemas.food import Nutrition, OtherNutrient
from app.schemas.meal import CreateMealRequest, DailyTotals, MealEntryOut, MealsResponse, UpdateMealRequest
from app.services import food_service


def parse_date(value: str) -> dt.date:
    try:
        return dt.date.fromisoformat(value)
    except ValueError:
        raise AppError(422, "VALIDATION_ERROR", "Date must be YYYY-MM-DD.") from None


def _parse_time(value: str) -> dt.time:
    hours, minutes = value.split(":")
    return dt.time(int(hours), int(minutes))


def _apply_nutrition(entry: MealEntry, nutrition: Nutrition) -> None:
    entry.calories = nutrition.calories
    entry.protein_g = nutrition.protein_g
    entry.carbs_g = nutrition.carbs_g
    entry.fat_g = nutrition.fat_g
    entry.fiber_g = nutrition.fiber_g
    entry.other_nutrients = [n.model_dump() for n in nutrition.other_nutrients]


def to_out(entry: MealEntry) -> MealEntryOut:
    return MealEntryOut(
        id=entry.id,
        meal_type=entry.meal_type,  # type: ignore[arg-type]
        food_id=entry.food_id,
        food_name=entry.food_name,
        quantity=entry.quantity,
        weight_g=entry.weight_g,
        nutrition=Nutrition(
            calories=int(round(entry.calories)),
            protein_g=entry.protein_g,
            carbs_g=entry.carbs_g,
            fat_g=entry.fat_g,
            fiber_g=entry.fiber_g,
            other_nutrients=[OtherNutrient(**n) for n in (entry.other_nutrients or [])],
        ),
        date=entry.date.isoformat(),
        time=entry.time.strftime("%H:%M"),
        source=entry.source,  # type: ignore[arg-type]
    )


def list_entries(db: Session, user_id: str, day: dt.date) -> list[MealEntry]:
    return list(
        db.scalars(
            select(MealEntry).where(MealEntry.user_id == user_id, MealEntry.date == day).order_by(MealEntry.time, MealEntry.created_at)
        )
    )


def totals_for(entries: list[MealEntry]) -> DailyTotals:
    return DailyTotals(
        calories=int(round(sum(e.calories for e in entries))),
        protein_g=round(sum(e.protein_g for e in entries), 1),
        carbs_g=round(sum(e.carbs_g for e in entries), 1),
        fat_g=round(sum(e.fat_g for e in entries), 1),
    )


def day_view(db: Session, user_id: str, day: dt.date) -> MealsResponse:
    entries = list_entries(db, user_id, day)
    return MealsResponse(date=day.isoformat(), totals=totals_for(entries), entries=[to_out(e) for e in entries])


def _validate_quantity(quantity: float) -> float:
    if not (quantity > 0) or quantity > 100:
        raise AppError(422, "VALIDATION_ERROR", "Quantity must be between 0.1 and 100.")
    return quantity


def create_entry(db: Session, user_id: str, req: CreateMealRequest) -> MealEntry:
    weight = food_service.validate_weight(req.weight_g)
    quantity = _validate_quantity(req.quantity)
    day = parse_date(req.date)
    food = food_service.require_food(db, food_id=req.food_id)

    entry = MealEntry(
        user_id=user_id,
        date=day,
        time=_parse_time(req.time),
        meal_type=req.meal_type,
        food_id=food.id,
        food_name=food.name,
        quantity=quantity,
        weight_g=weight,
        source=req.source,
    )
    _apply_nutrition(entry, food_service.nutrition_for(food, weight))
    db.add(entry)
    db.commit()
    return entry


def get_entry(db: Session, user_id: str, entry_id: str) -> MealEntry:
    entry = db.scalar(select(MealEntry).where(MealEntry.id == entry_id, MealEntry.user_id == user_id))
    if entry is None:
        raise not_found("Meal entry not found.")
    return entry


def update_entry(db: Session, user_id: str, entry_id: str, req: UpdateMealRequest) -> MealEntry:
    entry = get_entry(db, user_id, entry_id)

    if req.weight_g is not None:
        weight = food_service.validate_weight(req.weight_g)
        food = food_service.require_food(db, food_id=entry.food_id)
        entry.weight_g = weight
        _apply_nutrition(entry, food_service.nutrition_for(food, weight))
    if req.quantity is not None:
        entry.quantity = _validate_quantity(req.quantity)
    if req.meal_type is not None:
        entry.meal_type = req.meal_type
    if req.time is not None:
        entry.time = _parse_time(req.time)

    db.commit()
    return entry


def delete_entry(db: Session, user_id: str, entry_id: str) -> None:
    entry = get_entry(db, user_id, entry_id)
    db.delete(entry)
    db.commit()
