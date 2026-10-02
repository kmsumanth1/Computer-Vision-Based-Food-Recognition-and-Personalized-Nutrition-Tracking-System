"""
Suggests a --class-map for a dataset whose classes are numbered varieties of the same food
(Fruits-360 style: "Apple 10", "Apple 11", "Grape White 2", "Cherry Rainier"...).

    python -m ml.suggest_class_map --source "C:/path/to/fruits-360_100x100" --out ml/fruits360_map.json

It strips a trailing standalone number (optionally followed by one letter, e.g. "Plum 3a") from each
class name and groups classes that reduce to the same base name. Names with no trailing number, like
"Cherry Rainier" or "Walnut", are left mapped to themselves (untouched, one class each).

This is a starting point, not a final answer: open the JSON afterwards and check it merged sensibly.
Two classes that don't actually look alike (say, "Pepper Red" and "Pepper Green" if the dataset ever
named them that way) would wrongly become one "pepper" class if both matched the pattern; in practice
Fruits-360's varieties are almost always just numbered, so this works well for it.
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

from ml.prepare_dataset import discover, slugify

# Trailing " 10", " 3a", "-12", "_7" etc. Anchored to the end so "Cherry Wax Yellow" (no trailing number) is untouched.
_TRAILING_NUMBER = re.compile(r"[\s_-]+\d+[a-zA-Z]?$")


def strip_variety_number(label: str) -> str:
    base = _TRAILING_NUMBER.sub("", label).strip()
    return base or label


def suggest(source: Path) -> tuple[dict[str, str], dict[str, list[str]]]:
    """Returns (class_map for --class-map, {merged food id: [original class names]} for review)."""
    samples, _ = discover(source)
    labels = sorted({s.label for s in samples})

    class_map: dict[str, str] = {}
    groups: dict[str, list[str]] = defaultdict(list)
    for label in labels:
        merged_id = slugify(strip_variety_number(label))
        class_map[label] = merged_id
        groups[merged_id].append(label)
    return class_map, dict(sorted(groups.items()))


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--source", type=Path, required=True, help="the dataset folder (same one you'd pass to prepare_dataset)")
    p.add_argument("--out", type=Path, default=Path("class_map.json"))
    args = p.parse_args()

    try:
        class_map, groups = suggest(args.source)
    except ValueError as exc:
        sys.exit(f"Error: {exc}")

    args.out.write_text(json.dumps(class_map, indent=2, ensure_ascii=False), encoding="utf-8")

    merged = {k: v for k, v in groups.items() if len(v) > 1}
    single = {k: v for k, v in groups.items() if len(v) == 1}
    print(f"{len(class_map)} original classes -> {len(groups)} merged classes ({len(merged)} are groups of 2+, {len(single)} unchanged)")
    print(f"Wrote {args.out}\n")
    print("Merged groups (check these look right):")
    for food_id, originals in sorted(merged.items(), key=lambda kv: -len(kv[1]))[:25]:
        print(f"  {food_id:<20} <- {', '.join(originals[:6])}{' ...' if len(originals) > 6 else ''}  ({len(originals)})")
    if len(merged) > 25:
        print(f"  ... and {len(merged) - 25} more groups. Open {args.out} to see everything.")
    return 0


if __name__ == "__main__":
    sys.exit(main())