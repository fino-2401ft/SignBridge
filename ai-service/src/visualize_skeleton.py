"""Extract MediaPipe keypoints từ 1 video và render skeleton để xem trực quan.

Cách dùng:
    python -m src.visualize_skeleton --input path/to/video.mp4 --output skeleton_grid.png
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src import config as C


def render_skeleton(frame, results, mp_holistic, mp_drawing) -> np.ndarray:
    """Vẽ skeleton lên canvas đen (giống style WLASL pose).

    Trả về 2 hình ghép ngang: original | skeleton-on-black
    """
    h, w = frame.shape[:2]
    black = np.zeros_like(frame)

    spec_pose = mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=3, circle_radius=4)
    spec_pose_conn = mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=2)
    spec_hand = mp_drawing.DrawingSpec(color=(0, 255, 255), thickness=2, circle_radius=3)
    spec_hand_conn = mp_drawing.DrawingSpec(color=(200, 200, 200), thickness=2)

    if results.pose_landmarks:
        mp_drawing.draw_landmarks(
            black, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS,
            spec_pose, spec_pose_conn,
        )
    if results.left_hand_landmarks:
        mp_drawing.draw_landmarks(
            black, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
            spec_hand, spec_hand_conn,
        )
    if results.right_hand_landmarks:
        mp_drawing.draw_landmarks(
            black, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS,
            spec_hand, spec_hand_conn,
        )

    # Annotate stats
    stats = [
        f"pose: {'YES' if results.pose_landmarks else 'no'}",
        f"L-hand: {'YES' if results.left_hand_landmarks else 'no'}",
        f"R-hand: {'YES' if results.right_hand_landmarks else 'no'}",
    ]
    for i, s in enumerate(stats):
        cv2.putText(black, s, (10, 30 + i * 22),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

    return np.hstack([frame, black])


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="path to video.mp4")
    p.add_argument("--output", default="skeleton_grid.png",
                   help="output PNG file (grid of frames)")
    p.add_argument("--num-frames", type=int, default=6,
                   help="số frame mẫu để hiển thị (default 6)")
    args = p.parse_args()

    import mediapipe as mp
    mp_holistic = mp.solutions.holistic
    mp_drawing = mp.solutions.drawing_utils

    video_path = Path(args.input)
    if not video_path.exists():
        print(f"[error] video not found: {video_path}")
        return

    cap = cv2.VideoCapture(str(video_path))
    cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)  # Tự rotate iPhone .MOV theo EXIF
    n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"[info] video: {video_path.name}")
    print(f"[info] frames={n_frames}, fps={fps:.1f}, size={w}x{h}, "
          f"duration={n_frames/max(fps,1):.2f}s")

    indices = np.linspace(0, n_frames - 1, args.num_frames, dtype=int)
    print(f"[info] sampling frames at: {indices.tolist()}")

    rendered = []
    with mp_holistic.Holistic(
        min_detection_confidence=C.MIN_DETECTION_CONFIDENCE,
        min_tracking_confidence=C.MIN_TRACKING_CONFIDENCE,
        model_complexity=1,
    ) as holistic:
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ret, frame = cap.read()
            if not ret:
                continue
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = holistic.process(rgb)

            combined = render_skeleton(frame, results, mp_holistic, mp_drawing)
            label = f"frame {idx}"
            cv2.putText(combined, label, (10, combined.shape[0] - 15),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            rendered.append(combined)

    cap.release()

    if not rendered:
        print("[error] no frames rendered")
        return

    # Ghép thành grid: 2 cột × ceil(N/2) hàng
    n = len(rendered)
    cols = 2
    rows = (n + cols - 1) // cols
    cell_h, cell_w = rendered[0].shape[:2]
    grid = np.zeros((rows * cell_h, cols * cell_w, 3), dtype=np.uint8)
    for i, img in enumerate(rendered):
        r, c = i // cols, i % cols
        grid[r * cell_h:(r + 1) * cell_h, c * cell_w:(c + 1) * cell_w] = img

    output_path = Path(args.output)
    cv2.imwrite(str(output_path), grid)
    print(f"[done] saved: {output_path.resolve()}")
    print(f"[info] grid: {rows}x{cols} = {n} frames | size: {grid.shape[1]}x{grid.shape[0]}")


if __name__ == "__main__":
    main()
