"""Tập trung mọi hyperparameter và path. Sửa file này thay vì sửa rải rác."""
from pathlib import Path

# ---------- Paths ----------
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Switch dataset bằng cách đổi DATASET_NAME — folder data/processed/<DATASET_NAME>
# tách biệt nên có thể giữ cache .npy của cả 2 dataset.
DATASET_NAME = "SignDetect_50"  # 50 class target. Phase 1: train 4 class (i, you, he, they).

RAW_DATA_DIR = PROJECT_ROOT / "dts" / DATASET_NAME
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed" / DATASET_NAME
MODELS_DIR = PROJECT_ROOT / "models"
CLASSES_FILE = PROCESSED_DIR / "classes.txt"

SPLITS = ["train", "val", "test"]

# ---------- Preprocess ----------
NUM_FRAMES = 30
KEEP_FACE = False  # WLASL100 word-level + chỉ ~10 video/class → face landmarks gây overfit, không tăng accuracy
RESIZE_WIDTH = 480
MIN_DETECTION_CONFIDENCE = 0.5
MIN_TRACKING_CONFIDENCE = 0.5
NUM_WORKERS_PREPROCESS = 3  # 6 worker × MediaPipe ~1.5GB → OOM trên 16GB RAM. 3 worker an toàn.

# Số features mỗi frame:
#   pose 33 * 4 (x,y,z,visibility) = 132
#   left  hand 21 * 3 = 63
#   right hand 21 * 3 = 63
#   face 468 * 3 = 1404 (nếu KEEP_FACE=True)
POSE_FEATURES = 33 * 4
HAND_FEATURES = 21 * 3
FACE_FEATURES = 468 * 3
FEATURES_PER_FRAME = POSE_FEATURES + 2 * HAND_FEATURES + (FACE_FEATURES if KEEP_FACE else 0)

# ---------- Training ----------
BATCH_SIZE = 32
EPOCHS = 80
LR = 1e-3
WEIGHT_DECAY = 1e-4
DROPOUT = 0.3
HIDDEN_SIZE = 128
LSTM_LAYERS = 2
LABEL_SMOOTHING = 0.1
EARLY_STOP_PATIENCE = 15
SEED = 42

# ---------- Augmentation ----------
AUG_ROTATION_DEG = 20.0          # ±20° (rộng hơn) — robust với head/body tilt
AUG_SCALE_RANGE = (0.6, 1.5)     # rộng hơn — robust với distance camera 40-150cm
AUG_HORIZONTAL_FLIP_PROB = 0.5
AUG_TIME_SHIFT_FRAMES = 4
AUG_TRANSLATION = 0.15           # ±15% torso unit — robust với vị trí trong frame
AUG_NOISE_STD = 0.01             # gaussian noise tiny — robust với jitter MediaPipe

# ---------- Inference ----------
INFERENCE_CONF_THRESHOLD = 0.8
INFERENCE_COOLDOWN_FRAMES = 15
# Chỉ ghép câu (NLTK) sau khi không thêm từ mới đủ N giây VÀ tay đứng yên
SENTENCE_IDLE_SECONDS = 3.0
# Motion gate: skip predict khi tay đứng yên (std của hand landmarks qua NUM_FRAMES)
# Hand x,y normalized 0..1. Threshold 0.015 = ~1.5% frame width → đứng yên thật sự
MOTION_GATE_THRESHOLD = 0.015
# Smooth softmax qua N frame gần nhất → giảm jitter, ổn định confidence
SMOOTHING_FRAMES = 5

# ---------- Modality (face + head) ----------
MODALITY_CLASSES = ["statement", "question", "negation", "emphasis"]
MODALITY_DATA_DIR = PROJECT_ROOT / "dts" / "modality"
MODALITY_PROCESSED_DIR = PROCESSED_DIR / "modality"
MODALITY_CLIP_DURATION_S = 2.0
MODALITY_TARGET_PER_CLASS = 30
MODALITY_HIDDEN_SIZE = 64
MODALITY_EPOCHS = 50
MODALITY_BATCH_SIZE = 16
MODALITY_LR = 1e-3
MODALITY_CONF_THRESHOLD = 0.6  # thấp hơn word vì 4 classĐượ

# Indices của face landmark quan trọng cho modality (môi + lông mày + mắt)
# Tham chiếu MediaPipe Face Mesh: https://github.com/google/mediapipe/blob/master/mediapipe/python/solutions/face_mesh_connections.py
EXPRESSIVE_FACE_INDICES = [
    # Lông mày trái (4 điểm)
    63, 105, 66, 107,
    # Lông mày phải (4 điểm)
    293, 334, 296, 336,
    # Mắt trái — mí trên/dưới (6 điểm)
    33, 160, 158, 133, 153, 144,
    # Mắt phải (6 điểm)
    362, 385, 387, 263, 373, 380,
    # Môi ngoài (12 điểm)
    61, 39, 0, 269, 291, 405, 17, 181, 84, 314, 405, 321,
    # Môi trong (8 điểm)
    78, 81, 13, 311, 308, 402, 14, 178,
]
# Indices của pose landmark cho head/shoulder (để detect head shake/nod)
HEAD_POSE_INDICES = [0, 1, 2, 4, 5, 6, 9, 10, 11, 12]  # nose, eyes, ears, shoulders
