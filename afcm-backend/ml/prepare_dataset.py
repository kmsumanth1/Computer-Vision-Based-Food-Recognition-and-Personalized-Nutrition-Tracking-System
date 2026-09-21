"""
Turns a downloaded public dataset (Khana, Food-101, ...) into the folder layout `ml.train` expects,
and can merge several datasets into one training set. Needs only Pillow.

    python -m ml.prepare_dataset --source ~/Downloads/Khana --tag khana --max-per-class 400
    python -m ml.prepare_dataset --source ~/Downloads/food-101 --tag food101 --only-file wanted_classes.txt

It understands three common layouts (it prints which one it found):
    1. Food-101 style   images/<class>/*.jpg  plus meta/train.txt and meta/test.txt
    2. Split folders    train/<class>/*.jpg, val/ (or valid/, test/) with the same class folders
    3. Class folders    <class>/*.jpg   (no split: about 10 % of each class becomes validation)

Class names become food ids: "Butter Chicken" -> butter-chicken, "apple_pie" -> apple-pie.
Use --class-map to rename, merge or drop classes (see below). Images that can't be opened are skipped.

It also writes, into --dest:
    sources.json     where each dataset came from, counts, and a reminder to check its licence
    foods_todo.csv   one row per class that has no nutrition data yet. Fill it in, then import it with
                     python -m app.db.import_foods  (rows with an empty calories value are rejected on purpose)

--class-map is a JSON file {"source class": "food id"}. Several source classes can point at the same
food id, which merges them (say, twenty dosa varieties into "dosa"). Map a class to null to leave it out.
"""
import argparse
import csv
import hashlib
import json
import math
import os
import re
import shutil
import sys
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, UnidentifiedImageError

from ml.check_dataset import IMAGE_SUFFIXES, known_food_ids

VAL_NAMES = ("val", "valid", "validation")
TODO_HEADER = [
    "id", "name", "calories", "reference_weight_g", "aliases", "protein_g", "carbs_g", "fat_g",
    "fiber_g", "sugar_g", "saturated_fat_g", "sodium_mg", "cholesterol_mg", "kind",
]


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")
    if not slug:
        raise ValueError(f"Can't make a food id from {name!r}")
    return slug


@dataclass(frozen=True)
class Sample:
    path: Path
    label: str  # class name as it appears in the source
    split: str | None  # "train", "val" or None when the source doesn't say


def _class_dirs(folder: Path) -> list[Path]:
    return sorted(d for d in folder.iterdir() if d.is_dir() and not d.name.startswith((".", "__")))


def _images_in(folder: Path) -> list[Path]:
    """
    Candidate image files under a folder. Some datasets name files by hash with no extension, so those count too
    (they are checked by content later). Hidden files such as macOS '._name' leftovers and __MACOSX folders are ignored.
    os.walk is used because it needs no extra lookup per file, which matters with 100,000+ files on Windows.
    """
    found: list[Path] = []
    for root, dirs, names in os.walk(folder):
        dirs[:] = [d for d in dirs if not d.startswith((".", "__"))]
        for name in names:
            if name.startswith("."):
                continue
            suffix = os.path.splitext(name)[1].lower()
            if suffix in IMAGE_SUFFIXES or suffix == "":
                found.append(Path(root) / name)
    return sorted(found)


def _unwrap(source: Path) -> Path:
    """Zips often extract to Khana/Khana/...: step into a lone wrapper folder."""
    for _ in range(3):
        entries = [e for e in source.iterdir() if not e.name.startswith((".", "__"))]
        if len(entries) == 1 and entries[0].is_dir() and not (source / "meta").exists():
            names = {d.name.lower() for d in _class_dirs(entries[0])}
            if names & {"train", "images", "meta", *VAL_NAMES, "test"} or len(names) >= 2:
                source = entries[0]
                continue
        break
    return source


