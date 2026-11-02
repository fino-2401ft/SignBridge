"""Training loop với AMP (fp16) và early stopping cho GTX 1650 4GB.

    python -m src.train --model bilstm --epochs 80
"""
from __future__ import annotations
import argparse
import json
import random
import sys
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src import config as C
from src.dataset import WLASLPoseDataset
from src.model import build_model


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def load_classes() -> list[str]:
    return C.CLASSES_FILE.read_text(encoding="utf-8").strip().splitlines()


def make_loaders(batch_size: int, num_workers: int):
    train_ds = WLASLPoseDataset(C.PROCESSED_DIR / "train.csv", train=True)
    val_ds = WLASLPoseDataset(C.PROCESSED_DIR / "val.csv", train=False)
    test_ds = WLASLPoseDataset(C.PROCESSED_DIR / "test.csv", train=False)
    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
        persistent_workers=num_workers > 0,
        drop_last=True,
    )
    val_loader = DataLoader(val_ds, batch_size=batch_size, num_workers=num_workers, pin_memory=True)
    test_loader = DataLoader(test_ds, batch_size=batch_size, num_workers=num_workers, pin_memory=True)
    return train_loader, val_loader, test_loader


@torch.no_grad()
def evaluate(model, loader, device, num_classes: int) -> tuple[float, float]:
    model.eval()
    k = min(5, num_classes)
    correct = topk = total = 0
    for x, y in loader:
        x = x.to(device, non_blocking=True)
        y = y.to(device, non_blocking=True)
        logits = model(x)
        pred = logits.argmax(dim=1)
        correct += (pred == y).sum().item()
        if k > 1:
            topk += (logits.topk(k, dim=1).indices == y.unsqueeze(1)).any(dim=1).sum().item()
        else:
            topk += correct
        total += y.size(0)
    return correct / max(total, 1), topk / max(total, 1)


def train(args) -> None:
    set_seed(C.SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[info] device: {device}")
    if device.type == "cuda":
        print(f"[info] GPU: {torch.cuda.get_device_name(0)}")

    classes = load_classes()
    num_classes = len(classes)
    print(f"[info] num_classes: {num_classes}")

    train_loader, val_loader, test_loader = make_loaders(args.batch_size, args.num_workers)
    print(f"[info] train batches: {len(train_loader)}, val: {len(val_loader)}, test: {len(test_loader)}")

    model = build_model(args.model, num_classes=num_classes).to(device)
    n_params = sum(p.numel() for p in model.parameters())
    print(f"[info] model: {args.model}, params: {n_params/1e6:.2f}M")

    optim = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=C.WEIGHT_DECAY)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(optim, T_max=args.epochs)
    criterion = nn.CrossEntropyLoss(label_smoothing=C.LABEL_SMOOTHING)
    use_amp = device.type == "cuda"
    # torch.amp (>=2.3) hợp nhất API; fallback torch.cuda.amp cho bản cũ (2.2.x)
    try:
        scaler = torch.amp.GradScaler("cuda", enabled=use_amp)
    except (AttributeError, TypeError):
        scaler = torch.cuda.amp.GradScaler(enabled=use_amp)

    C.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    best_val = 0.0
    patience = 0
    history: list[dict] = []

    for epoch in range(1, args.epochs + 1):
        model.train()
        t0 = time.time()
        running = 0.0
        n = 0
        for x, y in train_loader:
            x = x.to(device, non_blocking=True)
            y = y.to(device, non_blocking=True)
            optim.zero_grad(set_to_none=True)
            with torch.amp.autocast("cuda", enabled=use_amp):
                logits = model(x)
                loss = criterion(logits, y)
            scaler.scale(loss).backward()
            scaler.unscale_(optim)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            scaler.step(optim)
            scaler.update()
            running += loss.item() * y.size(0)
            n += y.size(0)
        sched.step()

        train_loss = running / max(n, 1)
        val_top1, val_top5 = evaluate(model, val_loader, device, num_classes)
        dt = time.time() - t0
        print(
            f"epoch {epoch:3d}/{args.epochs} | loss={train_loss:.4f} "
            f"| val_top1={val_top1:.3f} top5={val_top5:.3f} | {dt:.1f}s"
        )
        history.append(
            {"epoch": epoch, "train_loss": train_loss, "val_top1": val_top1, "val_top5": val_top5}
        )

        if val_top1 > best_val:
            best_val = val_top1
            patience = 0
            ckpt = {
                "model": args.model,
                "state_dict": model.state_dict(),
                "classes": classes,
                "epoch": epoch,
                "val_top1": val_top1,
                "config": {
                    "features_per_frame": C.FEATURES_PER_FRAME,
                    "num_frames": C.NUM_FRAMES,
                    "keep_face": C.KEEP_FACE,
                },
            }
            torch.save(ckpt, C.MODELS_DIR / f"best_{args.model}.pth")
            print(f"  [OK] saved best (val_top1={val_top1:.3f})")
        else:
            patience += 1
            if patience >= C.EARLY_STOP_PATIENCE:
                print(f"[info] early stop at epoch {epoch} (no improvement {patience} epochs)")
                break

    # Final test evaluation từ best checkpoint
    best_path = C.MODELS_DIR / f"best_{args.model}.pth"
    if best_path.exists():
        ckpt = torch.load(best_path, map_location=device)
        model.load_state_dict(ckpt["state_dict"])
    test_top1, test_top5 = evaluate(model, test_loader, device, num_classes)
    print(f"[result] test_top1={test_top1:.3f} top5={test_top5:.3f} | best_val={best_val:.3f}")

    (C.MODELS_DIR / f"history_{args.model}.json").write_text(
        json.dumps(history, indent=2), encoding="utf-8"
    )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model", choices=["bilstm", "transformer"], default="bilstm")
    p.add_argument("--epochs", type=int, default=C.EPOCHS)
    p.add_argument("--batch-size", type=int, default=C.BATCH_SIZE)
    p.add_argument("--lr", type=float, default=C.LR)
    p.add_argument("--num-workers", type=int, default=2)
    args = p.parse_args()
    train(args)


if __name__ == "__main__":
    main()
