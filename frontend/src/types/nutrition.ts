import type { MealEntry } from './meal';
import type { FitnessGoal } from './user';

export interface CalorieTargets {
  cut: number;
  maintain: number;
  bulk: number;
}

export interface MacroTargets {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

/** Returned by POST /nutrition/calculate (and embedded in dashboard/profile responses). */
export interface NutritionPlan {
  goal: FitnessGoal;
  /** Target for the selected goal */
  daily_calories: number;
  calorie_targets: CalorieTargets;
  macro_targets: MacroTargets;
  water_target_ml: number;
}

export interface DailyTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface WaterSummary {
  date: string;
  consumed_ml: number;
  target_ml: number;
}

export interface AddWaterRequest {
  amount_ml: number;
  date: string;
}

/** GET /dashboard */
export interface DashboardData {
  date: string;
  plan: NutritionPlan;
  totals: DailyTotals;
  water: WaterSummary;
  entries: MealEntry[];
}

export type HistoryRange = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days';

export interface HistoryDay {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_ml: number;
  /** Logged body weight for that day, if any */
  weight_kg: number | null;
}

/** GET /history?range= */
export interface HistoryResponse {
  range: HistoryRange;
  days: HistoryDay[];
  calorie_target: number | null;
  water_target_ml: number | null;
}
