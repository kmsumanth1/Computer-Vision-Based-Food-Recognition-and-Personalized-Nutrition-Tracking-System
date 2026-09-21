import type { DailyTotals } from './nutrition';
import type { FoodSource, Nutrition } from './food';

export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export interface MealEntry {
  id: string;
  meal_type: MealType;
  food_id: string;
  food_name: string;
  /** Number of pieces/servings (informational) */
  quantity: number;
  /** Total weight eaten */
  weight_g: number;
  /** Nutrition for `weight_g`, calculated by the backend */
  nutrition: Nutrition;
  /** Local date, YYYY-MM-DD */
  date: string;
  /** Local time, HH:mm */
  time: string;
  source: FoodSource;
}

/** POST /meals. The backend calculates nutrition from food_id + weight_g. */
export interface CreateMealRequest {
  meal_type: MealType;
  food_id: string;
  food_name: string;
  quantity: number;
  weight_g: number;
  date: string;
  time: string;
  source: FoodSource;
}

/** PUT /meals/{id}. The backend recalculates nutrition when weight changes. */
export interface UpdateMealRequest {
  meal_type?: MealType;
  quantity?: number;
  weight_g?: number;
  time?: string;
}

/** GET /meals */
export interface MealsResponse {
  date: string;
  totals: DailyTotals;
  entries: MealEntry[];
}
