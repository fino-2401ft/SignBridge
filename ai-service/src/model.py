"""Models: BiLSTM (default) và Transformer encoder."""
from __future__ import annotations
import torch
import torch.nn as nn

from . import config as C


class SignBiLSTM(nn.Module):
    """Baseline: 2-layer BiLSTM + mean pooling + Linear. ~0.5M params."""

    def __init__(
        self,
        input_size: int = C.FEATURES_PER_FRAME,
        hidden: int = C.HIDDEN_SIZE,
        num_layers: int = C.LSTM_LAYERS,
        num_classes: int = 100,
        dropout: float = C.DROPOUT,
    ):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.norm = nn.LayerNorm(hidden * 2)
        self.head = nn.Sequential(
            nn.Linear(hidden * 2, hidden),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(hidden, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [B, T, F]
        out, _ = self.lstm(x)            # [B, T, 2H]
        out = out.mean(dim=1)            # [B, 2H] — temporal mean pool
        out = self.norm(out)
        return self.head(out)


class SignTransformer(nn.Module):
    """Light Transformer encoder. Dùng nếu BiLSTM underfit."""

    def __init__(
        self,
        input_size: int = C.FEATURES_PER_FRAME,
        d_model: int = 192,
        nhead: int = 4,
        num_layers: int = 3,
        num_classes: int = 100,
        dropout: float = C.DROPOUT,
        max_len: int = 64,
    ):
        super().__init__()
        self.input_proj = nn.Linear(input_size, d_model)
        self.pos = nn.Parameter(torch.zeros(1, max_len, d_model))
        nn.init.trunc_normal_(self.pos, std=0.02)

        layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=d_model * 4,
            dropout=dropout,
            activation="gelu",
            batch_first=True,
            norm_first=True,
        )
        self.encoder = nn.TransformerEncoder(layer, num_layers=num_layers)
        self.norm = nn.LayerNorm(d_model)
        self.head = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [B, T, F]
        x = self.input_proj(x)
        T = x.size(1)
        x = x + self.pos[:, :T]
        x = self.encoder(x)
        x = self.norm(x.mean(dim=1))
        return self.head(x)


def build_model(name: str, num_classes: int) -> nn.Module:
    name = name.lower()
    if name == "bilstm":
        return SignBiLSTM(num_classes=num_classes)
    if name == "transformer":
        return SignTransformer(num_classes=num_classes)
    raise ValueError(f"unknown model: {name}")
