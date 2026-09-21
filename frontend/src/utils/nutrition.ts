import type { DailyTotals } from '../types/nutrition';
import type { MealEntry, MealType } from '../types/meal';
import { MEAL_TYPES } from '../constants/meals';

export const EMPTY_TOTALS: DailyTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

/** Adds up values the backend already calculated for each entry. */
export function sumEntries(entries: MealEntry[]): DailyTotals {
  return entries.reduce<DailyTotals>(
    (acc, entry) => ({
      calories: acc.calories + entry.nutrition.calories,
      protein_g: acc.protein_g + entry.nutrition.protein_g,
      carbs_g: acc.carbs_g + entry.nutrition.carbs_g,
      fat_g: acc.fat_g + entry.nutrition.fat_g,
    }),
    { ...EMPTY_TOTALS },
  );
}

export function groupByMeal(entries: MealEntry[]): Record<MealType, MealEntry[]> {
  const groups = Object.fromEntries(MEAL_TYPES.map((type) => [type, [] as MealEntry[]])) as Record<
    MealType,
    MealEntry[]
  >;
  for (const entry of entries) groups[entry.meal_type].push(entry);
  for (const type of MEAL_TYPES) groups[type].sort((a, b) => a.time.localeCompare(b.time));
  return groups;
}

export const remainingOf = (target: number, consumed: number): number => Math.max(0, target - consumed);
