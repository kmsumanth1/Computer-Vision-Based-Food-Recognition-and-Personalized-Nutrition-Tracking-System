from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.nutrition import NutritionPlan

Sex = Literal["male", "female"]
ActivityLevel = Literal["low", "moderate", "high"]
FitnessGoal = Literal["cut", "bulk", "maintain"]


class UserProfile(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    sex: Sex
    age: int = Field(ge=14, le=100)
    height_cm: float = Field(ge=100, le=250)
    weight_kg: float = Field(ge=30, le=300)
    body_fat_percentage: float = Field(ge=3, le=60)
    activity_level: ActivityLevel
    goal: FitnessGoal

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name is required.")
        return value


class ProfileUpdate(BaseModel):
    """PUT /profile: any subset of the profile."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    sex: Sex | None = None
    age: int | None = Field(default=None, ge=14, le=100)
    height_cm: float | None = Field(default=None, ge=100, le=250)
    weight_kg: float | None = Field(default=None, ge=30, le=300)
    body_fat_percentage: float | None = Field(default=None, ge=3, le=60)
    activity_level: ActivityLevel | None = None
    goal: FitnessGoal | None = None

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Name is required.")
        return value


class ProfileResponse(BaseModel):
    profile: UserProfile
    plan: NutritionPlan | None
