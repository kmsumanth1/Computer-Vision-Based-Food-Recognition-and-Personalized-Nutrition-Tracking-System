import io
import json

import numpy as np
import pytest
from PIL import Image

from app.ai.preprocess import IMAGENET_MEAN, IMAGENET_STD, decode_image, preprocess
from app.ai.registry import reset_recognizer
from app.core.config import get_settings
from app.core.errors import AppError
from tests.conftest import make_png


def analyze(client, headers, data: bytes, name="food.png", content_type="image/png"):
    return client.post("/food/analyze", files={"image": (name, data, content_type)}, headers=headers)


# ---- stub provider (the default in development) ---------------------------------------------

def test_stub_returns_a_known_food_deterministically(client, user):
    first = analyze(client, user, make_png((200, 120, 60)))
    again = analyze(client, user, make_png((200, 120, 60)))
    assert first.status_code == 200, first.text
    food = first.json()["food"]
    assert food["food_id"] and 0 < food["confidence"] <= 1
    assert food["reference_weight_g"] > 0 and food["nutrition"]["calories"] >= 0
    assert food["barcode"] is None
    assert again.json() == first.json()
    assert food["food_id"] not in ("prod-protein-bar", "prod-peanut-butter", "prod-whole-grain-cereal")  # foods, not products


def test_health_reports_the_stub(client):
    body = client.get("/health").json()
    assert body["status"] == "ok" and body["database"] == "ok"
    assert body["ai"]["provider"] == "stub" and body["ai"]["ready"] is True


def test_analyze_rejects_bad_uploads(client, user):
    for data in (b"", b"this is not an image", b"GIF89a" + b"\x00" * 50):
        res = analyze(client, user, data)
        assert res.status_code == 422 and res.json()["detail"]["code"] == "INVALID_IMAGE"
    buf = io.BytesIO()
    Image.new("RGB", (10, 10)).save(buf, format="GIF")
    assert analyze(client, user, buf.getvalue(), "a.gif", "image/gif").json()["detail"]["code"] == "INVALID_IMAGE"
    assert client.post("/food/analyze", headers=user).json()["detail"]["code"] == "INVALID_IMAGE"


def test_analyze_rejects_oversized_uploads(client, user, monkeypatch):
    monkeypatch.setenv("MAX_IMAGE_SIZE_MB", "1")
    get_settings.cache_clear()
    big = make_png(size=(2000, 2000)) + b"\x00" * (1024 * 1024)
    res = analyze(client, user, big)
    assert res.status_code == 413 and res.json()["detail"]["code"] == "INVALID_IMAGE"


def test_analyze_requires_login(client):
    assert analyze(client, {}, make_png()).status_code == 401


def test_provider_none_answers_model_not_ready(client, user, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "none")
    get_settings.cache_clear()
    reset_recognizer()
    res = analyze(client, user, make_png())
    assert res.status_code == 503 and res.json()["detail"]["code"] == "MODEL_NOT_READY"
    assert client.get("/health").json()["ai"]["ready"] is False


# ---- onnx provider, with a tiny model built on the fly --------------------------------------

def build_color_model(path, classes: int = 3):
    """
    A 'classifier' with no training: it averages each color channel and scores class k by channel k.
    So a red picture is class 0, a green one class 1, a blue one class 2. Enough to test the plumbing.
    """
    import onnx
    from onnx import TensorProto, helper, numpy_helper

    weights = (np.eye(3, classes, dtype=np.float32) * 12.0)
    graph = helper.make_graph(
        [
            helper.make_node("GlobalAveragePool", ["input"], ["gap"]),
            helper.make_node("Flatten", ["gap"], ["pooled"], axis=1),
            helper.make_node("MatMul", ["pooled", "W"], ["logits"]),
        ],
        "color_classifier",
        [helper.make_tensor_value_info("input", TensorProto.FLOAT, ["batch", 3, 224, 224])],
        [helper.make_tensor_value_info("logits", TensorProto.FLOAT, ["batch", classes])],
        initializer=[numpy_helper.from_array(weights, "W")],
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 13)])
    model.ir_version = 8
    onnx.save(model, str(path))


