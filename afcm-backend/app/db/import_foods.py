"""
Imports foods from a CSV.   python -m app.db.import_foods foods.csv [--update] [--dry-run]

Columns (header row required). Nutrition is per 100 g. Only the first four are mandatory.
  id                 stable slug, e.g. chicken-breast (this is what your AI labels map to)
  name               display name
  calories           kcal per 100 g
  reference_weight_g typical serving in grams (starting weight after recognition)
  aliases            other names separated by |   e.g. roti|phulka
  protein_g, carbs_g, fat_g, fiber_g, sugar_g, saturated_fat_g, sodium_mg, cholesterol_mg
  kind               food (default) or product
  brand, barcode, serving_size_label    for packaged products
"""
import argparse
import csv
import sys
from pathlib import Path

from app.db.seed import FIELD_MAP, upsert_food
from app.db.session import get_sessionmaker

REQUIRED = ("id", "name", "calories", "reference_weight_g")


def _num(row: dict, key: str, line: int) -> float:
    raw = (row.get(key) or "").strip()
    if raw == "":
        return 0.0
    try:
        value = float(raw)
    except ValueError:
        raise ValueError(f"line {line}: {key}={raw!r} is not a number") from None
    if value < 0:
        raise ValueError(f"line {line}: {key} can't be negative")
    return value


def read_rows(path: Path) -> list[tuple[dict, list[str]]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        missing = [c for c in REQUIRED if c not in (reader.fieldnames or [])]
        if missing:
            raise ValueError(f"Missing required column(s): {', '.join(missing)}")

        out: list[tuple[dict, list[str]]] = []
        seen: set[str] = set()
        for line, row in enumerate(reader, start=2):
            food_id = (row.get("id") or "").strip().lower()
            if not food_id:
                raise ValueError(f"line {line}: id is empty")
            if food_id in seen:
                raise ValueError(f"line {line}: duplicate id {food_id!r}")
            seen.add(food_id)
            if not (row.get("name") or "").strip():
                raise ValueError(f"line {line}: name is empty")
            if (row.get("calories") or "").strip() == "":                                   
                raise ValueError(f"line {line}: calories is empty (fill it in, or remove the row)")  
            weight = _num(row, "reference_weight_g", line)
            if weight <= 0:
                raise ValueError(f"line {line}: reference_weight_g must be above 0")

            values = {
                "id": food_id,
                "name": row["name"].strip(),
                "kind": (row.get("kind") or "food").strip() or "food",
                "brand": (row.get("brand") or "").strip() or None,
                "barcode": (row.get("barcode") or "").strip() or None,
                "serving_size_label": (row.get("serving_size_label") or "").strip() or None,
                "reference_weight_g": weight,
                "source": "import",
                **{column: _num(row, key, line) for key, column in FIELD_MAP.items()},
            }
            if values["kind"] not in ("food", "product"):
                raise ValueError(f"line {line}: kind must be food or product")
            aliases = [a for a in (row.get("aliases") or "").split("|") if a.strip()]
            out.append((values, aliases))
    return out


def import_csv(path: Path, update: bool = False, dry_run: bool = False) -> dict[str, int]:
    rows = read_rows(path)  # validates everything before touching the database
    counts = {"created": 0, "updated": 0, "skipped": 0}
    if dry_run:
        counts["created"] = len(rows)
        return counts
    with get_sessionmaker()() as db:
        for values, aliases in rows:
            counts[upsert_food(db, values, aliases, update)] += 1
        db.commit()
    return counts


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("csv_file", type=Path)
    parser.add_argument("--update", action="store_true", help="overwrite foods that already exist")
    parser.add_argument("--dry-run", action="store_true", help="only check the file")
    args = parser.parse_args()
    try:
        print(import_csv(args.csv_file, args.update, args.dry_run))
    except (ValueError, OSError) as exc:
        sys.exit(f"Import failed: {exc}")
