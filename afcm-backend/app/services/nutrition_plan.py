"""
Daily calorie, macro and water targets. This is the only place these numbers are calculated.

Method:
  - Basal energy = average of Mifflin-St Jeor and Katch-McArdle (the second uses body fat %).
  - Daily energy (TDEE) = basal x activity factor, chosen from the daily-steps band.
  - Cut = TDEE - 20 %, Maintain = TDEE, Bulk = TDEE + 10 %, each rounded to the nearest 10 kcal.
  - Cut never drops below a safety floor (1500 kcal male / 1200 kcal female).
  - Protein: 2.2 / 2.0 / 1.8 g per kg for cut / bulk / maintain. Fat: 25 % of calories. Carbs: the rest.
  - Water: 35 ml per kg (rounded to 250 ml), +500 ml for the high-activity band.

These are general estimates, not medical advice. Tune the constants below if you use a different approach.
"""
import math

from app.models.user import Profile
from app.schemas.nutrition import CalorieTargets, MacroTargets, NutritionPlan

ACTIVITY_FACTOR = {"low": 1.35, "moderate": 1.55, "high": 1.75}
CUT_FACTOR = 0.80
BULK_FACTOR = 1.10
MIN_CUT_CALORIES = {"male": 1500, "female": 1200}
PROTEIN_G_PER_KG = {"cut": 2.2, "bulk": 2.0, "maintain": 1.8}
FAT_SHARE_OF_CALORIES = 0.25
WATER_ML_PER_KG = 35
HIGH_ACTIVITY_WATER_BONUS_ML = 500


def _round_half_up(value: float) -> int:
    return int(math.floor(value + 0.5))


def _round10(value: float) -> int:
    return _round_half_up(value / 10) * 10


def compute_plan(profile: Profile) -> NutritionPlan:
    w, h, age, bf = profile.weight_kg, profile.height_cm, profile.age, profile.body_fat_percentage

    mifflin = 10 * w + 6.25 * h - 5 * age + (5 if profile.sex == "male" else -161)
    katch = 370 + 21.6 * (w * (1 - bf / 100))
    tdee = ((mifflin + katch) / 2) * ACTIVITY_FACTOR[profile.activity_level]

    maintain = _round10(tdee)
    cut = min(maintain, max(_round10(tdee * CUT_FACTOR), MIN_CUT_CALORIES[profile.sex]))
    bulk = _round10(tdee * BULK_FACTOR)
    targets = CalorieTargets(cut=cut, maintain=maintain, bulk=bulk)
    daily = getattr(targets, profile.goal)

    protein_g = _round_half_up(w * PROTEIN_G_PER_KG[profile.goal])
    fat_g = _round_half_up(daily * FAT_SHARE_OF_CALORIES / 9)
    carbs_g = max(0, _round_half_up((daily - protein_g * 4 - fat_g * 9) / 4))

    water = _round_half_up(w * WATER_ML_PER_KG / 250) * 250
    if profile.activity_level == "high":
        water += HIGH_ACTIVITY_WATER_BONUS_ML

    return NutritionPlan(
        goal=profile.goal,
        daily_calories=daily,
        calorie_targets=targets,
        macro_targets=MacroTargets(protein_g=protein_g, carbs_g=carbs_g, fat_g=fat_g),
        water_target_ml=water,
    )
