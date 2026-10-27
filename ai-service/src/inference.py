"""Realtime webcam → nhận diện từ → ghép câu (NLTK CFG).

    python -m src.inference --ckpt models/best_bilstm.pth
    python -m src.inference --threshold 0.8 --top-k 4
    python -m src.inference --tts

Phím:
    q  thoát
    c  xóa buffer từ
    s  ghép câu ngay (TTS nếu --tts)
    +  tăng threshold (+0.05)
    -  giảm threshold (-0.05)
"""
from __future__ import annotations
import argparse
import sys
import threading
import time
from collections import deque
from pathlib import Path

import cv2
import numpy as np
import torch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src import config as C
from src.model import build_model
from src.utils import extract_keypoints, normalize_sequence
from src.sentence_builder import polish as polish_sentence


def speak(text: str) -> None:
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.say(text)
        engine.runAndWait()
    except Exception as e:
        print(f"[tts] error: {e}")


def draw_text(frame, text, pos, color, scale=0.6, thickness=2):
    cv2.putText(frame, text, pos, cv2.FONT_HERSHEY_SIMPLEX, scale, color, thickness)


def open_camera(camera_index: int) -> cv2.VideoCapture | None:
    """Mở webcam trên Windows — ưu tiên DirectShow, warmup vài frame."""
    backends = [
        ("DSHOW", cv2.CAP_DSHOW),
        ("MSMF", cv2.CAP_MSMF),
        ("AUTO", 0),
    ]
    for name, api in backends:
        cap = cv2.VideoCapture(camera_index, api) if api else cv2.VideoCapture(camera_index)
        if not cap.isOpened():
            cap.release()
            continue
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        for _ in range(8):
            ret, _ = cap.read()
            if ret:
                print(f"[info] camera {camera_index} via {name} OK")
                return cap
        cap.release()
        print(f"[warn] camera {camera_index} opened ({name}) but cannot read frames")
    return None


