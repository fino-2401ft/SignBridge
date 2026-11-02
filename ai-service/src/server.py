import os
import sys
import base64
import json
import time
import asyncio
from collections import deque
from pathlib import Path

import cv2
import numpy as np
import torch
import mediapipe as mp
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

CURRENT_DIR = Path(__file__).resolve().parent
AI_SERVICE_ROOT = CURRENT_DIR.parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import config as C
from model import build_model
from utils import extract_keypoints, normalize_sequence
from sentence_builder import polish as polish_sentence

# Khởi tạo FastAPI
app = FastAPI(title="SignBridge Real-time AI Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thư mục chứa model
MODEL_PATH = AI_SERVICE_ROOT / "models" / "best_bilstm.pth"

# Load mô hình khi khởi tạo server
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[AI Server] Đang sử dụng thiết bị: {device}")

if not MODEL_PATH.exists():
    print(f"[AI Server ERROR] Không tìm thấy file checkpoint model tại {MODEL_PATH}")
    model = None
    classes = []
else:
    try:
        ckpt = torch.load(str(MODEL_PATH), map_location=device)
        classes = ckpt["classes"]
        model_name = ckpt.get("model", "bilstm")
        model = build_model(model_name, num_classes=len(classes)).to(device)
        model.load_state_dict(ckpt["state_dict"])
        model.eval()
        print(f"[AI Server] Nạp thành công mô hình {model_name} với {len(classes)} lớp nhận diện.")
    except Exception as e:
        print(f"[AI Server ERROR] Không thể load mô hình: {e}")
        model = None
        classes = []

# Khởi tạo MediaPipe Holistic
mp_holistic = mp.solutions.holistic
holistic_processor = mp_holistic.Holistic(
    static_image_mode=False,
    model_complexity=1,
    min_detection_confidence=C.MIN_DETECTION_CONFIDENCE,
    min_tracking_confidence=C.MIN_TRACKING_CONFIDENCE,
)

# Lưu giữ các task webcam PC đang chạy
pc_camera_tasks = {}

@app.get("/")
def read_root():
    return {
        "status": "online",
        "model_loaded": model is not None,
        "classes_count": len(classes),
        "device": str(device)
    }

def decode_base64_image(base64_str: str) -> np.ndarray:
    """Giải mã ảnh base64 gửi từ điện thoại sang numpy array (OpenCV format)"""
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    img_data = base64.b64decode(base64_str)
    nparr = np.frombuffer(img_data, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return frame

async def pc_camera_loop(websocket: WebSocket):
    """
    Đọc frame trực tiếp từ Webcam của PC chạy ở tốc độ 30 FPS.
    Giải pháp này giúp Demo mượt mà không có độ trễ do Wifi.
    """
    print("[AI Server] Khởi chạy luồng webcam PC...")
    # Ưu tiên mở bằng DSHOW trên Windows để lấy camera nhanh hơn
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap = cv2.VideoCapture(0)
        
    if not cap.isOpened():
        await websocket.send_json({"error": "Không thể mở webcam PC. Hãy tắt các ứng dụng đang dùng camera."})
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    buffer = deque(maxlen=C.NUM_FRAMES)
    prob_buffer = deque(maxlen=C.SMOOTHING_FRAMES)
    sentence = []
    last_word = None
    cooldown = 0
    last_append_time = 0.0
    is_idle = True

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                await asyncio.sleep(0.01)
                continue
                
            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = holistic_processor.process(rgb)
            rgb.flags.writeable = True

            kp = extract_keypoints(results, keep_face=C.KEEP_FACE)
            buffer.append(kp)

            pred_word = None
            conf_val = 0.0
            motion_score = 0.0

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

                    if (
                        conf_val >= C.INFERENCE_CONF_THRESHOLD
                        and pred_word != last_word
                        and cooldown == 0
                    ):
                        sentence.append(pred_word)
                        last_word = pred_word
                        last_append_time = time.time()
                        cooldown = C.INFERENCE_COOLDOWN_FRAMES
                        print(f"[PC Webcam AI] Từ: {pred_word} ({conf_val:.2f})")

            if cooldown > 0:
                cooldown -= 1

            finished_sentence = ""
            if sentence and is_idle and last_append_time > 0:
                silent_duration = time.time() - last_append_time
                if silent_duration >= C.SENTENCE_IDLE_SECONDS:
                    try:
                        polished = polish_sentence(sentence)
                        finished_sentence = polished.text
                        print(f"[PC Webcam AI] Câu: {finished_sentence}")
                    except Exception:
                        finished_sentence = " ".join(sentence) + "."
                    sentence.clear()
                    last_word = None
                    last_append_time = 0.0

            response = {
                "pred_word": pred_word,
                "confidence": conf_val,
                "motion_score": motion_score,
                "is_idle": is_idle,
                "current_buffer": " ".join(sentence),
                "finished_sentence": finished_sentence,
                "source": "pc_webcam"
            }
            await websocket.send_json(response)
            
            # Tần số quét 30 FPS ~ sleep 33ms. Trừ hao thời gian xử lý AI mất khoảng 20ms, nghỉ 10ms là vừa đẹp.
            await asyncio.sleep(0.01)
            
    except asyncio.CancelledError:
        print("[AI Server] Đã hủy tác vụ webcam PC.")
    finally:
        cap.release()
        print("[AI Server] Đã đóng camera webcam PC.")

@app.websocket("/ws/translate")
async def websocket_translate(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Client đã kết nối vào cổng /ws/translate")
    
    if model is None:
        await websocket.send_json({"error": "Mô hình AI chưa được tải trên server."})
        await websocket.close()
        return

    # Khởi tạo state nhận diện cho ảnh gửi từ điện thoại
    buffer = deque(maxlen=C.NUM_FRAMES)
    prob_buffer = deque(maxlen=C.SMOOTHING_FRAMES)
    sentence = []
    last_word = None
    cooldown = 0
    last_append_time = 0.0
    is_idle = True

    try:
        while True:
            data_text = await websocket.receive_text()
            payload = json.loads(data_text)
            
            command = payload.get("command")
            
            # Xử lý điều khiển Webcam PC
            if command == "start_pc_camera":
                if websocket in pc_camera_tasks:
                    pc_camera_tasks[websocket].cancel()
                pc_camera_tasks[websocket] = asyncio.create_task(pc_camera_loop(websocket))
                continue
            elif command == "stop_pc_camera":
                if websocket in pc_camera_tasks:
                    pc_camera_tasks[websocket].cancel()
                    del pc_camera_tasks[websocket]
                continue

            # Nhận ảnh từ điện thoại
            base64_image = payload.get("image")
            if not base64_image:
                continue

            frame = decode_base64_image(base64_image)
            if frame is None:
                continue

            # Xử lý qua MediaPipe
            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = holistic_processor.process(rgb)
            rgb.flags.writeable = True

            kp = extract_keypoints(results, keep_face=C.KEEP_FACE)
            buffer.append(kp)

            pred_word = None
            conf_val = 0.0
            motion_score = 0.0

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

                    if (
                        conf_val >= C.INFERENCE_CONF_THRESHOLD
                        and pred_word != last_word
                        and cooldown == 0
                    ):
                        sentence.append(pred_word)
                        last_word = pred_word
                        last_append_time = time.time()
                        cooldown = C.INFERENCE_COOLDOWN_FRAMES
                        print(f"[Mobile Webcam AI] Từ: {pred_word} ({conf_val:.2f})")

            if cooldown > 0:
                cooldown -= 1

            finished_sentence = ""
            if sentence and is_idle and last_append_time > 0:
                silent_duration = time.time() - last_append_time
                if silent_duration >= C.SENTENCE_IDLE_SECONDS:
                    try:
                        polished = polish_sentence(sentence)
                        finished_sentence = polished.text
                        print(f"[Mobile Webcam AI] Câu: {finished_sentence}")
                    except Exception:
                        finished_sentence = " ".join(sentence) + "."
                    sentence.clear()
                    last_word = None
                    last_append_time = 0.0

            response = {
                "pred_word": pred_word,
                "confidence": conf_val,
                "motion_score": motion_score,
                "is_idle": is_idle,
                "current_buffer": " ".join(sentence),
                "finished_sentence": finished_sentence,
                "source": "mobile"
            }
            await websocket.send_json(response)

    except WebSocketDisconnect:
        print("[WebSocket] Client ngắt kết nối.")
    except Exception as e:
        print(f"[WebSocket Error] Lỗi: {e}")
    finally:
        # Dọn dẹp task camera của connection này nếu có
        if websocket in pc_camera_tasks:
            pc_camera_tasks[websocket].cancel()
            del pc_camera_tasks[websocket]

@app.websocket("/ws/practice")
async def websocket_practice(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Client đã kết nối vào cổng /ws/practice")
    
    if model is None:
        await websocket.send_json({"error": "Mô hình AI chưa được tải trên server."})
        await websocket.close()
        return

    buffer = deque(maxlen=C.NUM_FRAMES)
    prob_buffer = deque(maxlen=C.SMOOTHING_FRAMES)

    try:
        while True:
            data_text = await websocket.receive_text()
            payload = json.loads(data_text)
            
            base64_image = payload.get("image")
            target_word = payload.get("target_word", "").lower()
            
            if not base64_image:
                continue

            frame = decode_base64_image(base64_image)
            if frame is None:
                continue

            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            rgb.flags.writeable = False
            results = holistic_processor.process(rgb)
            rgb.flags.writeable = True

            kp = extract_keypoints(results, keep_face=C.KEEP_FACE)
            buffer.append(kp)

            pred_word = None
            conf_val = 0.0
            motion_score = 0.0
            is_idle = True
            matched = False

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

                    if pred_word.lower() == target_word and conf_val >= C.INFERENCE_CONF_THRESHOLD:
                        matched = True

            response = {
                "pred_word": pred_word,
                "confidence": conf_val,
                "motion_score": motion_score,
                "is_idle": is_idle,
                "matched": matched
            }
            await websocket.send_json(response)

    except WebSocketDisconnect:
        print("[WebSocket Practice] Client ngắt kết nối.")
    except Exception as e:
        print(f"[WebSocket Practice Error] Lỗi: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
