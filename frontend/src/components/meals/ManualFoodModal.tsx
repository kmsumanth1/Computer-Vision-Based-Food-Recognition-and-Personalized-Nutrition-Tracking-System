import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';
import TextField from '../common/TextField';
import NutritionCard from '../food/NutritionCard';
import MealTypePicker from './MealTypePicker';
import { WEIGHT_LIMITS } from '../../constants/config';
import { MEAL_META } from '../../constants/meals';
import { foodService } from '../../services/food';
import { mealService } from '../../services/meals';
import { parseWeight } from '../../hooks/useWeightNutrition';
import { parseApiError } from '../../utils/apiError';
import { formatNumber, nowHHmm, todayISO } from '../../utils/format';
import { suggestMealType } from '../../utils/mealTime';
import type { CalculateWeightResponse } from '../../types/food';
import type { MealEntry, MealType } from '../../types/meal';

interface ManualFoodModalProps {
  open: boolean;
  /** Pre-selects a meal, e.g. when opened from the Lunch card. The user can still change it. */
  defaultMeal?: MealType;
  onClose: () => void;
  onAdded: (entry: MealEntry) => void;
}

interface FormErrors {
  name?: string;
  quantity?: string;
  weight?: string;
}

/** "Add Food Manually": name, quantity, weight and meal -> backend nutrition -> Add to Meal. */
export default function ManualFoodModal({ open, defaultMeal, onClose, onAdded }: ManualFoodModalProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('');
  const [pickedMeal, setPickedMeal] = useState<MealType | null>(null);
  const [time, setTime] = useState(nowHHmm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalculateWeightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setQuantity('1');
    setWeight('');
    setPickedMeal(defaultMeal ?? null);
    setTime(nowHHmm());
    setErrors({});
    setResult(null);
    setError(null);
    setCalculating(false);
    setSaving(false);
  }, [open, defaultMeal]);

  const suggested = useMemo(() => suggestMealType(time), [time]);
  const mealType = pickedMeal ?? suggested;

  async function calculate(event: FormEvent) {
    event.preventDefault();
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Enter the food name.';
    const q = Number(quantity);
    if (quantity.trim() === '' || !Number.isFinite(q) || q <= 0 || q > 100) next.quantity = 'Enter a quantity between 0.1 and 100.';
    const w = parseWeight(weight);
    if (w === null) next.weight = `Enter a weight between ${WEIGHT_LIMITS.min} and ${WEIGHT_LIMITS.max} g.`;
    setErrors(next);
    setError(null);
    if (Object.keys(next).length > 0 || w === null) return;

    setCalculating(true);
    try {
      setResult(await foodService.calculateWeight({ food_name: name.trim(), weight_g: w }));
    } catch (e) {
      setError(parseApiError(e, 'We couldn’t calculate the nutrition. Please try again.').message);
    } finally {
      setCalculating(false);
    }
  }

  async function addToMeal() {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const entry = await mealService.create({
        meal_type: mealType,
        food_id: result.food_id,
        food_name: result.food_name,
        quantity: Number(quantity),
        weight_g: result.weight_g,
        date: todayISO(),
        time,
        source: 'manual',
      });
      onAdded(entry);
    } catch (e) {
      setError(parseApiError(e, 'We couldn’t save this food. Please try again.').message);
      setSaving(false);
    }
  }

  const busy = calculating || saving;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add food manually"
      description={result ? 'Check the nutrition, then add it to your meal.' : 'Tell us what you ate and we’ll work out the nutrition.'}
      dismissible={!busy}
      footer={
        result ? (
          <>
            <Button variant="secondary" onClick={() => setResult(null)} disabled={saving} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Edit
            </Button>
            <Button onClick={addToMeal} loading={saving} loadingText="Saving meal…">
              Add to Meal
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" form="manual-food-form" loading={calculating} loadingText="Calculating nutrition…">
              Calculate nutrition
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-pine-50 p-4">
            <p className="font-display text-lg font-semibold text-ink">{result.food_name}</p>
            <p className="text-sm text-ink-soft">
              {formatNumber(Number(quantity), 1)} {Number(quantity) === 1 ? 'serving' : 'servings'} · {formatNumber(result.weight_g, 1)} g · {MEAL_META[mealType].label}
            </p>
          </div>
          <NutritionCard nutrition={result.nutrition} caption={`for ${formatNumber(result.weight_g, 1)} g`} />
          {error && <ErrorMessage title="Couldn’t save" message={error} />}
        </div>
      ) : (
        <form id="manual-food-form" onSubmit={calculate} noValidate className="space-y-4">
          <TextField
            label="Food name"
            placeholder="e.g. Chicken breast"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={calculating}
            autoFocus
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Quantity"
              type="number"
              inputMode="decimal"
              min={0.1}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              hint="Servings or pieces"
              error={errors.quantity}
              disabled={calculating}
            />
            <TextField
              label="Weight"
              type="number"
              inputMode="decimal"
              min={WEIGHT_LIMITS.min}
              max={WEIGHT_LIMITS.max}
              step="any"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              suffix="grams"
              hint="Total weight eaten"
              error={errors.weight}
              disabled={calculating}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Meal type</p>
            <MealTypePicker value={mealType} onChange={setPickedMeal} suggested={suggested} time={time} disabled={calculating} />
          </div>
          {error && <ErrorMessage title="Couldn’t calculate" message={error} />}
        </form>
      )}
    </Modal>
  );
}
