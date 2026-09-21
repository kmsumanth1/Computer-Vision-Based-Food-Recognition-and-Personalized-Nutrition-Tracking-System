from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.user import utcnow


class Food(Base):
    """One row per food or packaged product. All nutrition values are per 100 g."""

    __tablename__ = "foods"

    # Stable slug such as "chicken-breast". The AI model's class labels map onto this id.
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    kind: Mapped[str] = mapped_column(String(10), default="food")  # food | product
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    barcode: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    serving_size_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    # Typical serving. Shown as the starting weight after recognition.
    reference_weight_g: Mapped[float] = mapped_column(Float, default=100.0)

    calories_100g: Mapped[float] = mapped_column(Float)
    protein_g_100g: Mapped[float] = mapped_column(Float, default=0)
    carbs_g_100g: Mapped[float] = mapped_column(Float, default=0)
    fat_g_100g: Mapped[float] = mapped_column(Float, default=0)
    fiber_g_100g: Mapped[float] = mapped_column(Float, default=0)
    sugar_g_100g: Mapped[float] = mapped_column(Float, default=0)
    saturated_fat_g_100g: Mapped[float] = mapped_column(Float, default=0)
    sodium_mg_100g: Mapped[float] = mapped_column(Float, default=0)
    cholesterol_mg_100g: Mapped[float] = mapped_column(Float, default=0)

    source: Mapped[str] = mapped_column(String(30), default="seed")  # seed | import | openfoodfacts
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    aliases: Mapped[list["FoodAlias"]] = relationship(back_populates="food", cascade="all, delete-orphan")


class FoodAlias(Base):
    """Other names people use for a food ("roti" for "chapati"). Stored lower-case."""

    __tablename__ = "food_aliases"
    __table_args__ = (UniqueConstraint("food_id", "alias", name="uq_food_alias"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    food_id: Mapped[str] = mapped_column(String(64), ForeignKey("foods.id", ondelete="CASCADE"), index=True)
    alias: Mapped[str] = mapped_column(String(128), index=True)

    food: Mapped[Food] = relationship(back_populates="aliases")
