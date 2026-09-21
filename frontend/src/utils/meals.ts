import { formatNumber } from './format';
import type { MealEntry } from '../types/meal';

/** "240 g" or "2 × 60 g" when more than one piece was logged. */
export function describeAmount(entry: Pick<MealEntry, 'quantity' | 'weight_g'>): string {
  const weight = `${formatNumber(entry.weight_g, 1)} g`;
  return entry.quantity > 1 ? `${formatNumber(entry.quantity, 1)} servings · ${weight}` : weight;
}