def discover(source: Path) -> tuple[list[Sample], str]:
    source = _unwrap(source)

    # 1. Food-101 style
    meta, images = source / "meta", source / "images"
    if (meta / "train.txt").is_file() and images.is_dir():
        samples: list[Sample] = []
        for filename, split in (("train.txt", "train"), ("test.txt", "val")):
            listing = meta / filename
            if not listing.is_file():
                continue
            for line in listing.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line:
                    continue
                for suffix in (".jpg", ".jpeg", ".png", ".webp"):
                    candidate = images / f"{line}{suffix}"
                    if candidate.is_file():
                        samples.append(Sample(candidate, line.split("/")[0], split))
                        break
        return samples, "Food-101 style (images/ + meta/)"

    # 2. split folders
    lower = {d.name.lower(): d for d in _class_dirs(source)}
    if "train" in lower:
        val_dir = next((lower[n] for n in VAL_NAMES if n in lower), None) or lower.get("test")
        samples = []
        for split, root in (("train", lower["train"]), ("val", val_dir)):
            if root is None:
                continue
            for class_dir in _class_dirs(root):
                samples += [Sample(p, class_dir.name, split) for p in _images_in(class_dir)]
        return samples, "split folders (train/ and " + (f"{val_dir.name}/)" if val_dir else "no validation folder)")

    # 3. one folder per class
    samples = []
    for class_dir in _class_dirs(source):
        samples += [Sample(p, class_dir.name, None) for p in _images_in(class_dir)]
    return samples, "one folder per class"


def _describe(source: Path) -> str:
    """A short look at what is inside a folder, for error messages."""
    entries = [e for e in sorted(source.iterdir()) if not e.name.startswith(".")]
    folders = [e.name for e in entries if e.is_dir()]
    loose = [e.name for e in entries if e.is_file()]
    return f"{source} has {len(folders)} folders (first: {folders[:6]}) and {len(loose)} loose files (first: {loose[:6]})."


def _bucket(*parts: str) -> float:
    """A stable number in [0, 1) for a string, so splits and caps are the same on every run."""
    digest = hashlib.sha1(":".join(parts).encode("utf-8")).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


FORMAT_EXTENSIONS = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}


def _extension_for(path: Path, verify: bool) -> str | None:
    """
    The file extension the image should have, judged from its content (None = unreadable or an unsupported format).
    Training needs real extensions, and some datasets ship files with none.
    """
    if not verify and path.suffix.lower() in IMAGE_SUFFIXES:
        return ".jpg" if path.suffix.lower() == ".jpeg" else path.suffix.lower()
    try:
        with Image.open(path) as img:
            extension = FORMAT_EXTENSIONS.get(img.format or "")
            if extension is None:
                return None
            if verify:
                img.verify()
        return extension
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        return None


@dataclass
class Result:
    layout: str = ""
    counts: dict[str, dict[str, int]] = field(default_factory=dict)  # food id -> {"train": n, "val": n}
    skipped_unreadable: int = 0
    sample_checked: int = 0  # dry run only: how many images were opened as a spot check
    sample_unreadable: int = 0
    skipped_classes: list[str] = field(default_factory=list)
    todo: list[str] = field(default_factory=list)

    def total(self, split: str) -> int:
        return sum(c.get(split, 0) for c in self.counts.values())


def _place(src: Path, dst: Path, mode: str) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() or dst.is_symlink():
        return
    if mode == "symlink":
        os.symlink(src.resolve(), dst)
    elif mode == "hardlink":
        try:
            os.link(src, dst)
        except OSError:
            shutil.copy2(src, dst)  # different drive
    else:
        shutil.copy2(src, dst)


