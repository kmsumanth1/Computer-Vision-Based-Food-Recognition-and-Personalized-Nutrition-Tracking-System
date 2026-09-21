import httpx
import pytest

from app.core.config import get_settings
from app.db.session import get_sessionmaker
from app.models import Food
from app.services.barcode_service import food_from_openfoodfacts, lookup_barcode


def test_calculate_weight_by_id(client, user):
    res = client.post("/food/calculate-weight", json={"food_id": "chapati", "weight_g": 240}, headers=user)
    assert res.status_code == 200
    body = res.json()
    assert body["food_id"] == "chapati" and body["weight_g"] == 240
    n = body["nutrition"]
    assert n["calories"] == 713  # 297 kcal per 100 g x 2.4
    assert n["protein_g"] == 23.0 and n["carbs_g"] == 120.0 and n["fat_g"] == 18.0
    assert [o["name"] for o in n["other_nutrients"]] == ["Sugar", "Saturated fat", "Sodium", "Cholesterol"]
    assert {o["unit"] for o in n["other_nutrients"]} == {"g", "mg"}


def test_calculation_is_linear_in_weight(client, user):
    a = client.post("/food/calculate-weight", json={"food_id": "rice-cooked", "weight_g": 100}, headers=user).json()
    b = client.post("/food/calculate-weight", json={"food_id": "rice-cooked", "weight_g": 300}, headers=user).json()
    assert b["nutrition"]["calories"] == 3 * a["nutrition"]["calories"]


@pytest.mark.parametrize("text,expected", [("Paneer", "paneer"), ("roti", "chapati"), ("boiled eggs", "egg-boiled"), ("panner", "paneer"), ("  Curd ", "yogurt-greek")])
def test_manual_name_lookup(client, user, text, expected):
    res = client.post("/food/calculate-weight", json={"food_name": text, "weight_g": 100}, headers=user)
    assert res.status_code == 200, res.text
    assert res.json()["food_id"] == expected


def test_unknown_food_and_bad_weights(client, user):
    res = client.post("/food/calculate-weight", json={"food_name": "zzzxqv", "weight_g": 100}, headers=user)
    assert res.status_code == 404 and res.json()["detail"]["code"] == "NUTRITION_UNAVAILABLE"
    for weight in (0, -5, 5001):
        res = client.post("/food/calculate-weight", json={"food_id": "paneer", "weight_g": weight}, headers=user)
        assert res.status_code == 422 and res.json()["detail"]["code"] == "INVALID_WEIGHT", weight


def test_products_are_not_matched_by_name(client, user):
    res = client.post("/food/calculate-weight", json={"food_name": "Whole Grain Cereal", "weight_g": 30}, headers=user)
    assert res.status_code == 404  # products are found by barcode (or id)
    by_id = client.post("/food/calculate-weight", json={"food_id": "prod-whole-grain-cereal", "weight_g": 30}, headers=user)
    assert by_id.status_code == 200


def test_barcode_lookup(client, user):
    res = client.post("/food/barcode", json={"barcode": "8901234500035"}, headers=user)
    assert res.status_code == 200
    food = res.json()["food"]
    assert food["name"] == "Whole Grain Cereal" and food["brand"] == "PureCrunch"
    assert food["serving_size_label"] == "1 cup (30 g)" and food["reference_weight_g"] == 30
    assert food["nutrition"]["calories"] == 113  # 375 x 0.3
    assert food["confidence"] is None


@pytest.mark.parametrize("code", ["8909999999999", "abc", "123", "", "000123456"])
def test_barcode_not_found(client, user, code):
    res = client.post("/food/barcode", json={"barcode": code}, headers=user)
    assert res.status_code == 404 and res.json()["detail"]["code"] == "BARCODE_NOT_FOUND"


OFF_PAYLOAD = {
    "status": 1,
    "product": {
        "product_name": "Test Muesli",
        "brands": "Acme, Other",
        "serving_size": "40 g",
        "serving_quantity": 40,
        "nutriments": {
            "energy-kcal_100g": 380,
            "proteins_100g": 9.5,
            "carbohydrates_100g": 66,
            "fat_100g": 7.5,
            "fiber_100g": 8,
            "sugars_100g": 15,
            "saturated-fat_100g": 1.2,
            "sodium_100g": 0.05,
        },
    },
}


def test_open_food_facts_conversion():
    food = food_from_openfoodfacts("5012345678900", OFF_PAYLOAD)
    assert food.id == "off-5012345678900" and food.brand == "Acme" and food.reference_weight_g == 40
    assert food.sodium_mg_100g == pytest.approx(50)  # grams -> mg
    assert food_from_openfoodfacts("1", {"status": 0}) is None
    assert food_from_openfoodfacts("1", {"status": 1, "product": {"product_name": "No nutrition"}}) is None


def test_open_food_facts_lookup_is_cached(monkeypatch):
    monkeypatch.setenv("BARCODE_PROVIDER", "openfoodfacts")
    get_settings.cache_clear()
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        return httpx.Response(200, json=OFF_PAYLOAD)

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with get_sessionmaker()() as db:
        first = lookup_barcode(db, "5012345678900", client)
        again = lookup_barcode(db, "5012345678900", client)
        assert first.id == again.id == "off-5012345678900"
        assert db.get(Food, "off-5012345678900").source == "openfoodfacts"
    assert len(calls) == 1  # the second scan came from the database


def test_open_food_facts_failure_is_reported(monkeypatch):
    monkeypatch.setenv("BARCODE_PROVIDER", "openfoodfacts")
    get_settings.cache_clear()
    from app.core.errors import AppError

    boom = httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(500)))
    missing = httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(200, json={"status": 0})))
    with get_sessionmaker()() as db:
        with pytest.raises(AppError) as err:
            lookup_barcode(db, "5012345678900", boom)
        assert err.value.code == "BARCODE_LOOKUP_FAILED"
        with pytest.raises(AppError) as err:
            lookup_barcode(db, "5012345678900", missing)
        assert err.value.code == "BARCODE_NOT_FOUND"
