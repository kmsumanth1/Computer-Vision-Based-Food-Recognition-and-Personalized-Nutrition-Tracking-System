import difflib
import math

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.food import Food, FoodAlias
from app.schemas.food import FoodItem, Nutrition, OtherNutrient

MIN_WEIGHT_G = 1
MAX_WEIGHT_G = 5000


def _r1(value: float) -> float:
    return math.floor(value * 10 + 0.5) / 10


def _r0(value: float) -> int:
    return int(math.floor(value + 0.5))


def validate_weight(weight_g: float) -> float:
    if not isinstance(weight_g, (int, float)) or not math.isfinite(weight_g) or not (MIN_WEIGHT_G <= weight_g <= MAX_WEIGHT_G):
        raise AppError(422, "INVALID_WEIGHT", f"Enter a weight between {MIN_WEIGHT_G} and {MAX_WEIGHT_G} g.")
    return float(weight_g)


def nutrition_for(food: Food, weight_g: float) -> Nutrition:
    """Scales the per-100 g values to the eaten weight. The one place food nutrition is calculated."""
    f = weight_g / 100
    return Nutrition(
        calories=_r0(food.calories_100g * f),
        protein_g=_r1(food.protein_g_100g * f),
        carbs_g=_r1(food.carbs_g_100g * f),
        fat_g=_r1(food.fat_g_100g * f),
        fiber_g=_r1(food.fiber_g_100g * f),
        other_nutrients=[
            OtherNutrient(name="Sugar", amount=_r1(food.sugar_g_100g * f), unit="g"),
            OtherNutrient(name="Saturated fat", amount=_r1(food.saturated_fat_g_100g * f), unit="g"),
            OtherNutrient(name="Sodium", amount=_r0(food.sodium_mg_100g * f), unit="mg"),
            OtherNutrient(name="Cholesterol", amount=_r0(food.cholesterol_mg_100g * f), unit="mg"),
        ],
    )


def to_food_item(food: Food, confidence: float | None = None) -> FoodItem:
    return FoodItem(
        food_id=food.id,
        name=food.name,
        brand=food.brand,
        barcode=food.barcode,
        confidence=None if confidence is None else round(confidence, 2),
        reference_weight_g=food.reference_weight_g,
        serving_size_label=food.serving_size_label,
        nutrition=nutrition_for(food, food.reference_weight_g),
    )


def get_food(db: Session, food_id: str | None) -> Food | None:
    return db.get(Food, food_id) if food_id else None


def find_food_by_barcode(db: Session, barcode: str) -> Food | None:
    return db.scalar(select(Food).where(Food.barcode == barcode))


def find_food_by_name(db: Session, query: str | None) -> Food | None:
    """
    Manual entry: "Chicken", "roti", "boiled eggs".
    Order: exact name, exact alias, then a name/alias that contains the text, then a close spelling.
    Packaged products are skipped (they are found by barcode).
    """
    q = (query or "").strip().lower()
    if not q:
        return None

    foods_only = Food.kind == "food"

    exact = db.scalar(select(Food).where(foods_only, func.lower(Food.name) == q))
    if exact:
        return exact

    alias = db.scalar(select(Food).join(FoodAlias).where(foods_only, FoodAlias.alias == q))
    if alias:
        return alias

    if len(q) >= 3:
        like = f"%{q}%"
        candidates = list(
            db.scalars(
                select(Food)
                .outerjoin(FoodAlias)
                .where(foods_only, (func.lower(Food.name).like(like)) | (FoodAlias.alias.like(like)))
                .distinct()
                .limit(20)
            )
        )
        if candidates:
            return min(candidates, key=lambda f: len(f.name))

    # Spelling mistakes: compare with every known name and alias.
    names: dict[str, str] = {}
    for food_id, name in db.execute(select(Food.id, Food.name).where(foods_only)):
        names[name.lower()] = food_id
    for food_id, a in db.execute(select(FoodAlias.food_id, FoodAlias.alias).join(Food).where(foods_only)):
        names[a] = food_id
    match = difflib.get_close_matches(q, list(names), n=1, cutoff=0.8)
    return db.get(Food, names[match[0]]) if match else None


def require_food(db: Session, food_id: str | None = None, food_name: str | None = None) -> Food:
    food = get_food(db, food_id) or find_food_by_name(db, food_name)
    if food is None:
        raise AppError(404, "NUTRITION_UNAVAILABLE", "No nutrition data is available for this food yet.")
    return food
