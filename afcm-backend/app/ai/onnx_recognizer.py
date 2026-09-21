import json
import logging
from pathlib import Path

import numpy as np
from PIL import Image

from app.ai.base import FoodRecognizer, Prediction
from app.ai.preprocess import IMAGENET_MEAN, IMAGENET_STD, preprocess

log = logging.getLogger("afcm.ai")


def _softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    return exp / exp.sum()


class OnnxFoodRecognizer(FoodRecognizer):
    """
    Runs the classifier exported by ml/train.py.

    Files in MODEL_DIR:
      food_classifier.onnx   the model (input: 1x3xHxW float32, output: one score per class)
      labels.json            class names in output order:  ["chapati", "dal", ...]
      label_map.json         optional {class name: foods.id} when the names differ from the food ids
      model_meta.json        optional {"input_size": 224, "resize_size": 256, "mean": [...], "std": [...],
                                       "output": "logits" | "probabilities"}
    """

    name = "onnx"

    def __init__(self, model_path: Path, labels: list[str], label_map: dict[str, str] | None = None, meta: dict | None = None, top_k: int = 5):
        import onnxruntime as ort  # imported here so the stub/none providers never need it

        meta = meta or {}
        self.food_ids = [(label_map or {}).get(label, label) for label in labels]
        self.input_size = int(meta.get("input_size", 224))
        self.resize_size = int(meta["resize_size"]) if meta.get("resize_size") else None
        self.mean = tuple(meta.get("mean", IMAGENET_MEAN))
        self.std = tuple(meta.get("std", IMAGENET_STD))
        self.output_is_probabilities = meta.get("output", "logits") == "probabilities"
        self.top_k = top_k

        self.session = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        out_dim = self.session.get_outputs()[0].shape[-1]
        if isinstance(out_dim, int) and out_dim != len(labels):
            raise ValueError(f"The model has {out_dim} outputs but labels.json lists {len(labels)} classes.")
        log.info("Loaded food model %s with %d classes", model_path.name, len(labels))

    @classmethod
    def from_directory(cls, directory: Path, model_file: str, labels_file: str, label_map_file: str, meta_file: str, top_k: int = 5) -> "OnnxFoodRecognizer":
        model_path = directory / model_file
        labels_path = directory / labels_file
        if not model_path.is_file() or not labels_path.is_file():
            raise FileNotFoundError(f"Expected {model_path} and {labels_path}. Train a model with ml/train.py first.")

        labels = json.loads(labels_path.read_text(encoding="utf-8"))
        if isinstance(labels, dict):  # tolerate {"labels": [...]}
            labels = labels["labels"]
        label_map_path, meta_path = directory / label_map_file, directory / meta_file
        label_map = json.loads(label_map_path.read_text(encoding="utf-8")) if label_map_path.is_file() else None
        meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.is_file() else None
        return cls(model_path, list(labels), label_map, meta, top_k)

    @property
    def ready(self) -> bool:
        return True

    def predict(self, image: Image.Image) -> list[Prediction]:
        batch = preprocess(image, self.input_size, self.resize_size, self.mean, self.std)
        scores = np.asarray(self.session.run(None, {self.input_name: batch})[0][0], dtype=np.float64)
        probs = scores if self.output_is_probabilities else _softmax(scores)
        order = np.argsort(probs)[::-1][: self.top_k]
        return [Prediction(self.food_ids[i], float(probs[i])) for i in order]
