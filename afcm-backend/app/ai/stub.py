import hashlib
from collections.abc import Callable

from PIL import Image

from app.ai.base import FoodRecognizer, Prediction


class StubRecognizer(FoodRecognizer):
    """
    DEVELOPMENT PLACEHOLDER. It does not look at the food.

    It picks foods from the database based on a hash of the pixels, so the same photo always gives the
    same answer. That lets the whole app be exercised before a real model exists.
    Switch to AI_PROVIDER=onnx once you have trained a model.
    """

    name = "stub"

    def __init__(self, food_ids: Callable[[], list[str]]):
        self._food_ids = food_ids

    @property
    def ready(self) -> bool:
        return True

    def predict(self, image: Image.Image) -> list[Prediction]:
        ids = self._food_ids()
        if not ids:
            return []
        digest = hashlib.sha256(image.resize((32, 32)).tobytes()).digest()
        start = int.from_bytes(digest[:4], "big") % len(ids)
        top = 0.70 + (digest[4] % 25) / 100  # 0.70 to 0.94
        picks = [ids[(start + i * 3) % len(ids)] for i in range(3)]
        rest = (1 - top) / 2
        return [Prediction(picks[0], top), Prediction(picks[1], rest * 0.6), Prediction(picks[2], rest * 0.4)]
