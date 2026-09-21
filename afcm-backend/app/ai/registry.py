import logging
from functools import lru_cache

from sqlalchemy import select

from app.ai.base import FoodRecognizer
from app.ai.stub import StubRecognizer
from app.core.config import get_settings
from app.core.errors import AppError
from app.db.session import get_sessionmaker
from app.models.food import Food

log = logging.getLogger("afcm.ai")


def _food_ids() -> list[str]:
    with get_sessionmaker()() as db:
        return sorted(db.scalars(select(Food.id).where(Food.kind == "food")))


@lru_cache
def _load() -> tuple[FoodRecognizer | None, str | None]:
    """(recognizer, problem). Loaded once. A failed load is remembered so every request doesn't retry."""
    settings = get_settings()
    if settings.ai_provider == "none":
        return None, "AI recognition is turned off (AI_PROVIDER=none)."
    if settings.ai_provider == "stub":
        log.warning("AI_PROVIDER=stub: food recognition is a PLACEHOLDER and does not look at the photo.")
        return StubRecognizer(_food_ids), None

    from app.ai.onnx_recognizer import OnnxFoodRecognizer

    try:
        recognizer = OnnxFoodRecognizer.from_directory(
            settings.model_dir,
            settings.model_file,
            settings.labels_file,
            settings.label_map_file,
            settings.model_meta_file,
            settings.recognition_top_k,
        )
        return recognizer, None
    except Exception as exc:  # missing files, bad labels, corrupt model
        log.error("Could not load the food model: %s", exc)
        return None, str(exc)


def reset_recognizer() -> None:
    _load.cache_clear()


def get_recognizer() -> FoodRecognizer:
    recognizer, _ = _load()
    if recognizer is None:
        raise AppError(503, "MODEL_NOT_READY", "Food recognition isn't available yet. Please add the food manually for now.")
    return recognizer


def recognizer_status() -> dict:
    settings = get_settings()
    recognizer, problem = _load()
    return {"provider": settings.ai_provider, "ready": recognizer is not None, "problem": problem}
