"""Water, body weight and the History view."""
import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.meal import MealEntry
from app.models.tracking import WaterLog, WeightLog
from app.schemas.nutrition import HistoryDay, HistoryRange, HistoryResponse, NutritionPlan, WaterSummary


def water_total(db: Session, user_id: str, day: dt.date) -> int:
    total = db.scalar(select(func.coalesce(func.sum(WaterLog.amount_ml), 0)).where(WaterLog.user_id == user_id, WaterLog.date == day))
    return int(total or 0)


def water_summary(db: Session, user_id: str, day: dt.date, plan: NutritionPlan) -> WaterSummary:
    return WaterSummary(date=day.isoformat(), consumed_ml=water_total(db, user_id, day), target_ml=plan.water_target_ml)


def add_water(db: Session, user_id: str, day: dt.date, amount_ml: int) -> None:
    db.add(WaterLog(user_id=user_id, date=day, amount_ml=amount_ml))
    db.commit()


def record_weight(db: Session, user_id: str, day: dt.date, weight_kg: float) -> None:
    """Upserts the body weight for a day. Does not commit."""
    row = db.scalar(select(WeightLog).where(WeightLog.user_id == user_id, WeightLog.date == day))
    if row:
        row.weight_kg = weight_kg
    else:
        db.add(WeightLog(user_id=user_id, date=day, weight_kg=weight_kg))


def range_dates(range_: HistoryRange, today: dt.date) -> list[dt.date]:
    if range_ == "today":
        return [today]
    if range_ == "yesterday":
        return [today - dt.timedelta(days=1)]
    count = 7 if range_ == "last_7_days" else 30
    return [today - dt.timedelta(days=i) for i in range(count - 1, -1, -1)]


def build_history(db: Session, user_id: str, range_: HistoryRange, today: dt.date, plan: NutritionPlan) -> HistoryResponse:
    dates = range_dates(range_, today)
    first, last = dates[0], dates[-1]

    meals = {
        row.date: row
        for row in db.execute(
            select(
                MealEntry.date,
                func.sum(MealEntry.calories).label("calories"),
                func.sum(MealEntry.protein_g).label("protein_g"),
                func.sum(MealEntry.carbs_g).label("carbs_g"),
                func.sum(MealEntry.fat_g).label("fat_g"),
            )
            .where(MealEntry.user_id == user_id, MealEntry.date.between(first, last))
            .group_by(MealEntry.date)
        )
    }
    water = dict(
        db.execute(
            select(WaterLog.date, func.sum(WaterLog.amount_ml))
            .where(WaterLog.user_id == user_id, WaterLog.date.between(first, last))
            .group_by(WaterLog.date)
        ).all()
    )
    weights = dict(
        db.execute(select(WeightLog.date, WeightLog.weight_kg).where(WeightLog.user_id == user_id, WeightLog.date.between(first, last))).all()
    )

    days: list[HistoryDay] = []
    for day in dates:
        m = meals.get(day)
        days.append(
            HistoryDay(
                date=day.isoformat(),
                calories=int(round(m.calories)) if m else 0,
                protein_g=round(m.protein_g, 1) if m else 0.0,
                carbs_g=round(m.carbs_g, 1) if m else 0.0,
                fat_g=round(m.fat_g, 1) if m else 0.0,
                water_ml=int(water.get(day, 0) or 0),
                weight_kg=weights.get(day),
            )
        )
    return HistoryResponse(range=range_, days=days, calorie_target=plan.daily_calories, water_target_ml=plan.water_target_ml)
