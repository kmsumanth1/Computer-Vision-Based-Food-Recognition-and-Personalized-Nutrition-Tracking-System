import datetime as dt

import pytest

TODAY = "2026-09-19"


def add_meal(client, headers, **overrides):
    body = {
        "meal_type": "lunch",
        "food_id": "chicken-breast",
        "food_name": "Chicken breast (grilled)",
        "quantity": 1,
        "weight_g": 200,
        "date": TODAY,
        "time": "13:15",
        "source": "camera",
    } | overrides
    return client.post("/meals", json=body, headers=headers)


def test_create_meal_calculates_nutrition_on_the_backend(client, user):
    res = add_meal(client, user)
    assert res.status_code == 201, res.text
    entry = res.json()
    assert entry["food_name"] == "Chicken breast (grilled)" and entry["time"] == "13:15" and entry["date"] == TODAY
    assert entry["nutrition"]["calories"] == 330  # 165 x 2
    assert entry["nutrition"]["protein_g"] == 62.0
    assert entry["source"] == "camera" and entry["meal_type"] == "lunch"


def test_client_cannot_inject_nutrition(client, user):
    res = add_meal(client, user, nutrition={"calories": 1, "protein_g": 999})
    assert res.status_code == 201
    assert res.json()["nutrition"]["calories"] == 330


def test_list_meals_and_totals(client, user):
    add_meal(client, user)
    add_meal(client, user, meal_type="breakfast", food_id="egg-boiled", food_name="x", weight_g=100, time="08:00")
    add_meal(client, user, date="2026-09-18")  # other day

    res = client.get("/meals", params={"date": TODAY}, headers=user).json()
    assert res["date"] == TODAY
    assert [e["meal_type"] for e in res["entries"]] == ["breakfast", "lunch"]  # ordered by time
    assert res["totals"]["calories"] == 330 + 155
    assert res["totals"]["protein_g"] == pytest.approx(62.0 + 12.6)


def test_update_meal_recalculates_when_weight_changes(client, user):
    entry = add_meal(client, user).json()
    res = client.put(f"/meals/{entry['id']}", json={"weight_g": 100, "meal_type": "dinner", "quantity": 2, "time": "20:30"}, headers=user)
    assert res.status_code == 200
    updated = res.json()
    assert updated["weight_g"] == 100 and updated["nutrition"]["calories"] == 165
    assert updated["meal_type"] == "dinner" and updated["quantity"] == 2 and updated["time"] == "20:30"

    # changing only the meal keeps the nutrition
    again = client.put(f"/meals/{entry['id']}", json={"meal_type": "snacks"}, headers=user).json()
    assert again["nutrition"]["calories"] == 165 and again["meal_type"] == "snacks"


def test_delete_meal(client, user):
    entry = add_meal(client, user).json()
    assert client.delete(f"/meals/{entry['id']}", headers=user).status_code == 204
    assert client.get("/meals", params={"date": TODAY}, headers=user).json()["entries"] == []
    assert client.delete(f"/meals/{entry['id']}", headers=user).status_code == 404


def test_meals_are_private_to_their_owner(client, user):
    entry = add_meal(client, user).json()
    other = client.post("/auth/register", json={"name": "Eve", "email": "eve@example.com", "password": "password123"}).json()
    eve = {"Authorization": f"Bearer {other['access_token']}"}
    assert client.put(f"/meals/{entry['id']}", json={"weight_g": 1}, headers=eve).status_code == 404
    assert client.delete(f"/meals/{entry['id']}", headers=eve).status_code == 404


def test_meal_validation(client, user):
    assert add_meal(client, user, weight_g=0).json()["detail"]["code"] == "INVALID_WEIGHT"
    assert add_meal(client, user, weight_g=6000).status_code == 422
    assert add_meal(client, user, food_id="no-such-food").json()["detail"]["code"] == "NUTRITION_UNAVAILABLE"
    assert add_meal(client, user, quantity=0).status_code == 422
    assert add_meal(client, user, meal_type="brunch").status_code == 422
    assert add_meal(client, user, time="25:00").status_code == 422
    assert add_meal(client, user, date="19/09/2026").status_code == 422
    assert add_meal(client, user, date="2026-02-31").status_code == 422


