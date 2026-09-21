import datetime as dt

from sqlalchemy import Date, DateTime, Float, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.user import utcnow


class WaterLog(Base):
    """One row per "+250 ml" tap."""

    __tablename__ = "water_logs"
    __table_args__ = (Index("ix_water_logs_user_date", "user_id", "date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    date: Mapped[dt.date] = mapped_column(Date)
    amount_ml: Mapped[int]
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)


class WeightLog(Base):
    """Body weight per day, written when the profile is saved. Feeds the History weight trend."""

    __tablename__ = "weight_logs"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_weight_user_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[dt.date] = mapped_column(Date)
    weight_kg: Mapped[float] = mapped_column(Float)
