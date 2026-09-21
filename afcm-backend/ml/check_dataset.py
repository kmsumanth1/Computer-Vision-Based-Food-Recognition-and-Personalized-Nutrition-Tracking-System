"""
Checks a food-photo dataset BEFORE you spend hours training on it. Needs only Pillow (no PyTorch).

    python -m ml.check_dataset --data-dir ml/data
    python -m ml.check_dataset --data-dir ml/data --foods-csv my_foods.csv --label-map ml/label_map.json --deep

Layout it expects (folder name = class label):
    ml/data/train/<label>/*.jpg
    ml/data/val/<label>/*.jpg       (optional; otherwise train.py splits train)

It reports classes with too few photos, unreadable files, classes missing from val, and any class label
that doesn't match a food in the nutrition database (the model can only be useful for foods that have nutrition data).
Exit code 1 when there are errors.
"""
import argparse
import csv
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, UnidentifiedImageError

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
SEED_FILE = Path(__file__).resolve().parents[1] / "app" / "data" / "foods_seed.json"


@dataclass
class Report:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    train_counts: dict[str, int] = field(default_factory=dict)
    val_counts: dict[str, int] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return not self.errors


def _images(folder: Path) -> list[Path]:
    return sorted(p for p in folder.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES)


def _class_counts(split_dir: Path) -> dict[str, int]:
    return {d.name: len(_images(d)) for d in sorted(split_dir.iterdir()) if d.is_dir() and not d.name.startswith(".")}


def known_food_ids(foods_csv: Path | None = None, use_db: bool = False) -> set[str]:
    ids = {f["id"] for f in json.loads(SEED_FILE.read_text(encoding="utf-8"))["foods"]}
    if foods_csv:
        with foods_csv.open(newline="", encoding="utf-8-sig") as handle:
            ids |= {(row.get("id") or "").strip().lower() for row in csv.DictReader(handle)}
    if use_db:
        from sqlalchemy import select

        from app.db.session import get_sessionmaker
        from app.models.food import Food

        with get_sessionmaker()() as db:
            ids |= set(db.scalars(select(Food.id)))
    ids.discard("")
    return ids


def check_dataset(
    data_dir: Path,
    food_ids: set[str],
    label_map: dict[str, str] | None = None,
    min_images: int = 30,
    deep: bool = False,
) -> Report:
    report = Report()
    train_dir, val_dir = data_dir / "train", data_dir / "val"
    if not train_dir.is_dir():
        report.errors.append(f"{train_dir} does not exist. Put one folder per food class inside it.")
        return report

    report.train_counts = _class_counts(train_dir)
    if len(report.train_counts) < 2:
        report.errors.append("Need at least 2 classes in train/.")
    if val_dir.is_dir():
        report.val_counts = _class_counts(val_dir)

    label_map = label_map or {}
    for label, count in report.train_counts.items():
        if count == 0:
            report.errors.append(f"Class '{label}' has no images.")
        elif count < min_images:
            report.warnings.append(f"Class '{label}' has only {count} images (aim for {min_images}+; hundreds is better).")

        food_id = label_map.get(label, label)
        if food_id not in food_ids:
            hint = "" if label in label_map else " Add it to the foods table or map it in label_map.json."
            report.errors.append(f"Class '{label}' -> '{food_id}' is not in the nutrition database.{hint}")

        if report.val_counts and report.val_counts.get(label, 0) == 0:
            report.warnings.append(f"Class '{label}' has no validation images, so its accuracy can't be measured.")

    for label in report.val_counts:
        if label not in report.train_counts:
            report.errors.append(f"val/ has class '{label}' that train/ does not.")
    for label in label_map:
        if label not in report.train_counts:
            report.warnings.append(f"label_map.json mentions '{label}' but there is no such class folder.")

    counts = [c for c in report.train_counts.values() if c > 0]
    if counts and max(counts) > 10 * min(counts):
        report.warnings.append(f"Classes are very unbalanced ({min(counts)} to {max(counts)} images). Rare classes will be predicted less reliably.")

    if deep:
        for split_dir in [train_dir] + ([val_dir] if val_dir.is_dir() else []):
            for path in _images(split_dir):
                try:
                    with Image.open(path) as img:
                        img.verify()
                except (UnidentifiedImageError, OSError, SyntaxError):
                    report.errors.append(f"Unreadable image: {path}")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data-dir", type=Path, default=Path("ml/data"))
    parser.add_argument("--foods-csv", type=Path, help="foods CSV you plan to import (its ids count as known)")
    parser.add_argument("--db", action="store_true", help="also read food ids from the configured database")
    parser.add_argument("--label-map", type=Path, help="JSON {class folder: food id} when they differ")
    parser.add_argument("--min-images", type=int, default=30)
    parser.add_argument("--deep", action="store_true", help="open every image (slow on big datasets)")
    args = parser.parse_args()

    label_map = json.loads(args.label_map.read_text(encoding="utf-8")) if args.label_map else None
    report = check_dataset(args.data_dir, known_food_ids(args.foods_csv, args.db), label_map, args.min_images, args.deep)

    total = sum(report.train_counts.values())
    print(f"train: {len(report.train_counts)} classes, {total} images" + (f" | val: {sum(report.val_counts.values())} images" if report.val_counts else " | no val/ folder (train.py will split train)"))
    for line in report.warnings:
        print(f"WARNING  {line}")
    for line in report.errors:
        print(f"ERROR    {line}")
    print("Dataset looks good." if report.ok and not report.warnings else ("OK with warnings." if report.ok else "Fix the errors above before training."))
    return 0 if report.ok else 1


if __name__ == "__main__":
    sys.exit(main())
