/**
 * MOCK BACKEND LOGIC. In production these calculations happen in FastAPI.
 * Nothing in src/components or src/pages imports from this folder.
 */
import type { FoodItem, Nutrition } from '../types/food';
import type { NutritionPlan } from '../types/nutrition';
import type { UserProfile } from '../types/user';
import type { CatalogFood } from './foodCatalog';

const round1 = (n: number) => Math.round(n * 10) / 10;

export function nutritionFor(food: CatalogFood, weightG: number): Nutrition {
  const f = weightG / 100;
  const d = food.per100;
  return {
    calories: Math.round(d.calories * f),
    protein_g: round1(d.protein_g * f),
    carbs_g: round1(d.carbs_g * f),
    fat_g: round1(d.fat_g * f),
    fiber_g: round1(d.fiber_g * f),
    other_nutrients: [
      { name: 'Sugar', amount: round1(d.sugar_g * f), unit: 'g' },
      { name: 'Saturated fat', amount: round1(d.sat_fat_g * f), unit: 'g' },
      { name: 'Sodium', amount: Math.round(d.sodium_mg * f), unit: 'mg' },
      { name: 'Cholesterol', amount: Math.round(d.cholesterol_mg * f), unit: 'mg' },
    ],
  };
}

export function toFoodItem(food: CatalogFood, confidence?: number): FoodItem {
  return {
    food_id: food.id,
    name: food.name,
    brand: food.brand ?? null,
    barcode: food.barcode ?? null,
    confidence: confidence ?? null,
    reference_weight_g: food.reference_weight_g,
    serving_size_label: food.serving_size_label ?? null,
    nutrition: nutritionFor(food, food.reference_weight_g),
  };
}

const ACTIVITY_FACTOR = { low: 1.35, moderate: 1.55, high: 1.75 } as const;
const round10 = (n: number) => Math.round(n / 10) * 10;

/** Average of Mifflin-St Jeor and Katch-McArdle, scaled by activity. Demo only. */
export function computePlan(profile: UserProfile): NutritionPlan {
  const { weight_kg: w, height_cm: h, age, sex, body_fat_percentage: bf } = profile;
  const mifflin = 10 * w + 6.25 * h - 5 * age + (sex === 'male' ? 5 : -161);
  const katch = 370 + 21.6 * (w * (1 - bf / 100));
  const tdee = ((mifflin + katch) / 2) * ACTIVITY_FACTOR[profile.activity_level];

  const calorie_targets = {
    cut: round10(tdee * 0.8),
    maintain: round10(tdee),
    bulk: round10(tdee * 1.1),
  };
  const daily = calorie_targets[profile.goal];

  const proteinPerKg = profile.goal === 'cut' ? 2.2 : profile.goal === 'bulk' ? 2.0 : 1.8;
  const protein_g = Math.round(w * proteinPerKg);
  const fat_g = Math.round((daily * 0.25) / 9);
  const carbs_g = Math.max(0, Math.round((daily - protein_g * 4 - fat_g * 9) / 4));
  const waterBase = Math.round((w * 35) / 250) * 250;

  return {
    goal: profile.goal,
    daily_calories: daily,
    calorie_targets,
    macro_targets: { protein_g, carbs_g, fat_g },
    water_target_ml: waterBase + (profile.activity_level === 'high' ? 500 : 0),
  };
}
