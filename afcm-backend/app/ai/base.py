from abc import ABC, abstractmethod
from dataclasses import dataclass

from PIL import Image


@dataclass(frozen=True)
class Prediction:
    """`food_id` is the id of a row in the foods table."""

    food_id: str
    confidence: float  # 0 to 1


class FoodRecognizer(ABC):
    """Anything that can name the food in a photo. Swap implementations without touching the API."""

    name: str = "base"

    @property
    @abstractmethod
    def ready(self) -> bool: ...

    @abstractmethod
    def predict(self, image: Image.Image) -> list[Prediction]:
        """Most likely foods first."""
