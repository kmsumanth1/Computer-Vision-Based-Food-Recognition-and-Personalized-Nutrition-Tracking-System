import { Cookie, Moon, Sun, Sunrise, type LucideIcon } from 'lucide-react';
import type { MealType } from '../types/meal';

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

export const MEAL_META: Record<MealType, { label: string; icon: LucideIcon; timeHint: string }> = {
  breakfast: { label: 'Breakfast', icon: Sunrise, timeHint: 'Morning' },
  lunch: { label: 'Lunch', icon: Sun, timeHint: 'Midday' },
  snacks: { label: 'Snacks', icon: Cookie, timeHint: 'Afternoon' },
  dinner: { label: 'Dinner', icon: Moon, timeHint: 'Evening' },
};
