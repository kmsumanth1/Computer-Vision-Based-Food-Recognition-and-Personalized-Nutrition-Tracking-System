"""
Looks up every food you filled in by hand against a USDA download, and writes a --map CSV for
app.db.import_usda, so you review matches instead of searching 82 names one at a time.

    python -m app.db.suggest_usda_map --usda-dir "C:/path/to/FoodData_Central_sr_legacy_food_csv" --out usda_map.csv

By default it looks at every food in your database with source=import (that's what
app.db.import_foods sets, so it's exactly the rows you typed in from foods_todo.csv). Pass
--source seed to also include the original starter foods, or --food-ids to name specific ones.

Writes: id, fdc_id, name, reference_weight_g, aliases, matched
"matched" is the USDA description it picked, for you to eyeball; delete a row (or blank its
fdc_id) for anything that looks wrong before running import_usda. It is not read by import_usda,
so leaving it in the file is harmless.
"""
import argparse
import csv
import sys
from pathlib import Path

from sqlalchemy import select

from app.db.session import get_sessionmaker
from app.db.import_usda import search
from app.models.food import Food, FoodAlias

OUT_HEADER = ["id", "fdc_id", "name", "reference_weight_g", "aliases", "matched"]


def foods_to_match(sources: list[str], food_ids: list[str] | None) -> list[Food]:
    with get_sessionmaker()() as db:
        query = select(Food).where(Food.kind == "food")
        if food_ids:
            query = query.where(Food.id.in_(food_ids))
        else:
            query = query.where(Food.source.in_(sources))
        foods = list(db.scalars(query))
        for food in foods:
            db.refresh(food, attribute_names=["aliases"])
            food.alias_list = [a.alias for a in food.aliases]  # type: ignore[attr-defined]
    return foods


def best_match(usda_dir: Path, terms: str) -> tuple[str, str] | None:
    hits = search(usda_dir, terms, limit=1)
    if not hits:
        return None
    fdc_id, description, _data_type = hits[0]
    return fdc_id, description


def suggest(usda_dir: Path, foods: list[Food]) -> tuple[list[dict], list[str]]:
    rows: list[dict] = []
    unmatched: list[str] = []
    for food in foods:
        match = best_match(usda_dir, food.name)
        if match is None and getattr(food, "alias_list", None):
            for alias in food.alias_list:  # type: ignore[attr-defined]
                match = best_match(usda_dir, alias)
                if match:
                    break
        if match is None:
            unmatched.append(food.id)
            continue
        fdc_id, description = match
        rows.append(
            {
                "id": food.id,
                "fdc_id": fdc_id,
                "name": food.name,
                "reference_weight_g": f"{food.reference_weight_g:g}",
                "aliases": "|".join(getattr(food, "alias_list", [])),
                "matched": description,
            }
        )
    return rows, unmatched


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--usda-dir", type=Path, required=True)
    p.add_argument("--out", type=Path, default=Path("usda_map.csv"))
    p.add_argument("--source", action="append", default=["import"], help="Food.source values to include (repeatable); default: import")
    p.add_argument("--food-ids", help="comma-separated food ids to match instead of filtering by --source")
    args = p.parse_args()

    food_ids = [f.strip() for f in args.food_ids.split(",")] if args.food_ids else None
    foods = foods_to_match(args.source, food_ids)
    if not foods:
        sys.exit("No foods matched that filter. Nothing to do.")

    print(f"Searching USDA data for {len(foods)} foods...")
    rows, unmatched = suggest(args.usda_dir, foods)

    with args.out.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUT_HEADER)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Matched {len(rows)} of {len(foods)}. Wrote {args.out}.")
    if unmatched:
        print(f"No match found for {len(unmatched)}: {', '.join(unmatched)}")
    print(f"\nOpen {args.out} and check the 'matched' column. Delete any row that looks wrong, then:")
    print(f"  python -m app.db.import_usda --usda-dir {args.usda_dir} --map {args.out} --out foods_usda.csv")
    print("  python -m app.db.import_foods foods_usda.csv --dry-run")
    print("  python -m app.db.import_foods foods_usda.csv --update")
    return 0


if __name__ == "__main__":
    sys.exit(main())