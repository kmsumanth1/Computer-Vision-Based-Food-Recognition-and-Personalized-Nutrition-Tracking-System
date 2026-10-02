"""
Looks up your Indian dish classes against INDB.xlsx and writes a --map CSV for app.db.import_indb,
so you review matches instead of searching each dish name by hand.

    python -m app.db.suggest_indb_map --file INDB.xlsx --out indb_map.csv

By default it looks at every food in your database with source=import (that's what
app.db.import_foods sets). Pass --food-ids to name specific ones instead, e.g. the Khana dishes only.

Writes: id, recipe_code, name, reference_weight_g, aliases, matched
"matched" is the INDB recipe name it picked, for you to eyeball. Several dish names have more than
one variant in INDB (e.g. "biryani" -> mutton biryani vs vegetable biryani); when that happens this
prints ALL the candidates it saw so you can pick, and leaves fdc... recipe_code blank for you to
fill in rather than silently guessing between very different dishes.
"""
import argparse
import csv
import sys
from pathlib import Path

from sqlalchemy import select

from app.db.session import get_sessionmaker
from app.db.import_indb import load_recipes
from app.models.food import Food

OUT_HEADER = ["id", "recipe_code", "name", "reference_weight_g", "aliases", "matched"]

# A dish name containing any of these words often has several meaningfully different INDB variants
# (veg vs meat, or several regional versions) with a similar calorie spread wide enough that picking
# one automatically would be a guess rather than a match. These get flagged for manual choice instead.
AMBIGUOUS_HINTS = ("biryani", "biriyani", "samosa", "curry", "korma", "kebab", "kabab")


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


def find_candidates(recipes: dict[str, dict], terms: str) -> list[tuple[str, str]]:
    words = [w for w in terms.replace("-", " ").lower().split() if w]
    hits = []
    for code, record in recipes.items():
        name = str(record.get("food_name") or "")
        if all(w in name.lower() for w in words):
            hits.append((len(name), code, name))
    hits.sort()
    return [(code, name) for _, code, name in hits]


def suggest(path: Path, foods: list[Food]) -> tuple[list[dict], list[str], dict[str, list[tuple[str, str]]]]:
    recipes = load_recipes(path)
    rows: list[dict] = []
    unmatched: list[str] = []
    ambiguous: dict[str, list[tuple[str, str]]] = {}

    for food in foods:
        candidates = find_candidates(recipes, food.name)
        if not candidates:
            for alias in getattr(food, "alias_list", []):
                candidates = find_candidates(recipes, alias)
                if candidates:
                    break
        if not candidates:
            unmatched.append(food.id)
            continue

        is_ambiguous = len(candidates) > 1 and any(h in food.name.lower() for h in AMBIGUOUS_HINTS)
        code, matched_name = candidates[0]
        rows.append(
            {
                "id": food.id,
                "recipe_code": "" if is_ambiguous else code,
                "name": food.name,
                "reference_weight_g": f"{food.reference_weight_g:g}",
                "aliases": "|".join(getattr(food, "alias_list", [])),
                "matched": "CHOOSE ONE (see list below)" if is_ambiguous else matched_name,
            }
        )
        if is_ambiguous:
            ambiguous[food.id] = candidates
    return rows, unmatched, ambiguous


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--file", type=Path, required=True, help="path to INDB.xlsx")
    p.add_argument("--out", type=Path, default=Path("indb_map.csv"))
    p.add_argument("--source", action="append", default=["import"], help="Food.source values to include (repeatable); default: import")
    p.add_argument("--food-ids", help="comma-separated food ids to match instead of filtering by --source")
    args = p.parse_args()

    food_ids = [f.strip() for f in args.food_ids.split(",")] if args.food_ids else None
    foods = foods_to_match(args.source, food_ids)
    if not foods:
        sys.exit("No foods matched that filter. Nothing to do.")

    print(f"Searching INDB for {len(foods)} foods...")
    rows, unmatched, ambiguous = suggest(args.file, foods)

    with args.out.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUT_HEADER)
        writer.writeheader()
        writer.writerows(rows)

    matched = len(rows) - len(ambiguous)
    print(f"Matched {matched} of {len(foods)} directly. Wrote {args.out}.")
    if unmatched:
        print(f"No match found for {len(unmatched)}: {', '.join(unmatched)}")
    if ambiguous:
        print(f"\n{len(ambiguous)} dish(es) have more than one INDB variant. Open {args.out}, fill in recipe_code for these:")
        for food_id, candidates in ambiguous.items():
            print(f"\n  {food_id}:")
            for code, name in candidates[:8]:
                print(f"    {code:>10}  {name}")
            if len(candidates) > 8:
                print(f"    ... and {len(candidates) - 8} more")
    print(f"\nThen: python -m app.db.import_indb --file {args.file} --map {args.out} --out foods_indb.csv")
    print("      python -m app.db.import_foods foods_indb.csv --dry-run")
    print("      python -m app.db.import_foods foods_indb.csv --update")
    return 0


if __name__ == "__main__":
    sys.exit(main())