def run(
    ckpt_path: str,
    camera_index: int,
    use_tts: bool,
    threshold: float,
    top_k: int,
) -> None:
    import mediapipe as mp
    mp_holistic = mp.solutions.holistic  # type: ignore[attr-defined]
    mp_drawing = mp.solutions.drawing_utils  # type: ignore[attr-defined]

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = torch.load(ckpt_path, map_location=device)
    classes: list[str] = ckpt["classes"]
    model_name: str = ckpt.get("model", "bilstm")

    model = build_model(model_name, num_classes=len(classes)).to(device)
    model.load_state_dict(ckpt["state_dict"])
    model.eval()
    print(f"[info] loaded {model_name}: {len(classes)} classes, val_top1={ckpt.get('val_top1','?')}")
    print(f"[info] threshold: {threshold:.2f}  (use +/- to adjust)")

    idle_sec = C.SENTENCE_IDLE_SECONDS
    print(
        f"[info] ghép câu (NLTK) sau {idle_sec:.0f}s không thêm từ + tay dừng "
        f"(phím s=ghép ngay)"
    )
    print("[info] q=quit  c=clear  s=build sentence  +/-=threshold")

    holistic = mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=C.MIN_DETECTION_CONFIDENCE,
        min_tracking_confidence=C.MIN_TRACKING_CONFIDENCE,
    )
    drawer = mp_drawing

    cap = open_camera(camera_index)
    if cap is None:
        print(f"[error] cannot open camera {camera_index}")
        print("[hint] đóng app đang dùng webcam (Zoom/Teams/Camera), thử --camera 1")
        return

    buffer: deque = deque(maxlen=C.NUM_FRAMES)
    prob_buffer: deque = deque(maxlen=C.SMOOTHING_FRAMES)
    sentence: list[str] = []
    last_word = None
    cooldown = 0
    last_append_time = 0.0
    motion_score = 0.0
    is_idle = True

    last_completed_sentence = ""
    last_completed_time = 0.0
    COMPLETED_DISPLAY_SEC = 8.0

    polish_state = {"running": False, "result_text": "", "result_source": ""}
    polish_lock = threading.Lock()

    def polish_worker(words: list[str], do_tts: bool):
        try:
            res = polish_sentence(words)
            text = res.text
            source = res.source
        except Exception as e:
            text = " ".join(words) + "."
            source = f"error: {type(e).__name__}"
        with polish_lock:
            polish_state["result_text"] = text
            polish_state["result_source"] = source
            polish_state["running"] = False
        if do_tts and text:
            speak(text)

    def trigger_flush(do_tts: bool, label: str):
        with polish_lock:
            if polish_state["running"] or not sentence:
                return
            polish_state["running"] = True
            polish_state["result_text"] = ""
        words_copy = list(sentence)
        sentence.clear()
        print(f"[{label} raw] {' '.join(words_copy)}")
        threading.Thread(
            target=polish_worker, args=(words_copy, do_tts), daemon=True
        ).start()

    fps_t = time.time()
    fps = 0.0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb.flags.writeable = False
        results = holistic.process(rgb)
        rgb.flags.writeable = True

        kp = extract_keypoints(results, keep_face=C.KEEP_FACE)
        buffer.append(kp)

        drawer.draw_landmarks(frame, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
        drawer.draw_landmarks(frame, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
        drawer.draw_landmarks(frame, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)

        pred_word = None
        conf_val = 0.0
        topk_str = ""

        if len(buffer) == C.NUM_FRAMES:
            seq_raw = np.stack(buffer, axis=0)

            hand_start = C.POSE_FEATURES
            hand_end = C.POSE_FEATURES + 2 * C.HAND_FEATURES
            hand_seq = seq_raw[:, hand_start:hand_end]
            nonzero_mask = (hand_seq.sum(axis=1) != 0)
            if nonzero_mask.sum() >= 3:
                motion_score = float(hand_seq[nonzero_mask].std(axis=0).mean())
            else:
                motion_score = 0.0
            is_idle = motion_score < C.MOTION_GATE_THRESHOLD

            if is_idle:
                prob_buffer.clear()
            else:
                seq = normalize_sequence(seq_raw)
                x = torch.from_numpy(seq).unsqueeze(0).to(device)
                with torch.no_grad():
                    logits = model(x)
                    prob = torch.softmax(logits, dim=1).cpu().numpy()[0]
                prob_buffer.append(prob)
                smooth_prob = np.mean(np.stack(prob_buffer, axis=0), axis=0)
                idx = int(smooth_prob.argmax())
                conf_val = float(smooth_prob[idx])
                pred_word = classes[idx]
                if top_k > 1:
                    tk_idx = np.argsort(-smooth_prob)[:top_k]
                    parts = [
                        f"{classes[int(i)]}({float(smooth_prob[i]):.2f})"
                        for i in tk_idx
                    ]
                    topk_str = " | ".join(parts)

                if (
                    conf_val >= threshold
                    and pred_word != last_word
                    and cooldown == 0
                ):
                    sentence.append(pred_word)
                    last_word = pred_word
                    last_append_time = time.time()
                    cooldown = C.INFERENCE_COOLDOWN_FRAMES
                    print(f"[word] {pred_word} ({conf_val:.2f})")

        if cooldown > 0:
            cooldown -= 1

        now = time.time()
        fps = 0.9 * fps + 0.1 * (1.0 / max(now - fps_t, 1e-6))
        fps_t = now

        h, w = frame.shape[:2]
        cv2.rectangle(frame, (0, 0), (w, 110), (0, 0, 0), -1)
        status_str = "IDLE" if is_idle else "MOTION"
        status_color = (100, 100, 255) if is_idle else (0, 255, 0)
        draw_text(
            frame,
            f"FPS:{fps:4.1f}  thr:{threshold:.2f}  [{status_str} {motion_score:.3f}]  "
            f"pred:{pred_word or '-'} ({conf_val:.2f})",
            (10, 25),
            status_color,
            0.55,
            2,
        )
        if topk_str:
            draw_text(
                frame, f"top-{top_k}: {topk_str[:90]}", (10, 50),
                (180, 220, 180), 0.45, 1,
            )

        building = " ".join(sentence) if sentence else "(empty)"
        if sentence and last_append_time > 0:
            silent = time.time() - last_append_time
            remain = max(0.0, idle_sec - silent)
            if remain > 0 or not is_idle:
                hint = f" (dừng {remain:.1f}s)" if remain > 0 else " (giữ tay yên...)"
            else:
                hint = " (đang ghép...)"
            building = f"{building}{hint}"
        draw_text(frame, f"BUFFER: {building[:85]}", (10, 80), (0, 255, 255), 0.5, 2)

        with polish_lock:
            polishing = polish_state["running"]
            if not polishing and polish_state["result_text"] \
                    and polish_state["result_text"] != last_completed_sentence:
                last_completed_sentence = polish_state["result_text"]
                last_completed_time = time.time()
                print(
                    f"[sentence] ({polish_state['result_source']}) "
                    f"{last_completed_sentence}"
                )
                polish_state["result_text"] = ""

        if last_completed_sentence and (time.time() - last_completed_time) < COMPLETED_DISPLAY_SEC:
            cv2.rectangle(frame, (0, h - 55), (w, h), (40, 40, 40), -1)
            draw_text(
                frame, f">> {last_completed_sentence[:90]}",
                (10, h - 20), (0, 255, 100), 0.65, 2,
            )
        elif polishing:
            cv2.rectangle(frame, (0, h - 55), (w, h), (40, 40, 40), -1)
            dots = "." * (int(time.time() * 2) % 4)
            draw_text(
                frame, f"... building sentence{dots}",
                (10, h - 20), (100, 200, 255), 0.65, 2,
            )

        cv2.imshow("SignDetect", frame)

        silent_long_enough = (
            last_append_time > 0
            and (time.time() - last_append_time) >= idle_sec
        )
        if sentence and silent_long_enough and is_idle:
            trigger_flush(do_tts=use_tts, label="auto")
            last_word = None
            last_append_time = 0.0

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        if key == ord("c"):
            sentence.clear()
            last_word = None
            last_append_time = 0.0
            print("[info] cleared buffer")
        if key == ord("s") and sentence:
            trigger_flush(do_tts=use_tts, label="manual")
            last_word = None
            last_append_time = 0.0
        if key in (ord("+"), ord("=")):
            threshold = min(0.99, threshold + 0.05)
            print(f"[threshold] {threshold:.2f}")
        if key in (ord("-"), ord("_")):
            threshold = max(0.05, threshold - 0.05)
            print(f"[threshold] {threshold:.2f}")

    cap.release()
    holistic.close()
    cv2.destroyAllWindows()


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--ckpt", default=str(C.MODELS_DIR / "best_bilstm.pth"))
    p.add_argument("--camera", type=int, default=0)
    p.add_argument("--tts", action="store_true", help="đọc câu bằng pyttsx3")
    p.add_argument(
        "--threshold",
        type=float,
        default=C.INFERENCE_CONF_THRESHOLD,
        help=f"confidence threshold (default {C.INFERENCE_CONF_THRESHOLD})",
    )
    p.add_argument("--top-k", type=int, default=3, help="top-K predictions")
    args = p.parse_args()
    run(args.ckpt, args.camera, args.tts, args.threshold, args.top_k)


if __name__ == "__main__":
    main()
