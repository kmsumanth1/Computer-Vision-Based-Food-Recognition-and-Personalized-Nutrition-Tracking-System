import pytest

from app.models import Profile
from app.services.nutrition_plan import compute_plan
from tests.conftest import PROFILE


def make_profile(**overrides) -> Profile:
    return Profile(**{**PROFILE, **overrides})


def test_plan_matches_hand_calculation():
    # Mifflin 1678.75, Katch 1676.37 -> average 1677.56 x 1.55 = 2600.2
    plan = compute_plan(make_profile())
    assert plan.calorie_targets.maintain == 2600
    assert plan.calorie_targets.cut == 2080
    assert plan.calorie_targets.bulk == 2860
    assert plan.daily_calories == 2080  # goal = cut
    assert plan.macro_targets.protein_g == 158  # 72 kg x 2.2
    assert plan.macro_targets.fat_g == 58  # 25 % of 2080 kcal / 9
    assert plan.macro_targets.carbs_g == 232
    assert plan.water_target_ml == 2500  # 72 x 35 = 2520 -> nearest 250


def test_goal_selects_daily_target():
    assert compute_plan(make_profile(goal="maintain")).daily_calories == 2600
    assert compute_plan(make_profile(goal="bulk")).daily_calories == 2860


def test_high_activity_adds_water():
    assert compute_plan(make_profile(activity_level="high")).water_target_ml == 3000


@pytest.mark.parametrize("sex,floor", [("male", 1500), ("female", 1200)])
def test_cut_never_below_safety_floor(sex, floor):
    tiny = make_profile(sex=sex, age=60, height_cm=140, weight_kg=35, body_fat_percentage=30, activity_level="low")
    plan = compute_plan(tiny)
    assert plan.calorie_targets.cut >= min(floor, plan.calorie_targets.maintain)
    assert plan.calorie_targets.cut <= plan.calorie_targets.maintain


def test_profile_lifecycle(client, auth):
    # not set up yet
    res = client.get("/profile", headers=auth)
    assert res.status_code == 404 and res.json()["detail"]["code"] == "PROFILE_NOT_FOUND"
    assert client.post("/nutrition/calculate", headers=auth).status_code == 404

    res = client.post("/profile/setup", json=PROFILE, headers=auth)
    assert res.status_code == 200
    assert res.json() == {"profile": PROFILE | {"height_cm": 175.0, "weight_kg": 72.0, "body_fat_percentage": 16.0}, "plan": None}

    plan = client.post("/nutrition/calculate", headers=auth).json()
    assert plan["daily_calories"] == 2080 and plan["goal"] == "cut"

    got = client.get("/profile", headers=auth).json()
    assert got["plan"] == plan

    # Changing goal and weight recalculates the plan
    res = client.put("/profile", json={"goal": "bulk", "weight_kg": 75}, headers=auth)
    assert res.status_code == 200
    updated = res.json()
    assert updated["profile"]["goal"] == "bulk" and updated["profile"]["weight_kg"] == 75
    assert updated["profile"]["name"] == "Ravi Kumar"  # untouched fields stay
    assert updated["plan"]["goal"] == "bulk" and updated["plan"]["daily_calories"] > plan["daily_calories"]


def test_profile_name_updates_account_name(client, user):
    client.put("/profile", json={"name": "Ravi K"}, headers=user)
    login = client.post("/auth/login", json={"email": "ravi@example.com", "password": "password123"})
    assert login.json()["user"]["name"] == "Ravi K"


def test_profile_validation(client, auth):
    for bad in ({"age": 5}, {"weight_kg": 500}, {"sex": "other"}, {"goal": "shred"}):
        res = client.post("/profile/setup", json=PROFILE | bad, headers=auth)
        assert res.status_code == 422, bad
    assert client.put("/profile", json={"age": 3}, headers=auth).status_code in (404, 422)


def test_setup_twice_replaces_profile(client, auth):
    client.post("/profile/setup", json=PROFILE, headers=auth)
    res = client.post("/profile/setup", json=PROFILE | {"goal": "maintain"}, headers=auth)
    assert res.status_code == 200
    assert client.get("/profile", headers=auth).json()["profile"]["goal"] == "maintain"
