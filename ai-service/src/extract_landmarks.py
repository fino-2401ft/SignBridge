"""Preprocess dataset MP4 → MediaPipe landmarks .npy.

Chạy 1 lần. Multiprocess trên i5-12500H (~30-60 phút tùy số video).

    python -m src.extract_landmarks

Output (dưới data/processed/<DATASET_NAME>/):
    <split>/<class>/<id>.npy   (shape [NUM_FRAMES, FEATURES_PER_FRAME])
    classes.txt
    <split>.csv  (id, class, label_idx, npy_path)
"""
from __future__ import annotations
import os
import sys
import csv
from pathlib import Path
from multiprocessing import Pool, cpu_count

import cv2
import numpy as np
from tqdm import tqdm

# Allow `python src/extract_landmarks.py` and `python -m src.extract_landmarks`
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src import config as C
from src.utils import (
    extract_keypoints,
    normalize_sequence,
    uniform_sample_indices,
    pad_or_truncate,
    resize_keep_aspect,
)


def _process_one(args: tuple[Path, Path, bool]) -> tuple[Path, bool, str]:
    """Worker: 1 video → 1 .npy. Trả (output_path, ok, message)."""
    # Lazy import — MediaPipe không pickle-friendly nên init trong worker
    import mediapipe as mp

    video_path, output_path, force = args
    if output_path.exists() and not force:
        return output_path, True, "skip (exists)"

    cap = cv2.VideoCapture(str(video_path))
    cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)  # Tự rotate iPhone .MOV theo EXIF
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total <= 0:
        cap.release()
        return output_path, False, "empty video"

    indices = uniform_sample_indices(total, C.NUM_FRAMES)
    indices_set = set(indices)

    holistic = mp.solutions.holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=C.MIN_DETECTION_CONFIDENCE,
        min_tracking_confidence=C.MIN_TRACKING_CONFIDENCE,
    )

    seq = []
    frame_idx = 0
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx in indices_set:
                frame = resize_keep_aspect(frame, C.RESIZE_WIDTH)
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                rgb.flags.writeable = False
                results = holistic.process(rgb)
                seq.append(extract_keypoints(results, keep_face=C.KEEP_FACE))
            frame_idx += 1
    finally:
        cap.release()
        holistic.close()

    if len(seq) == 0:
        return output_path, False, "no frames extracted"

    arr = np.stack(seq, axis=0).astype(np.float32)  # [T, FEATURES]
    arr = pad_or_truncate(arr, C.NUM_FRAMES)
    arr = normalize_sequence(arr)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    np.save(output_path, arr)
    return output_path, True, "ok"


def _discover_classes() -> list[str]:
    """Lấy danh sách class từ mọi split trong dts (nguồn đúng nhất)."""
    names: set[str] = set()
    for split in C.SPLITS:
        split_dir = C.RAW_DATA_DIR / split
        if not split_dir.is_dir():
            continue
        for p in split_dir.iterdir():
            if p.is_dir():
                names.add(p.name)
    return sorted(names)


def collect_jobs(only_classes: set[str] | None = None) -> tuple[list[str], list[tuple[Path, Path, str, str]]]:
    """Đi qua dts/<dataset>, build danh sách (video, output, split, class)."""
    class_order = _discover_classes()
    if only_classes is not None:
        class_order = [c for c in class_order if c in only_classes]
        if not class_order:
            class_order = sorted(only_classes)
    jobs = []
    found: set[str] = set()
    for split in C.SPLITS:
        split_dir = C.RAW_DATA_DIR / split
        if not split_dir.exists():
            print(f"[warn] missing split: {split_dir}")
            continue
        for cls in class_order:
            cls_dir = split_dir / cls
            if not cls_dir.exists():
                continue
            # Match nhiều extension: .mp4 .MP4 .mov .MOV (iPhone)
            video_files = []
            for ext in ("*.mp4", "*.MP4", "*.mov", "*.MOV", "*.avi", "*.AVI"):
                video_files.extend(cls_dir.glob(ext))
            # Loại trùng lặp (do glob case có thể double-match trên Windows)
            seen = set()
            for v in video_files:
                key = str(v).lower()
                if key in seen:
                    continue
                seen.add(key)
                out = C.PROCESSED_DIR / split / cls / f"{v.stem}.npy"
                jobs.append((v, out, split, cls))
                found.add(cls)
    classes = [c for c in class_order if c in found]
    return classes, jobs


def write_classes(classes: list[str]) -> None:
    C.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    with open(C.CLASSES_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(classes))


def write_csvs(classes: list[str], jobs: list[tuple[Path, Path, str, str]]) -> None:
    cls_to_idx = {c: i for i, c in enumerate(classes)}
    by_split: dict[str, list[tuple]] = {s: [] for s in C.SPLITS}
    for mp4, out, split, cls in jobs:
        if not out.exists():
            continue  # skip files that failed
        rel = out.relative_to(C.PROCESSED_DIR).as_posix()
        by_split[split].append((mp4.stem, cls, cls_to_idx[cls], rel))

    for split, rows in by_split.items():
        if not rows:
            continue
        csv_path = C.PROCESSED_DIR / f"{split}.csv"
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["id", "class", "label_idx", "npy_path"])
            w.writerows(rows)
        print(f"  {split}.csv: {len(rows)} rows")


def main() -> None:
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--classes", nargs="+", default=None, help="Chỉ extract các class này")
    p.add_argument("--force", action="store_true", help="Ghi đè .npy đã có")
    p.add_argument("--csv-only", action="store_true", help="Chỉ cập nhật classes.txt + CSV")
    args = p.parse_args()

    only = set(args.classes) if args.classes else None

    print(f"[info] CPU cores: {cpu_count()}, workers: {C.NUM_WORKERS_PREPROCESS}")
    print(f"[info] features/frame: {C.FEATURES_PER_FRAME}, frames: {C.NUM_FRAMES}")

    # Luôn quét toàn bộ dataset để cập nhật classes.txt / CSV đúng 28 class
    all_classes, all_jobs = collect_jobs(only_classes=None)
    if only is not None:
        extract_jobs = [(a, b, s, c) for a, b, s, c in all_jobs if c in only]
        print(f"[info] extract subset: {len(extract_jobs)} videos ({', '.join(sorted(only))})")
    else:
        extract_jobs = all_jobs

    print(f"[info] dataset: {len(all_classes)} classes, {len(all_jobs)} videos total")
    write_classes(all_classes)

    if args.csv_only:
        print("[info] writing csv splits...")
        write_csvs(all_classes, all_jobs)
        print("[done] csv-only complete.")
        return

    pool_args = [(mp4, out, args.force) for (mp4, out, _, _) in extract_jobs]
    ok_count = 0
    fail_count = 0
    fails: list[tuple[str, str]] = []

    with Pool(processes=C.NUM_WORKERS_PREPROCESS) as pool:
        for out_path, ok, msg in tqdm(
            pool.imap_unordered(_process_one, pool_args), total=len(pool_args), desc="extract"
        ):
            if ok:
                ok_count += 1
            else:
                fail_count += 1
                fails.append((str(out_path), msg))

    print(f"[done] ok={ok_count}, fail={fail_count}")
    for pth, m in fails[:10]:
        print(f"  fail: {pth} ({m})")

    print("[info] writing csv splits...")
    write_csvs(all_classes, all_jobs)
    print("[done] preprocess complete.")


if __name__ == "__main__":
    main()