def prepare(
    source: Path,
    dest: Path,
    tag: str,
    class_map: dict[str, str | None] | None = None,
    only: set[str] | None = None,
    max_per_class: int | None = None,
    val_fraction: float = 0.1,
    mode: str = "copy",
    verify: bool = True,
    seed: int = 42,
    dry_run: bool = False,
    known_ids: set[str] | None = None,
    progress: Callable[[int, int], None] | None = None,
    progress_every: int = 1000,
) -> Result:
    if not source.is_dir():
        raise ValueError(f"{source} is not a folder")
    if not 0 < val_fraction < 0.5:
        raise ValueError("val_fraction must be between 0 and 0.5")
    tag = slugify(tag)
    class_map = class_map or {}
    result = Result()

    samples, result.layout = discover(source)
    if not samples:
        raise ValueError(
            "No images found. " + _describe(source) + " Point --source at the folder that holds one sub-folder per dish, "
            "with the images inside (files may have no extension)."
        )

    # class name -> food id (or None to skip)
    targets: dict[str, str | None] = {}
    for label in sorted({s.label for s in samples}):
        mapped = class_map[label] if label in class_map else class_map.get(slugify(label), label)
        target = slugify(mapped) if mapped else None
        if target is not None and only is not None and target not in only:
            target = None
        targets[label] = target
        if target is None:
            result.skipped_classes.append(label)

    grouped: dict[tuple[str, str | None], list[Sample]] = {}
    for s in samples:
        target = targets[s.label]
        if target is not None:
            grouped.setdefault((target, s.split), []).append(s)

    # Decide each image's split, then cap. Sorting by a hash keeps the choice reproducible.
    chosen: list[tuple[Sample, str, str]] = []  # (sample, food id, split)
    val_cap = None if max_per_class is None else max(1, round(max_per_class * val_fraction / (1 - val_fraction)))
    by_target: dict[str, list[Sample]] = {}
    for (target, _), group in grouped.items():
        by_target.setdefault(target, []).extend(group)

    for target, group in sorted(by_target.items()):
        train, val = [], []
        for s in group:
            key = str(s.path.relative_to(source)) if s.path.is_relative_to(source) else str(s.path)
            split = s.split or ("val" if _bucket(str(seed), tag, key) < val_fraction else "train")
            (val if split == "val" else train).append(s)
        order = lambda s: _bucket(str(seed), tag, "cap", s.path.name, str(s.path.parent))  # noqa: E731
        train, val = sorted(train, key=order), sorted(val, key=order)
        if max_per_class is not None:
            train, val = train[:max_per_class], val[:val_cap]
        chosen += [(s, target, "train") for s in train] + [(s, target, "val") for s in val]

    if dry_run:
        # A dry run must be quick: count everything, but only open a spread-out sample to spot-check the files.
        step = max(1, len(chosen) // 40)
        for s, target, split in chosen:
            result.counts.setdefault(target, {"train": 0, "val": 0})[split] += 1
        for s, _, _ in chosen[::step][:40]:
            result.sample_checked += 1
            if _extension_for(s.path, True) is None:
                result.sample_unreadable += 1
    else:
        for i, (s, target, split) in enumerate(chosen, start=1):
            if progress and i % progress_every == 0:
                progress(i, len(chosen))
            extension = _extension_for(s.path, verify)
            if extension is None:
                result.skipped_unreadable += 1
                continue
            counts = result.counts.setdefault(target, {"train": 0, "val": 0})
            counts[split] += 1
            name = f"{tag}_{hashlib.sha1(str(s.path).encode()).hexdigest()[:10]}{extension}"
            _place(s.path, dest / split / target / name, mode)
        if progress:
            progress(len(chosen), len(chosen))

    known = known_ids if known_ids is not None else known_food_ids()
    result.todo = sorted(t for t in result.counts if t not in known)

    if not dry_run:
        dest.mkdir(parents=True, exist_ok=True)
        _write_sources(dest, tag, source, result)
        _write_todo(dest, result.todo)
    return result


def _write_sources(dest: Path, tag: str, source: Path, result: Result) -> None:
    path = dest / "sources.json"
    data = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {}
    data[tag] = {
        "source": str(source),
        "layout": result.layout,
        "classes": len(result.counts),
        "train_images": result.total("train"),
        "val_images": result.total("val"),
        "prepared_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "licence_note": "Check this dataset's licence before using a model trained on it in a product.",
    }
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _write_todo(dest: Path, todo: list[str]) -> None:
    path = dest / "foods_todo.csv"
    if not todo:
        path.unlink(missing_ok=True)
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(TODO_HEADER)
        for food_id in todo:
            row = dict.fromkeys(TODO_HEADER, "")
            row.update(id=food_id, name=food_id.replace("-", " ").title(), reference_weight_g="100", kind="food")
            writer.writerow([row[c] for c in TODO_HEADER])


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--source", type=Path, required=True, help="the downloaded and unzipped dataset folder")
    p.add_argument("--tag", required=True, help="short name for this dataset, e.g. khana or food101")
    p.add_argument("--dest", type=Path, default=Path("ml/data"))
    p.add_argument("--class-map", type=Path, help="JSON {source class: food id or null}")
    p.add_argument("--only", help="comma-separated food ids to keep (all others are skipped)")
    p.add_argument("--only-file", type=Path, help="text file with one food id per line to keep")
    p.add_argument("--max-per-class", type=int, help="cap training images per class (also balances merged datasets)")
    p.add_argument("--val-fraction", type=float, default=0.1, help="share held out when the source has no split")
    p.add_argument("--mode", choices=("copy", "symlink", "hardlink"), default="copy", help="symlink saves disk space")
    p.add_argument("--no-verify", action="store_true", help="skip opening every image (faster, but bad files will crash training)")
    p.add_argument("--foods-csv", type=Path, help="foods CSV whose ids count as known nutrition data")
    p.add_argument("--db", action="store_true", help="also read known food ids from the configured database")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--dry-run", action="store_true", help="show what would happen without copying anything")
    args = p.parse_args()

    only = None
    if args.only:
        only = {slugify(x) for x in args.only.split(",") if x.strip()}
    if args.only_file:
        only = (only or set()) | {slugify(x) for x in args.only_file.read_text(encoding="utf-8").splitlines() if x.strip()}
    class_map = json.loads(args.class_map.read_text(encoding="utf-8")) if args.class_map else None

    def show_progress(done: int, total: int) -> None:
        print(f"\r  {'Checking and copying' if args.mode == 'copy' else 'Checking and linking'} images: {done:,} / {total:,}", end="", flush=True)
        if done == total:
            print()

    print("Looking through the dataset folder (this can take a minute for 100,000+ files)...", flush=True)
    try:
        result = prepare(
            args.source, args.dest, args.tag, class_map, only, args.max_per_class, args.val_fraction,
            args.mode, not args.no_verify, args.seed, args.dry_run, known_food_ids(args.foods_csv, args.db),
            progress=show_progress,
        )
    except ValueError as exc:
        sys.exit(f"Error: {exc}")

    print(f"Layout: {result.layout}")
    print(f"{'Would prepare' if args.dry_run else 'Prepared'} {len(result.counts)} classes: {result.total('train')} train, {result.total('val')} val images")
    if args.dry_run:
        print(f"Spot check: opened {result.sample_checked} sample images, {result.sample_unreadable} unreadable. (A dry run doesn't open every image.)")
        shown = sorted(result.counts.items())[:12]
        print("Classes found (first 12): " + ", ".join(f"{name} ({c['train'] + c['val']})" for name, c in shown) + (" ..." if len(result.counts) > 12 else ""))
    if result.skipped_unreadable:
        print(f"Skipped {result.skipped_unreadable} files that are not readable JPEG, PNG or WEBP images")
    if result.skipped_classes:
        print(f"Left out {len(result.skipped_classes)} classes: {', '.join(result.skipped_classes[:8])}{' ...' if len(result.skipped_classes) > 8 else ''}")
    if result.todo:
        where = "" if args.dry_run else f" Wrote {args.dest / 'foods_todo.csv'}: fill in its nutrition columns, then run `python -m app.db.import_foods`."
        print(f"{len(result.todo)} class{'es' if len(result.todo) != 1 else ''} without nutrition data yet.{where}")
    print("Next: python -m ml.check_dataset --data-dir " + str(args.dest))
    return 0


if __name__ == "__main__":
    sys.exit(main())