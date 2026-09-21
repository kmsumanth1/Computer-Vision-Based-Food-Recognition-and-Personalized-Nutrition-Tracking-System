from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.meal import DailyTotals, MealEntryOut

FitnessGoal = Literal["cut", "bulk", "maintain"]
HistoryRange = Literal["today", "yesterday", "last_7_days", "last_30_days"]


class CalorieTargets(BaseModel):
    cut: int
    maintain: int
    bulk: int


class MacroTargets(BaseModel):
    protein_g: int
    carbs_g: int
    fat_g: int


class NutritionPlan(BaseModel):
    goal: FitnessGoal
    daily_calories: int
    calorie_targets: CalorieTargets
    macro_targets: MacroTargets
    water_target_ml: int


class WaterSummary(BaseModel):
    date: str
    consumed_ml: int
    target_ml: int


class AddWaterRequest(BaseModel):
    amount_ml: int = Field(gt=0, le=5000)
    date: str | None = None


class DashboardData(BaseModel):
    date: str
    plan: NutritionPlan
    totals: DailyTotals
    water: WaterSummary
    entries: list[MealEntryOut]


class HistoryDay(BaseModel):
    date: str
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    water_ml: int
    weight_kg: float | None


class HistoryResponse(BaseModel):
    range: HistoryRange
    days: list[HistoryDay]
    calorie_target: int | None
    water_target_ml: int | None