@pytest.fixture
def onnx_model_dir(tmp_path, monkeypatch):
    build_color_model(tmp_path / "food_classifier.onnx")
    (tmp_path / "labels.json").write_text(json.dumps(["tomato_dish", "salad_x", "rice-cooked"]))
    (tmp_path / "label_map.json").write_text(json.dumps({"tomato_dish": "dal", "salad_x": "no-such-food"}))
    (tmp_path / "model_meta.json").write_text(json.dumps({"input_size": 224, "mean": [0, 0, 0], "std": [1, 1, 1]}))
    monkeypatch.setenv("AI_PROVIDER", "onnx")
    monkeypatch.setenv("MODEL_DIR", str(tmp_path))
    get_settings.cache_clear()
    reset_recognizer()
    return tmp_path


def test_onnx_model_recognises_and_maps_labels(client, user, onnx_model_dir):
    assert client.get("/health").json()["ai"] == {"provider": "onnx", "ready": True, "problem": None}
    res = analyze(client, user, make_png((255, 0, 0)))
    assert res.status_code == 200, res.text
    food = res.json()["food"]
    assert food["food_id"] == "dal"  # class 0 "tomato_dish" -> label_map -> dal
    assert food["confidence"] > 0.9
    assert food["reference_weight_g"] == 200

    blue = analyze(client, user, make_png((0, 0, 255))).json()["food"]
    assert blue["food_id"] == "rice-cooked"  # class 2 has no mapping, so the label is the food id


def test_low_confidence_counts_as_not_recognized(client, user, onnx_model_dir, monkeypatch):
    monkeypatch.setenv("RECOGNITION_MIN_CONFIDENCE", "0.6")
    get_settings.cache_clear()
    res = analyze(client, user, make_png((90, 90, 90)))  # all channels equal: 1/3 each
    assert res.status_code == 422 and res.json()["detail"]["code"] == "FOOD_NOT_RECOGNIZED"


def test_prediction_for_unknown_food_is_reported(client, user, onnx_model_dir):
    res = analyze(client, user, make_png((0, 255, 0)))  # class 1 -> "no-such-food"
    assert res.status_code == 404 and res.json()["detail"]["code"] == "NUTRITION_UNAVAILABLE"


def test_missing_model_files_are_reported_not_crashed(client, user, tmp_path, monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "onnx")
    monkeypatch.setenv("MODEL_DIR", str(tmp_path))  # empty
    get_settings.cache_clear()
    reset_recognizer()
    res = analyze(client, user, make_png())
    assert res.status_code == 503 and res.json()["detail"]["code"] == "MODEL_NOT_READY"
    health = client.get("/health").json()
    assert health["ai"]["ready"] is False and "ml/train.py" in health["ai"]["problem"]


def test_label_count_mismatch_is_caught_at_load(client, user, onnx_model_dir):
    (onnx_model_dir / "labels.json").write_text(json.dumps(["only", "two"]))
    reset_recognizer()
    assert client.get("/health").json()["ai"]["ready"] is False


# ---- preprocessing --------------------------------------------------------------------------

def test_preprocess_shape_and_normalisation():
    image = Image.new("RGB", (640, 480), (255, 0, 0))
    out = preprocess(image, input_size=224)
    assert out.shape == (1, 3, 224, 224) and out.dtype == np.float32
    assert out[0, 0, 0, 0] == pytest.approx((1.0 - IMAGENET_MEAN[0]) / IMAGENET_STD[0], abs=1e-5)
    assert out[0, 1, 100, 100] == pytest.approx((0.0 - IMAGENET_MEAN[1]) / IMAGENET_STD[1], abs=1e-5)


def test_preprocess_center_crops_the_shorter_side():
    # Left half black, right half white, wide image: the crop keeps the middle, so both colors survive.
    image = Image.new("RGB", (600, 300), (0, 0, 0))
    image.paste((255, 255, 255), (300, 0, 600, 300))
    out = preprocess(image, 224, mean=(0, 0, 0), std=(1, 1, 1))
    assert out[0, 0, 100, 5] == pytest.approx(0.0) and out[0, 0, 100, 218] == pytest.approx(1.0)


def test_decode_image_applies_exif_rotation_and_rgb():
    image = Image.new("RGBA", (40, 20), (1, 2, 3, 255))
    exif = Image.Exif()
    exif[0x0112] = 6  # rotate 90 degrees when displayed
    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="JPEG", exif=exif)
    decoded = decode_image(buf.getvalue())
    assert decoded.mode == "RGB" and decoded.size == (20, 40)


def test_decode_image_rejects_garbage():
    with pytest.raises(AppError):
        decode_image(b"nope")
