"""Chia dts/<dataset>/train thành train/val/test (mặc định 80/10/10, stratified theo class).

    python -m src.split_dts
    python -m src.split_dts --dataset SignDetect_50 --train-ratio 0.7 --val-ratio 0.15 --reshuffle
"""
from __future__ import annotations

import argparse
import random
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src import config as C

VIDEO_GLOBS = ("*.mp4", "*.MP4", "*.mov", "*.MOV", "*.avi", "*.AVI")


def list_videos(cls_dir: Path) -> list[Path]:
    seen: set[str] = set()
    out: list[Path] = []
    for pattern in VIDEO_GLOBS:
        for p in cls_dir.glob(pattern):
            key = str(p).lower()
            if key in seen:
                continue
            seen.add(key)
            out.append(p)
    return sorted(out, key=lambda p: p.name.lower())


def split_counts(n: int, train_ratio: float, val_ratio: float) -> tuple[int, int, int]:
    n_val = round(n * val_ratio)
    n_test = round(n * (1.0 - train_ratio - val_ratio))
    n_train = n - n_val - n_test
    if n_train < 1 and n >= 1:
        n_train, n_val, n_test = 1, 0, 0
    return n_train, n_val, n_test


def collect_classes(root: Path) -> list[str]:
    names: set[str] = set()
    for split in C.SPLITS:
        split_dir = root / split
        if not split_dir.is_dir():
            continue
        for p in split_dir.iterdir():
            if p.is_dir():
                names.add(p.name)
    return sorted(names)


def merge_to_train(root: Path, dry_run: bool = False, only_classes: set[str] | None = None) -> int:
    """Gộp mọi video từ val/test về train (để chia lại tỷ lệ mới)."""
    moved = 0
    for split in ("val", "test"):
        split_dir = root / split
        if not split_dir.is_dir():
            continue
        for cls_dir in split_dir.iterdir():
            if not cls_dir.is_dir():
                continue
            if only_classes is not None and cls_dir.name not in only_classes:
                continue
            dest_dir = root / "train" / cls_dir.name
            for src in list_videos(cls_dir):
                dest = dest_dir / src.name
                if dry_run:
                    print(f"[dry-run] merge {src.relative_to(root)} -> train/{cls_dir.name}/{src.name}")
                else:
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(src), str(dest))
                moved += 1
    return moved


def split_dataset(
    dataset: str,
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    seed: int = C.SEED,
    dry_run: bool = False,
    reshuffle: bool = False,
    only_classes: list[str] | None = None,
) -> None:
    root = C.PROJECT_ROOT / "dts" / dataset
    train_dir = root / "train"
    if not train_dir.is_dir():
        raise FileNotFoundError(f"Missing {train_dir}")

    test_ratio = 1.0 - train_ratio - val_ratio
    if test_ratio < -1e-6:
        raise ValueError("train_ratio + val_ratio must be <= 1")

    class_filter = set(only_classes) if only_classes else None

    if reshuffle:
        n = merge_to_train(root, dry_run=dry_run, only_classes=class_filter)
        print(f"[info] merged {n} videos from val/test -> train")

    classes = collect_classes(root)
    if class_filter is not None:
        missing = class_filter - set(classes)
        if missing:
            raise RuntimeError(f"Classes not found in dataset: {sorted(missing)}")
        classes = [c for c in classes if c in class_filter]
    if not classes:
        raise RuntimeError(f"No class folders in {train_dir}")

    all_classes = collect_classes(root)
    processed = C.PROJECT_ROOT / "data" / "processed" / dataset
    classes_file = processed / "classes.txt"
    if not dry_run and class_filter is None:
        processed.mkdir(parents=True, exist_ok=True)
        classes_file.write_text("\n".join(all_classes) + "\n", encoding="utf-8")

    rng = random.Random(seed)
    totals = {"train": 0, "val": 0, "test": 0}

    scope = f"{len(classes)} class(es)" + (f" [{', '.join(classes)}]" if class_filter else "")
    print(f"[info] dataset={dataset}  split={scope}  ratios={train_ratio:.0%}/{val_ratio:.0%}/{test_ratio:.0%}  seed={seed}")
    if class_filter is None:
        print(f"[info] classes.txt -> {classes_file.relative_to(C.PROJECT_ROOT)}")

    for cls in classes:
        src_dir = train_dir / cls
        videos = list_videos(src_dir)
        if not videos:
            print(f"[warn] {cls}: no videos, skip")
            continue

        rng.shuffle(videos)
        n_train, n_val, n_test = split_counts(len(videos), train_ratio, val_ratio)
        parts = (
            ("train", videos[:n_train]),
            ("val", videos[n_train : n_train + n_val]),
            ("test", videos[n_train + n_val :]),
        )

        for split, files in parts:
            dest_dir = root / split / cls
            for src in files:
                dest = dest_dir / src.name
                if src.resolve() == dest.resolve():
                    totals[split] += 1
                    continue
                if dest.is_file():
                    raise FileExistsError(f"Already exists: {dest}")
                if dry_run:
                    print(f"[dry-run] {src.relative_to(root)} -> {split}/{cls}/{src.name}")
                else:
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(src), str(dest))
                totals[split] += 1

        print(f"  {cls}: {n_train}/{n_val}/{n_test} (total {len(videos)})")

    print(f"\n[done] train={totals['train']}  val={totals['val']}  test={totals['test']}")
    if dry_run:
        print("[info] dry-run only — no files moved")


def main() -> None:
    p = argparse.ArgumentParser(description="Split dts train folder into train/val/test")
    p.add_argument("--dataset", default=C.DATASET_NAME)
    p.add_argument("--train-ratio", type=float, default=0.8)
    p.add_argument("--val-ratio", type=float, default=0.1)
    p.add_argument("--seed", type=int, default=C.SEED)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument(
        "--reshuffle",
        action="store_true",
        help="Gộp val/test về train trước khi chia lại (dùng khi đổi tỷ lệ)",
    )
    p.add_argument(
        "--classes",
        nargs="+",
        default=None,
        help="Chỉ chia các class này (vd: home food friend at with and)",
    )
    args = p.parse_args()
    split_dataset(
        args.dataset,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        seed=args.seed,
        dry_run=args.dry_run,
        reshuffle=args.reshuffle,
        only_classes=args.classes,
    )


if __name__ == "__main__":
    main()
