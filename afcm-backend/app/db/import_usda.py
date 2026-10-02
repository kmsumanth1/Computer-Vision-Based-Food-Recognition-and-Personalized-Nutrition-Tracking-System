"""
Builds a foods CSV from a downloaded USDA FoodData Central (FDC) file set.

USDA FDC is a nutrition database, not a photo collection. It fills the `foods` table (calories and macros per 100 g);
it can't be used to train the image model.

Download "SR Legacy" or "Foundation Foods" (CSV) from https://fdc.nal.usda.gov/download-datasets and unzip it.
Both are small. (The Branded set is gigabytes; this tool streams it, but you rarely need it.)

1. Find the USDA food that matches each of your foods:
       python -m app.db.import_usda --usda-dir ~/Downloads/FoodData_Central_sr_legacy_food_csv --search "chicken breast roasted"

2. Write a mapping file (usda_map.csv). Only `id` and `fdc_id` are required:
       id,fdc_id,name,reference_weight_g,aliases
       chicken-breast,171477,Chicken breast (grilled),200,chicken|grilled chicken
       banana,173944,Banana,118,

3. Turn it into a foods CSV, review it, then import it:
       python -m app.db.import_usda --usda-dir ... --map usda_map.csv --out foods_usda.csv
       python -m app.db.import_foods foods_usda.csv --dry-run
       python -m app.db.import_foods foods_usda.csv

Values are per 100 g, which is what the foods table stores. USDA's data is public domain (CC0); crediting FoodData Central is requested.
USDA has few Indian dishes. Use an Indian source (INDB / IFCT 2017) for those.
"""
import argparse
import csv
import sys
from pathlib import Path

# nutrient_nbr in nutrient.csv -> column of our foods CSV. First number listed wins.
NUTRIENT_NUMBERS: dict[str, tuple[str, ...]] = {
    "calories": ("208", "958", "957"),  # 958/957 are Atwater energy, used by Foundation Foods when 208 is absent
    "protein_g": ("203",),
    "fat_g": ("204",),
    "carbs_g": ("205",),
    "fiber_g": ("291",),
    "sugar_g": ("269", "269.3"),
    "saturated_fat_g": ("606",),
    "sodium_mg": ("307",),
    "cholesterol_mg": ("601",),
}
OUT_HEADER = [
    "id", "name", "calories", "reference_weight_g", "aliases", "protein_g", "carbs_g", "fat_g",
    "fiber_g", "sugar_g", "saturated_fat_g", "sodium_mg", "cholesterol_mg", "kind",
]
FOOD_TYPES = {"sr_legacy_food", "foundation_food"}


def _nbr(value: str) -> str:
    """'208', '208.0' and ' 208 ' all become '208'."""
    try:
        return f"{float(value):g}"
    except ValueError:
        return value.strip()


def find_file(usda_dir: Path, name: str) -> Path:
    direct = usda_dir / name
    if direct.is_file():
        return direct
    found = sorted(usda_dir.rglob(name))
    if not found:
        raise ValueError(f"{name} not found under {usda_dir}. Point --usda-dir at the unzipped FDC CSV folder.")
    return found[0]


def _rows(path: Path):
    with path.open(newline="", encoding="utf-8-sig") as handle:
        yield from csv.DictReader(handle)


def load_foods(usda_dir: Path) -> dict[str, tuple[str, str]]:
    """fdc_id -> (description, data_type)"""
    return {r["fdc_id"]: (r["description"], r.get("data_type", "")) for r in _rows(find_file(usda_dir, "food.csv"))}


def search(usda_dir: Path, terms: str, limit: int = 15) -> list[tuple[str, str, str]]:
    words = [w for w in terms.lower().split() if w]
    hits = []
    for fdc_id, (description, data_type) in load_foods(usda_dir).items():
        text = description.lower()
        if all(w in text for w in words):
            preferred = 0 if data_type in FOOD_TYPES else 1
            hits.append((preferred, len(description), fdc_id, description, data_type))
    hits.sort()
    return [(fdc_id, description, data_type) for _, _, fdc_id, description, data_type in hits[:limit]]


