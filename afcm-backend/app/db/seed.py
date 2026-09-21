"""
Loads the starter foods.   python -m app.db.seed [--update]

Existing rows are left alone unless --update is given. The bundled values are approximate placeholders:
import a real dataset for production (python -m app.db.import_foods your_foods.csv).
"""
import argparse
import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.db.session import get_sessionmaker
from app.models.food import Food, FoodAlias

SEED_FILE = Path(__file__).resolve().parents[1] / "data" / "foods_seed.json"

FIELD_MAP = {
    "calories": "calories_100g",
    "protein_g": "protein_g_100g",
    "carbs_g": "carbs_g_100g",
    "fat_g": "fat_g_100g",
    "fiber_g": "fiber_g_100g",
    "sugar_g": "sugar_g_100g",
    "saturated_fat_g": "saturated_fat_g_100g",
    "sodium_mg": "sodium_mg_100g",
    "cholesterol_mg": "cholesterol_mg_100g",
}


def upsert_food(db: Session, values: dict, aliases: list[str], update: bool) -> str:
    """Returns 'created', 'updated' or 'skipped'."""
    food = db.get(Food, values["id"])
    if food is None:
        food = Food(**values)
        db.add(food)
        status = "created"
    elif update:
        for key, value in values.items():
            setattr(food, key, value)
        status = "updated"
    else:
        return "skipped"

    wanted = {a.strip().lower() for a in aliases if a.strip()}
    existing = {a.alias: a for a in food.aliases}
    for alias, row in existing.items():
        if alias not in wanted:
            food.aliases.remove(row)
    for alias in wanted - set(existing):
        food.aliases.append(FoodAlias(alias=alias))
    return status


def seed_foods(update: bool = False) -> dict[str, int]:
    data = json.loads(SEED_FILE.read_text(encoding="utf-8"))["foods"]
    counts = {"created": 0, "updated": 0, "skipped": 0}
    with get_sessionmaker()() as db:
        for item in data:
            values = {
                "id": item["id"],
                "name": item["name"],
                "kind": item.get("kind", "food"),
                "brand": item.get("brand"),
                "barcode": item.get("barcode"),
                "serving_size_label": item.get("serving_size_label"),
                "reference_weight_g": item["reference_weight_g"],
                "source": "seed",
                **{column: item["per_100g"].get(key, 0) for key, column in FIELD_MAP.items()},
            }
            counts[upsert_food(db, values, item.get("aliases", []), update)] += 1
        db.commit()
    return counts


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--update", action="store_true", help="overwrite foods that already exist")
    print(seed_foods(parser.parse_args().update))
