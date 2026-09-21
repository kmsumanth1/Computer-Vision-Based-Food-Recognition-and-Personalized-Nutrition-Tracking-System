import { useCallback, useEffect, useRef, useState } from 'react';
import type { Nutrition } from '../types/food';
import type { ApiErrorInfo } from '../types/api';
import { foodService } from '../services/food';
import { parseApiError } from '../utils/apiError';
import { WEIGHT_LIMITS, WEIGHT_RECALC_DEBOUNCE_MS } from '../constants/config';

interface Options {
  foodId: string;
  initialWeightG: number;
  initialNutrition: Nutrition;
}

/** Returns the number if it is a valid weight, otherwise null. */
export function parseWeight(input: string): number | null {
  if (input.trim() === '') return null;
  const value = Number(input);
  if (!Number.isFinite(value) || value < WEIGHT_LIMITS.min || value > WEIGHT_LIMITS.max) return null;
  return value;
}

/**
 * Keeps a weight input and the nutrition for that weight in sync.
 * Whenever the weight changes, the backend recalculates nutrition (debounced).
 * Nothing is calculated in the browser.
 */
export function useWeightNutrition({ foodId, initialWeightG, initialNutrition }: Options) {
  const [weightInput, setWeightInput] = useState(String(initialWeightG));
  const [nutrition, setNutrition] = useState<Nutrition>(initialNutrition);
  const [calculatedFor, setCalculatedFor] = useState(initialWeightG);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<ApiErrorInfo | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const requestId = useRef(0);

  const weightG = parseWeight(weightInput);
  const validationError =
    weightInput.trim() === ''
      ? 'Enter the food weight.'
      : weightG === null
        ? `Enter a weight between ${WEIGHT_LIMITS.min} and ${WEIGHT_LIMITS.max} g.`
        : null;

  useEffect(() => {
    if (weightG === null) {
      requestId.current++;
      setCalculating(false);
      return;
    }
    if (weightG === calculatedFor) {
      requestId.current++;
      setCalculating(false);
      setError(null);
      return;
    }

    const id = ++requestId.current;
    setCalculating(true);
    setError(null);
    const timer = window.setTimeout(async () => {
      try {
        const result = await foodService.calculateWeight({ food_id: foodId, weight_g: weightG });
        if (id !== requestId.current) return;
        setNutrition(result.nutrition);
        setCalculatedFor(weightG);
      } catch (e) {
        if (id === requestId.current) setError(parseApiError(e));
      } finally {
        if (id === requestId.current) setCalculating(false);
      }
    }, WEIGHT_RECALC_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [weightG, calculatedFor, foodId, retryTick]);

  const retry = useCallback(() => setRetryTick((n) => n + 1), []);

  return {
    weightInput,
    setWeightInput,
    /** Valid weight in grams, or null while the input is invalid */
    weightG,
    nutrition,
    calculating,
    error,
    validationError,
    /** True when `nutrition` matches the weight currently typed */
    isCurrent: weightG !== null && weightG === calculatedFor,
    retry,
  };
}
