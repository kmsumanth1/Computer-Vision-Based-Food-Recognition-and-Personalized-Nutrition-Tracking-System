"""
Computes precision, recall, and F1-score for the trained classifier
on its validation set. Run after ml/train.py has produced models/checkpoint.pt
or you have the exported ONNX + labels; this version reloads via PyTorch
using the same val transform train.py uses, for exact consistency.

    python -m ml.compute_metrics --data-dir ml/data --weights models/food_classifier.onnx
"""
import argparse
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image
from torchvision import datasets, transforms
from sklearn.metrics import precision_recall_fscore_support

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--data-dir", type=Path, default=Path("ml/data"))
    p.add_argument("--weights", type=Path, default=Path("models/food_classifier.onnx"))
    p.add_argument("--img-size", type=int, default=224)
    return p.parse_args()


def main():
    args = parse_args()
    resize_size = int(round(args.img_size * 256 / 224))
    eval_tf = transforms.Compose([
        transforms.Resize(resize_size),
        transforms.CenterCrop(args.img_size),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])

    val_dir = args.data_dir / "val"
    if not val_dir.is_dir():
        raise SystemExit(f"{val_dir} not found — this script expects a val/ folder like train.py uses.")

    val_set = datasets.ImageFolder(val_dir, eval_tf)
    session = ort.InferenceSession(str(args.weights), providers=["CPUExecutionProvider"])

    y_true, y_pred = [], []
    for img, label in val_set:
        input_arr = img.numpy()[np.newaxis, :]
        logits = session.run(None, {"input": input_arr})[0]
        pred = int(np.argmax(logits, axis=1)[0])
        y_true.append(label)
        y_pred.append(pred)

    for avg in ("macro", "weighted"):
        p, r, f1, _ = precision_recall_fscore_support(y_true, y_pred, average=avg, zero_division=0)
        print(f"{avg.capitalize()} — Precision: {p:.4f}  Recall: {r:.4f}  F1-score: {f1:.4f}")


if __name__ == "__main__":
    main()