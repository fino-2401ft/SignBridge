"""PyTorch Dataset cho landmark .npy + augmentation."""
from __future__ import annotations
import math
import random
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset

from . import config as C


# Indices trong block để augment đúng phần xyz
def _xyz_slices():
    """Trả list (start, end, stride, dim_per_point) cho block xyz."""
    out = []
    pose_start = 0
    pose_end = C.POSE_FEATURES  # 33*4
    out.append(("pose", pose_start, pose_end, 4))
    lh_start = pose_end
    lh_end = lh_start + C.HAND_FEATURES
    out.append(("lh", lh_start, lh_end, 3))
    rh_start = lh_end
    rh_end = rh_start + C.HAND_FEATURES
    out.append(("rh", rh_start, rh_end, 3))
    return out


def _augment(seq: np.ndarray, train: bool = True) -> np.ndarray:
    """Augment landmark sequence (in-place safe — tự copy)."""
    if not train:
        return seq

    seq = seq.copy()

    # 1) Time shift: pad zeros + dịch
    shift = random.randint(-C.AUG_TIME_SHIFT_FRAMES, C.AUG_TIME_SHIFT_FRAMES)
    if shift != 0:
        T = seq.shape[0]
        if shift > 0:
            seq = np.concatenate([np.zeros_like(seq[:shift]), seq[:-shift]], axis=0)
        else:
            s = -shift
            seq = np.concatenate([seq[s:], np.zeros_like(seq[:s])], axis=0)
        assert seq.shape[0] == T

    # 2) Random rotation 2D (xoay landmark trên mặt phẳng xy)
    deg = random.uniform(-C.AUG_ROTATION_DEG, C.AUG_ROTATION_DEG)
    rad = math.radians(deg)
    cos, sin = math.cos(rad), math.sin(rad)
    # 3) Random scale
    scale = random.uniform(*C.AUG_SCALE_RANGE)

    for _, start, end, dim in _xyz_slices():
        block = seq[:, start:end].reshape(seq.shape[0], -1, dim)  # [T, N, dim]
        x = block[..., 0]
        y = block[..., 1]
        # Chỉ apply nếu point khác 0 (tránh xoay zero-pad mất ý nghĩa)
        mask = (block[..., :2].sum(axis=-1) != 0)
        new_x = x * cos - y * sin
        new_y = x * sin + y * cos
        block[..., 0] = np.where(mask, new_x * scale, 0.0)
        block[..., 1] = np.where(mask, new_y * scale, 0.0)
        if dim >= 3:
            block[..., 2] = np.where(mask, block[..., 2] * scale, block[..., 2])
        seq[:, start:end] = block.reshape(seq.shape[0], -1)

    # 4) Random translation — robust với vị trí trong frame
    if C.AUG_TRANSLATION > 0:
        tx = random.uniform(-C.AUG_TRANSLATION, C.AUG_TRANSLATION)
        ty = random.uniform(-C.AUG_TRANSLATION, C.AUG_TRANSLATION)
        for _, start, end, dim in _xyz_slices():
            block = seq[:, start:end].reshape(seq.shape[0], -1, dim)
            mask = (block[..., :2].sum(axis=-1) != 0)
            block[..., 0] = np.where(mask, block[..., 0] + tx, 0.0)
            block[..., 1] = np.where(mask, block[..., 1] + ty, 0.0)
            seq[:, start:end] = block.reshape(seq.shape[0], -1)

    # 5) Horizontal flip (đổi tay trái <-> phải)
    if random.random() < C.AUG_HORIZONTAL_FLIP_PROB:
        seq = _hflip(seq)

    # 6) Gaussian noise — robust với MediaPipe jitter
    if C.AUG_NOISE_STD > 0:
        for _, start, end, dim in _xyz_slices():
            block = seq[:, start:end].reshape(seq.shape[0], -1, dim)
            mask = (block[..., :2].sum(axis=-1) != 0)
            noise = np.random.randn(*block[..., :2].shape).astype(np.float32) * C.AUG_NOISE_STD
            block[..., 0] = np.where(mask, block[..., 0] + noise[..., 0], 0.0)
            block[..., 1] = np.where(mask, block[..., 1] + noise[..., 1], 0.0)
            seq[:, start:end] = block.reshape(seq.shape[0], -1)

    return seq


def _hflip(seq: np.ndarray) -> np.ndarray:
    """Lật ngang: x → -x, đồng thời swap left_hand <-> right_hand block."""
    seq = seq.copy()
    for _, start, end, dim in _xyz_slices():
        block = seq[:, start:end].reshape(seq.shape[0], -1, dim)
        block[..., 0] = -block[..., 0]
        seq[:, start:end] = block.reshape(seq.shape[0], -1)

    lh_start = C.POSE_FEATURES
    lh_end = lh_start + C.HAND_FEATURES
    rh_start = lh_end
    rh_end = rh_start + C.HAND_FEATURES
    lh = seq[:, lh_start:lh_end].copy()
    rh = seq[:, rh_start:rh_end].copy()
    seq[:, lh_start:lh_end] = rh
    seq[:, rh_start:rh_end] = lh
    return seq


class WLASLPoseDataset(Dataset):
    def __init__(
        self,
        csv_path: str | Path,
        processed_dir: str | Path = C.PROCESSED_DIR,
        train: bool = False,
    ):
        self.df = pd.read_csv(csv_path)
        self.processed_dir = Path(processed_dir)
        self.train = train

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, int]:
        row = self.df.iloc[idx]
        seq = np.load(self.processed_dir / row["npy_path"]).astype(np.float32)
        seq = _augment(seq, train=self.train)
        return torch.from_numpy(seq), int(row["label_idx"])