def load_amounts(usda_dir: Path, fdc_ids: set[str]) -> dict[str, dict[str, float]]:
    """fdc_id -> {our column: amount per 100 g}, streaming food_nutrient.csv so huge files are fine."""
    nutrient_info: dict[str, tuple[str, str]] = {}  # nutrient id -> (number, unit)
    for r in _rows(find_file(usda_dir, "nutrient.csv")):
        nutrient_info[r["id"]] = (_nbr(r.get("nutrient_nbr", "")), (r.get("unit_name") or "").upper())

    wanted_numbers = {n for numbers in NUTRIENT_NUMBERS.values() for n in numbers}
    raw: dict[str, dict[str, float]] = {}  # fdc_id -> {nutrient number: amount}
    for r in _rows(find_file(usda_dir, "food_nutrient.csv")):
        if r["fdc_id"] not in fdc_ids:
            continue
        number, unit = nutrient_info.get(r["nutrient_id"], ("", ""))
        if number not in wanted_numbers or r.get("amount", "") == "":
            continue
        if number in NUTRIENT_NUMBERS["calories"] and unit != "KCAL":
            continue  # never mistake kilojoules for kilocalories
        try:
            raw.setdefault(r["fdc_id"], {})[number] = float(r["amount"])
        except ValueError:
            continue

    out: dict[str, dict[str, float]] = {}
    for fdc_id, by_number in raw.items():
        out[fdc_id] = {
            column: next((by_number[n] for n in numbers if n in by_number), None)  # type: ignore[misc]
            for column, numbers in NUTRIENT_NUMBERS.items()
        }
    return out


def build_rows(usda_dir: Path, mapping: Path) -> tuple[list[dict], list[str]]:
    """Returns (rows for the foods CSV, warnings)."""
    wanted = list(_rows(mapping))
    for i, row in enumerate(wanted, start=2):
        if not (row.get("id") or "").strip() or not (row.get("fdc_id") or "").strip():
            raise ValueError(f"{mapping.name} line {i}: id and fdc_id are both required")
    foods = load_foods(usda_dir)
    amounts = load_amounts(usda_dir, {r["fdc_id"].strip() for r in wanted})

    rows: list[dict] = []
    warnings: list[str] = []
    for row in wanted:
        food_id, fdc_id = row["id"].strip().lower(), row["fdc_id"].strip()
        if fdc_id not in foods:
            raise ValueError(f"fdc_id {fdc_id} (for {food_id}) is not in food.csv. Search with --search.")
        values = amounts.get(fdc_id)
        if not values or values.get("calories") is None:
            raise ValueError(f"USDA food {fdc_id} ({foods[fdc_id][0]}) has no energy value, so it can't be used for {food_id}.")

        missing = [c for c, v in values.items() if v is None and c != "calories"]
        if missing:
            warnings.append(f"{food_id}: USDA has no value for {', '.join(missing)} (stored as 0)")
        v = {c: (x if x is not None else 0.0) for c, x in values.items()}

        macro_kcal = 4 * v["protein_g"] + 4 * v["carbs_g"] + 9 * v["fat_g"]
        if v["calories"] > 20 and not (0.65 * v["calories"] <= macro_kcal <= 1.35 * v["calories"]):
            warnings.append(f"{food_id}: calories ({v['calories']:g}) and macros (about {macro_kcal:.0f} kcal) disagree. Check the fdc_id.")

        rows.append(
            {
                "id": food_id,
                "name": (row.get("name") or "").strip() or foods[fdc_id][0],
                "reference_weight_g": (row.get("reference_weight_g") or "").strip() or "100",
                "aliases": (row.get("aliases") or "").strip(),
                "kind": "food",
                **{c: f"{x:g}" for c, x in v.items()},
            }
        )
    return rows, warnings


def write_csv(rows: list[dict], out: Path) -> None:
    with out.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUT_HEADER)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--usda-dir", type=Path, required=True, help="unzipped FoodData Central CSV folder")
    p.add_argument("--search", help="words to look for in USDA food names")
    p.add_argument("--map", type=Path, help="CSV with columns id, fdc_id (and optionally name, reference_weight_g, aliases)")
    p.add_argument("--out", type=Path, default=Path("foods_usda.csv"))
    args = p.parse_args()

    try:
        if args.search:
            hits = search(args.usda_dir, args.search)
            if not hits:
                print("No matches. Try fewer or different words.")
            for fdc_id, description, data_type in hits:
                print(f"{fdc_id:>8}  [{data_type}]  {description}")
            return 0
        if not args.map:
            p.error("give --search or --map")
        rows, warnings = build_rows(args.usda_dir, args.map)
    except (ValueError, OSError, KeyError) as exc:
        sys.exit(f"Error: {exc}")

    write_csv(rows, args.out)
    for w in warnings:
        print(f"WARNING  {w}")
    print(f"Wrote {len(rows)} foods to {args.out}. Review it, then: python -m app.db.import_foods {args.out} --dry-run")
    return 0


if __name__ == "__main__":
    sys.exit(main())