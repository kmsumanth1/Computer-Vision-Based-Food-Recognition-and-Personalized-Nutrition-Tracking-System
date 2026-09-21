import logging

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.ai.preprocess import decode_image
from app.ai.registry import get_recognizer
from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.errors import AppError
from app.db.session import get_db
from app.models.user import User
from app.schemas.food import (
    BarcodeRequest,
    BarcodeResponse,
    CalculateWeightRequest,
    CalculateWeightResponse,
    FoodAnalysisResponse,
)
from app.services import food_service
from app.services.barcode_service import lookup_barcode

log = logging.getLogger("afcm.food")
router = APIRouter(prefix="/food", tags=["food"])


@router.post("/analyze", response_model=FoodAnalysisResponse)
def analyze(image: UploadFile | None = File(default=None), _user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Names the food in a photo. Nutrition for the typical serving comes from the foods table."""
    settings = get_settings()
    recognizer = get_recognizer()  # 503 MODEL_NOT_READY when there is no model

    if image is None:
        raise AppError(422, "INVALID_IMAGE", "Add a photo to analyze.")
    limit = settings.max_image_size_mb * 1024 * 1024
    data = image.file.read(limit + 1)
    if len(data) > limit:
        raise AppError(413, "INVALID_IMAGE", f"That image is larger than {settings.max_image_size_mb} MB.")

    predictions = recognizer.predict(decode_image(data))
    confident = [p for p in predictions if p.confidence >= settings.recognition_min_confidence]
    if not confident:
        raise AppError(422, "FOOD_NOT_RECOGNIZED", "We couldn't recognise any food in this photo.")

    for prediction in confident:
        food = food_service.get_food(db, prediction.food_id)
        if food is not None:
            return FoodAnalysisResponse(food=food_service.to_food_item(food, prediction.confidence))
        log.warning("Model predicted %r but the foods table has no such id. Add it or fix label_map.json.", prediction.food_id)
    raise AppError(404, "NUTRITION_UNAVAILABLE", "Nutrition data isn't available for this food yet.")


@router.post("/calculate-weight", response_model=CalculateWeightResponse)
def calculate_weight(body: CalculateWeightRequest, _user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    weight = food_service.validate_weight(body.weight_g)
    food = food_service.require_food(db, food_id=body.food_id, food_name=body.food_name)
    return CalculateWeightResponse(
        food_id=food.id,
        food_name=food.name,
        weight_g=weight,
        nutrition=food_service.nutrition_for(food, weight),
    )


@router.post("/barcode", response_model=BarcodeResponse)
def barcode(body: BarcodeRequest, _user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return BarcodeResponse(food=food_service.to_food_item(lookup_barcode(db, body.barcode)))
