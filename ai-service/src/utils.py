"""Helper: extract MediaPipe landmarks, normalize, sample frames."""
from __future__ import annotations
import numpy as np
import cv2

from . import config as C


# MediaPipe pose landmark indices (BlazePose 33-point)
POSE_LEFT_SHOULDER = 11
POSE_RIGHT_SHOULDER = 12
POSE_LEFT_HIP = 23
POSE_RIGHT_HIP = 24


def extract_keypoints(results, keep_face: bool = C.KEEP_FACE) -> np.ndarray:
    """Convert MediaPipe Holistic results → flat float32 vector.

    Schema (in order):
        pose (33*4) + left_hand (21*3) + right_hand (21*3) [+ face (468*3)]
    Missing landmarks → zeros.
    """
    if results.pose_landmarks:
        pose = np.array(
            [[lm.x, lm.y, lm.z, lm.visibility] for lm in results.pose_landmarks.landmark],
            dtype=np.float32,
        ).flatten()
    else:
        pose = np.zeros(C.POSE_FEATURES, dtype=np.float32)

    if results.left_hand_landmarks:
        lh = np.array(
            [[lm.x, lm.y, lm.z] for lm in results.left_hand_landmarks.landmark],
            dtype=np.float32,
        ).flatten()
    else:
        lh = np.zeros(C.HAND_FEATURES, dtype=np.float32)

    if results.right_hand_landmarks:
        rh = np.array(
            [[lm.x, lm.y, lm.z] for lm in results.right_hand_landmarks.landmark],
            dtype=np.float32,
        ).flatten()
    else:
        rh = np.zeros(C.HAND_FEATURES, dtype=np.float32)

    parts = [pose, lh, rh]
    if keep_face:
        if results.face_landmarks:
            face = np.array(
                [[lm.x, lm.y, lm.z] for lm in results.face_landmarks.landmark],
                dtype=np.float32,
            ).flatten()
        else:
            face = np.zeros(C.FACE_FEATURES, dtype=np.float32)
        parts.append(face)

    return np.concatenate(parts)


def normalize_sequence(seq: np.ndarray) -> np.ndarray:
    """Chuẩn hoá sequence để bất biến với vị trí + khoảng cách + góc camera.

    seq shape: [T, FEATURES_PER_FRAME]

    Improvements vs phiên bản trước:
      1. Center  = trung điểm tor-so (giữa shoulders+hips) — ổn định hơn
         midpoint vai khi người nghiêng/quay nhẹ.
      2. Scale   = torso length (mid-shoulder → mid-hip) — bất biến với góc nhìn,
         không bị foreshortened khi quay người (như shoulder distance).
      3. Stable scale: lấy median của torso length qua T frame thay vì per-frame
         → tránh jitter khi 1 vài frame có visibility thấp.
      4. Bỏ z (set z=0) — MediaPipe z không đáng tin trên camera 2D, gây nhiễu.
    """
    seq = seq.copy()
    pose_block = seq[:, : C.POSE_FEATURES].reshape(-1, 33, 4)  # [T, 33, 4]
    lh_block = seq[:, C.POSE_FEATURES : C.POSE_FEATURES + C.HAND_FEATURES].reshape(-1, 21, 3)
    rh_block = seq[
        :,
        C.POSE_FEATURES + C.HAND_FEATURES : C.POSE_FEATURES + 2 * C.HAND_FEATURES,
    ].reshape(-1, 21, 3)

    # Per-frame mid-shoulder & mid-hip
    ls = pose_block[:, POSE_LEFT_SHOULDER, :3]
    rs = pose_block[:, POSE_RIGHT_SHOULDER, :3]
    lh_pose = pose_block[:, POSE_LEFT_HIP, :3]
    rh_pose = pose_block[:, POSE_RIGHT_HIP, :3]
    mid_shoulder = (ls + rs) / 2.0  # [T, 3]
    mid_hip = (lh_pose + rh_pose) / 2.0

    # Torso center = trung điểm giữa mid_shoulder & mid_hip
    torso_center = (mid_shoulder + mid_hip) / 2.0  # [T, 3]

    # Per-frame torso length (mid_shoulder → mid_hip)
    torso_len = np.linalg.norm(mid_shoulder - mid_hip, axis=-1)  # [T]
    # Stable scale = median qua các frame (loại bỏ outlier)
    valid = torso_len > 1e-6
    if valid.any():
        stable_scale = float(np.median(torso_len[valid]))
    else:
        # Fallback: shoulder distance
        sh = np.linalg.norm(ls - rs, axis=-1)
        stable_scale = float(np.median(sh[sh > 1e-6])) if (sh > 1e-6).any() else 1.0
    stable_scale = max(stable_scale, 1e-6)

    # Pose: center về torso_center per-frame, chia stable_scale, bỏ z
    pose_xyz = pose_block[:, :, :3] - torso_center[:, None, :]
    pose_xyz = pose_xyz / stable_scale
    pose_xyz[..., 2] = 0.0  # bỏ z (unreliable)
    pose_block[:, :, :3] = pose_xyz
    # Visibility giữ nguyên (channel 3)

    # Hands: chỉ áp dụng nếu hand được detect (không phải zero-pad)
    for hand in (lh_block, rh_block):
        mask = (hand.sum(axis=(1, 2)) != 0)  # [T] — frame nào có hand
        if mask.any():
            hand[mask] = (hand[mask] - torso_center[mask, None, :]) / stable_scale
            hand[mask, :, 2] = 0.0  # bỏ z

    seq[:, : C.POSE_FEATURES] = pose_block.reshape(-1, C.POSE_FEATURES)
    seq[:, C.POSE_FEATURES : C.POSE_FEATURES + C.HAND_FEATURES] = lh_block.reshape(
        -1, C.HAND_FEATURES
    )
    seq[
        :,
        C.POSE_FEATURES + C.HAND_FEATURES : C.POSE_FEATURES + 2 * C.HAND_FEATURES,
    ] = rh_block.reshape(-1, C.HAND_FEATURES)

    return seq


def uniform_sample_indices(total_frames: int, num_frames: int = C.NUM_FRAMES) -> list[int]:
    """Lấy đều num_frames chỉ số từ [0, total_frames)."""
    if total_frames <= 0:
        return []
    if total_frames <= num_frames:
        return list(range(total_frames))
    return np.linspace(0, total_frames - 1, num_frames, dtype=int).tolist()


def pad_or_truncate(seq: np.ndarray, target_len: int = C.NUM_FRAMES) -> np.ndarray:
    """Pad zeros nếu ngắn, truncate đầu/đuôi đều nếu dài."""
    T = seq.shape[0]
    if T == target_len:
        return seq
    if T < target_len:
        pad = np.zeros((target_len - T, seq.shape[1]), dtype=seq.dtype)
        return np.concatenate([seq, pad], axis=0)
    # T > target_len: lấy đều
    indices = np.linspace(0, T - 1, target_len, dtype=int)
    return seq[indices]


def resize_keep_aspect(frame: np.ndarray, width: int = C.RESIZE_WIDTH) -> np.ndarray:
    h, w = frame.shape[:2]
    if w <= width:
        return frame
    new_h = int(h * width / w)
    return cv2.resize(frame, (width, new_h), interpolation=cv2.INTER_AREA)
