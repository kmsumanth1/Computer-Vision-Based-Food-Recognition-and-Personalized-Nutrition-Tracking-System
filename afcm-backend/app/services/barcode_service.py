import logging
import re

import httpx
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError
from app.models.food import Food
from app.services.food_service import find_food_by_barcode

log = logging.getLogger("afcm.barcode")
BARCODE_RE = re.compile(r"^\d{6,14}$")
OFF_URL = "https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
OFF_FIELDS = "product_name,brands,nutriments,serving_size,serving_quantity"


def _not_found() -> AppError:
    return AppError(404, "BARCODE_NOT_FOUND", "We couldn't find a product for this barcode.")


def _num(nutriments: dict, key: str, default: float = 0.0) -> float:
    try:
        return float(nutriments.get(key, default) or default)
    except (TypeError, ValueError):
        return default


def food_from_openfoodfacts(barcode: str, payload: dict) -> Food | None:
    """Turns an Open Food Facts response into a Food row, or None when it has no usable nutrition."""
    if payload.get("status") != 1:
        return None
    product = payload.get("product") or {}
    n = product.get("nutriments") or {}
    name = (product.get("product_name") or "").strip()
    if not name or "energy-kcal_100g" not in n:
        return None

    try:
        serving_g = float(product.get("serving_quantity") or 0)
    except (TypeError, ValueError):
        serving_g = 0.0
    brand = (product.get("brands") or "").split(",")[0].strip() or None
    return Food(
        id=f"off-{barcode}",
        name=name[:255],
        kind="product",
        brand=brand[:255] if brand else None,
        barcode=barcode,
        serving_size_label=(product.get("serving_size") or None),
        reference_weight_g=serving_g if serving_g > 0 else 100.0,
        calories_100g=_num(n, "energy-kcal_100g"),
        protein_g_100g=_num(n, "proteins_100g"),
        carbs_g_100g=_num(n, "carbohydrates_100g"),
        fat_g_100g=_num(n, "fat_100g"),
        fiber_g_100g=_num(n, "fiber_100g"),
        sugar_g_100g=_num(n, "sugars_100g"),
        saturated_fat_g_100g=_num(n, "saturated-fat_100g"),
        sodium_mg_100g=_num(n, "sodium_100g") * 1000,  # Open Food Facts reports grams
        cholesterol_mg_100g=_num(n, "cholesterol_100g") * 1000,
        source="openfoodfacts",
    )


def lookup_barcode(db: Session, barcode: str, client: httpx.Client | None = None) -> Food:
    barcode = barcode.strip()
    if not BARCODE_RE.match(barcode):
        raise _not_found()

    food = find_food_by_barcode(db, barcode)
    if food:
        return food

    settings = get_settings()
    if settings.barcode_provider != "openfoodfacts":
        raise _not_found()

    own_client = client is None
    client = client or httpx.Client(timeout=settings.openfoodfacts_timeout_s, headers={"User-Agent": "AIFoodCaloriesMeter/1.0"})
    try:
        response = client.get(OFF_URL.format(barcode=barcode), params={"fields": OFF_FIELDS})
        if response.status_code == 404:
            raise _not_found()
        response.raise_for_status()
        found = food_from_openfoodfacts(barcode, response.json())
    except AppError:
        raise
    except (httpx.HTTPError, ValueError):
        log.exception("Open Food Facts lookup failed for %s", barcode)
        raise AppError(502, "BARCODE_LOOKUP_FAILED", "The product database didn't respond. Try again in a moment.") from None
    finally:
        if own_client:
            client.close()

    if found is None:
        raise _not_found()
    db.add(found)  # cache it, so the next scan is instant and works offline
    db.commit()
    return found
