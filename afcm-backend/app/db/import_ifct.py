"""
Builds a foods CSV from an IFCT2017 composition export (a CSV of the book's Table 1 + selected
other tables, keyed by food code like A001, N003, M004), for RAW INGREDIENTS: plain chicken, eggs,
nuts, vegetables, and similar single foods. It is not for cooked, composed dishes (biryani, samosa,
etc.) -- IFCT doesn't have those; use app.db.import_indb for Indian dishes instead.

IMPORTANT -- licence: the IFCT2017 book states its data may not be stored or reproduced in any
electronic format for creating a product without the National Institute of Nutrition's written
permission. Get that permission (or confirm this CSV export carries different, clearer terms)
before using it in anything beyond a private prototype or a paper.

Energy in the source file is in kJ (IFCT reports kJ, not kcal); this tool converts it for you using
the book's own factor, 1 kcal = 4.18 kJ. Saturated fat (fasat) is in mg in this export; also converted.

1. Find the IFCT food that matches each of your food ids:
       python -m app.db.import_ifct --file ifct2017_compositions.csv --search "chicken breast"

2. Write a mapping file (ifct_map.csv). Only `id` and `code` are required:
       id,code,name,reference_weight_g,aliases
       chicken-cooked,N003,Chicken breast (cooked),150,grilled chicken|roast chicken

3. Turn it into a foods CSV, review it, then import it:
       python -m app.db.import_ifct --file ifct2017_compositions.csv --map ifct_map.csv --out foods_ifct.csv
       python -m app.db.import_foods foods_ifct.csv --dry-run
       python -m app.db.import_foods foods_ifct.csv --update
"""
import argparse
import csv
import sys
from pathlib import Path

KJ_PER_KCAL = 4.18  # the conversion factor IFCT2017 itself states

# IFCT column -> our foods CSV column. Values are already per 100 g unless noted.
FIELD_MAP = {
    "protcnt": "protein_g",
    "choavldf": "carbs_g",
    "fatce": "fat_g",
    "fibtg": "fiber_g",
    "fsugar": "sugar_g",
}
SODIUM_MG_COLUMN = "na"           # already mg
CHOLESTEROL_MG_COLUMN = "cholc"   # already mg
SATURATED_FAT_MG_COLUMN = "fasat"  # mg in this export -> our column is grams
OUT_HEADER = [
    "id", "name", "calories", "reference_weight_g", "aliases", "protein_g", "carbs_g", "fat_g",
    "fiber_g", "sugar_g", "saturated_fat_g", "sodium_mg", "cholesterol_mg", "kind",
]


def load_foods(path: Path) -> dict[str, dict]:
    """code -> row, keyed by the IFCT food code (A001, N003, ...)."""
    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = {r["code"].strip(): r for r in csv.DictReader(handle) if r.get("code")}
    if not rows:
        raise ValueError(f"{path.name} has no usable rows (expected a 'code' column).")
    return rows


def search(path: Path, terms: str, limit: int = 15) -> list[tuple[str, str]]:
    words = [w for w in terms.lower().split() if w]
    hits = []
    for code, row in load_foods(path).items():
        name = row.get("name", "")
        if all(w in name.lower() for w in words):
            hits.append((len(name), code, name))
    hits.sort()
    return [(code, name) for _, code, name in hits[:limit]]


def _num(value: object) -> float:
    if value is None or value == "":
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def build_rows(path: Path, mapping: Path) -> tuple[list[dict], list[str]]:
    wanted = list(csv.DictReader(mapping.open(newline="", encoding="utf-8-sig")))
    for i, row in enumerate(wanted, start=2):
        if not (row.get("id") or "").strip() or not (row.get("code") or "").strip():
            raise ValueError(f"{mapping.name} line {i}: id and code are both required")

    foods = load_foods(path)
    rows: list[dict] = []
    warnings: list[str] = []
    for row in wanted:
        food_id, code = row["id"].strip().lower(), row["code"].strip()
        record = foods.get(code)
        if record is None:
            raise ValueError(f"code {code} (for {food_id}) is not in {path.name}. Search with --search.")

        energy_kj = _num(record.get("enerc"))
        if energy_kj <= 0:
            raise ValueError(f"IFCT food {code} ({record.get('name')}) has no energy value, so it can't be used for {food_id}.")
        calories = energy_kj / KJ_PER_KCAL

        values = {column: _num(record.get(source)) for source, column in FIELD_MAP.items()}
        values["sodium_mg"] = _num(record.get(SODIUM_MG_COLUMN))
        values["cholesterol_mg"] = _num(record.get(CHOLESTEROL_MG_COLUMN))
        values["saturated_fat_g"] = _num(record.get(SATURATED_FAT_MG_COLUMN)) / 1000

        macro_kcal = 4 * values["protein_g"] + 4 * values["carbs_g"] + 9 * values["fat_g"]
        if calories > 20 and not (0.5 * calories <= macro_kcal <= 1.5 * calories):
            warnings.append(f"{food_id}: calories ({calories:.0f}) and macros (about {macro_kcal:.0f} kcal) disagree. Check the code.")

        rows.append(
            {
                "id": food_id,
                "name": (row.get("name") or "").strip() or str(record.get("name") or food_id),
                "reference_weight_g": (row.get("reference_weight_g") or "").strip() or "100",
                "aliases": (row.get("aliases") or "").strip(),
                "kind": "food",
                "calories": f"{calories:g}",
                **{c: f"{v:g}" for c, v in values.items()},
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
    p.add_argument("--file", type=Path, required=True, help="the IFCT composition CSV")
    p.add_argument("--search", help="words to look for in the food name")
    p.add_argument("--map", type=Path, help="CSV with columns id, code (and optionally name, reference_weight_g, aliases)")
    p.add_argument("--out", type=Path, default=Path("foods_ifct.csv"))
    args = p.parse_args()

    try:
        if args.search:
            hits = search(args.file, args.search)
            if not hits:
                print("No matches. Try fewer or different words.")
            for code, name in hits:
                print(f"{code:>6}  {name}")
            return 0
        if not args.map:
            p.error("give --search or --map")
        rows, warnings = build_rows(args.file, args.map)
    except (ValueError, OSError, KeyError) as exc:
        sys.exit(f"Error: {exc}")

    write_csv(rows, args.out)
    for w in warnings:
        print(f"WARNING  {w}")
    print(f"Wrote {len(rows)} foods to {args.out}. Review it, then: python -m app.db.import_foods {args.out} --dry-run")
    return 0


if __name__ == "__main__":
    sys.exit(main())