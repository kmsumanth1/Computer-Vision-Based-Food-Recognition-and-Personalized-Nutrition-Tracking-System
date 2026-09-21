import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.food import Nutrition

MealType = Literal["breakfast", "lunch", "snacks", "dinner"]
FoodSource = Literal["camera", "upload", "barcode", "manual"]

_TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def _check_time(value: str) -> str:
    if not _TIME_RE.match(value):
        raise ValueError("Time must be HH:mm (24-hour).")
    return value


class MealEntryOut(BaseModel):
    id: str
    meal_type: MealType
    food_id: str
    food_name: str
    quantity: float
    weight_g: float
    nutrition: Nutrition
    date: str
    time: str
    source: FoodSource


class CreateMealRequest(BaseModel):
    meal_type: MealType
    food_id: str = Field(min_length=1, max_length=64)
    food_name: str = Field(default="", max_length=255)
    quantity: float = 1
    weight_g: float
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str
    source: FoodSource = "manual"

    @field_validator("time")
    @classmethod
    def _time(cls, value: str) -> str:
        return _check_time(value)


class UpdateMealRequest(BaseModel):
    meal_type: MealType | None = None
    quantity: float | None = None
    weight_g: float | None = None
    time: str | None = None

    @field_validator("time")
    @classmethod
    def _time(cls, value: str | None) -> str | None:
        return None if value is None else _check_time(value)


class DailyTotals(BaseModel):
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float


class MealsResponse(BaseModel):
    date: str
    totals: DailyTotals
    entries: list[MealEntryOut]
