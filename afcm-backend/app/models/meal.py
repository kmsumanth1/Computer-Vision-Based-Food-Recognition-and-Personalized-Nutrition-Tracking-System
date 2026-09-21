import datetime as dt

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Index, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import new_id, utcnow


class MealEntry(Base):
    """A food the user ate. Nutrition is a snapshot for the logged weight, calculated by the backend."""

    __tablename__ = "meal_entries"
    __table_args__ = (Index("ix_meal_entries_user_date", "user_id", "date"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    date: Mapped[dt.date] = mapped_column(Date)
    time: Mapped[dt.time] = mapped_column(Time)
    meal_type: Mapped[str] = mapped_column(String(10))  # breakfast | lunch | snacks | dinner
    food_id: Mapped[str] = mapped_column(String(64), ForeignKey("foods.id", ondelete="RESTRICT"))
    food_name: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    weight_g: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(10), default="manual")  # camera | upload | barcode | manual

    calories: Mapped[float] = mapped_column(Float)
    protein_g: Mapped[float] = mapped_column(Float)
    carbs_g: Mapped[float] = mapped_column(Float)
    fat_g: Mapped[float] = mapped_column(Float)
    fiber_g: Mapped[float] = mapped_column(Float)
    other_nutrients: Mapped[list] = mapped_column(JSON, default=list)

    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
