import type { MealType } from '../types/meal';

/**
 * Suggests a meal category from a local time (HH:mm).
 * This is only a suggestion; the user can always pick the category manually.
 *
 *   04:00 to 10:59  Breakfast
 *   11:00 to 15:29  Lunch
 *   15:30 to 18:59  Snacks
 *   19:00 to 03:59  Dinner
 */
export function suggestMealType(time: string): MealType {
  const [h, m] = time.split(':').map(Number);
  const minutes = (h ?? 0) * 60 + (m ?? 0);
  if (minutes >= 4 * 60 && minutes < 11 * 60) return 'breakfast';
  if (minutes >= 11 * 60 && minutes < 15 * 60 + 30) return 'lunch';
  if (minutes >= 15 * 60 + 30 && minutes < 19 * 60) return 'snacks';
  return 'dinner';
}