def test_water_accumulates_and_has_a_target(client, user):
    res = client.post("/water", json={"amount_ml": 250, "date": TODAY}, headers=user)
    assert res.status_code == 200
    assert res.json() == {"date": TODAY, "consumed_ml": 250, "target_ml": 2500}
    client.post("/water", json={"amount_ml": 1000, "date": TODAY}, headers=user)
    assert client.get("/water", params={"date": TODAY}, headers=user).json()["consumed_ml"] == 1250
    assert client.get("/water", params={"date": "2026-09-01"}, headers=user).json()["consumed_ml"] == 0


@pytest.mark.parametrize("amount", [0, -250, 5001])
def test_water_validation(client, user, amount):
    assert client.post("/water", json={"amount_ml": amount, "date": TODAY}, headers=user).status_code == 422


def test_dashboard(client, user):
    add_meal(client, user)
    client.post("/water", json={"amount_ml": 500, "date": TODAY}, headers=user)
    res = client.get("/dashboard", params={"date": TODAY}, headers=user)
    assert res.status_code == 200
    body = res.json()
    assert body["date"] == TODAY
    assert body["plan"]["daily_calories"] == 2080
    assert body["totals"]["calories"] == 330
    assert body["water"] == {"date": TODAY, "consumed_ml": 500, "target_ml": 2500}
    assert len(body["entries"]) == 1


def test_dashboard_needs_a_profile(client, auth):
    res = client.get("/dashboard", headers=auth)
    assert res.status_code == 404 and res.json()["detail"]["code"] == "PROFILE_NOT_FOUND"


def test_today_follows_the_client_timezone(client, user):
    """Defaults to the user's local date, not the server's."""
    east = client.get("/dashboard", headers=user | {"X-Timezone": "Pacific/Kiritimati"}).json()["date"]  # UTC+14
    west = client.get("/dashboard", headers=user | {"X-Timezone": "Pacific/Pago_Pago"}).json()["date"]  # UTC-11
    assert dt.date.fromisoformat(east) - dt.date.fromisoformat(west) == dt.timedelta(days=1)
    bad = client.get("/dashboard", headers=user | {"X-Timezone": "Not/AZone"})
    assert bad.status_code == 200  # falls back to the configured timezone


def test_history_ranges_and_values(client, user):
    today = dt.datetime.now(dt.timezone.utc).date()
    yesterday = today - dt.timedelta(days=1)
    add_meal(client, user, date=today.isoformat())
    add_meal(client, user, date=yesterday.isoformat(), weight_g=100)
    client.post("/water", json={"amount_ml": 750, "date": today.isoformat()}, headers=user)

    def get(range_):
        res = client.get("/history", params={"range": range_}, headers=user | {"X-Timezone": "UTC"})
        assert res.status_code == 200, res.text
        return res.json()

    assert len(get("today")["days"]) == 1
    assert len(get("yesterday")["days"]) == 1
    week, month = get("last_7_days"), get("last_30_days")
    assert len(week["days"]) == 7 and len(month["days"]) == 30
    assert week["days"][-1]["date"] == today.isoformat() and week["days"][0]["date"] == (today - dt.timedelta(days=6)).isoformat()
    assert week["calorie_target"] == 2080 and week["water_target_ml"] == 2500

    last, prev = week["days"][-1], week["days"][-2]
    assert last["calories"] == 330 and last["water_ml"] == 750 and last["protein_g"] == 62.0
    assert prev["calories"] == 165
    assert last["weight_kg"] == 72.0  # logged when the profile was set up
    empty = week["days"][0]
    assert empty["calories"] == 0 and empty["water_ml"] == 0 and empty["weight_kg"] is None  # gaps are still returned
    assert get("yesterday")["days"][0]["calories"] == 165

    assert client.get("/history", params={"range": "forever"}, headers=user).status_code == 422


def test_weight_history_follows_profile_updates(client, user):
    client.put("/profile", json={"weight_kg": 71.5}, headers=user | {"X-Timezone": "UTC"})
    days = client.get("/history", params={"range": "today"}, headers=user | {"X-Timezone": "UTC"}).json()["days"]
    assert days[0]["weight_kg"] == 71.5  # replaced, not duplicated
