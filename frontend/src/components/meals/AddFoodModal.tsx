import { useEffect, useMemo, useState } from 'react';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';
import TextField from '../common/TextField';
import MealTypePicker from './MealTypePicker';
import { mealService } from '../../services/meals';
import { parseApiError } from '../../utils/apiError';
import { formatNumber, nowHHmm, todayISO } from '../../utils/format';
import { suggestMealType } from '../../utils/mealTime';
import type { FoodSource, Nutrition } from '../../types/food';
import type { MealEntry, MealType } from '../../types/meal';

/** A food ready to be saved. `nutrition` is already calculated by the backend for `weight_g`. */
export interface PendingMealFood {
  food_id: string;
  food_name: string;
  weight_g: number;
  nutrition: Nutrition;
  source: FoodSource;
}

interface AddFoodModalProps {
  open: boolean;
  food: PendingMealFood;
  onClose: () => void;
  onAdded: (entry: MealEntry) => void;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-mute">{label}</dt>
      <dd className="font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

/** "Add to Meal": confirm the food, pick the meal and save it. */
export default function AddFoodModal({ open, food, onClose, onAdded }: AddFoodModalProps) {
  const [time, setTime] = useState(nowHHmm);
  const [pickedMeal, setPickedMeal] = useState<MealType | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start fresh each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setTime(nowHHmm());
    setPickedMeal(null);
    setQuantity('1');
    setError(null);
    setSaving(false);
  }, [open]);

  const suggested = useMemo(() => suggestMealType(time || nowHHmm()), [time]);
  // Follow the time until the user chooses a meal themselves.
  const mealType = pickedMeal ?? suggested;

  const quantityValue = Number(quantity);
  const quantityError =
    quantity.trim() === '' || !Number.isFinite(quantityValue) || quantityValue <= 0 || quantityValue > 100
      ? 'Enter a quantity between 0.1 and 100.'
      : null;

  async function save() {
    if (quantityError || !time) return;
    setSaving(true);
    setError(null);
    try {
      const entry = await mealService.create({
        meal_type: mealType,
        food_id: food.food_id,
        food_name: food.food_name,
        quantity: quantityValue,
        weight_g: food.weight_g,
        date: todayISO(),
        time,
        source: food.source,
      });
      onAdded(entry);
    } catch (e) {
      setError(parseApiError(e, 'We couldn’t save this food. Please try again.').message);
      setSaving(false);
    }
  }

  const { nutrition } = food;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to meal"
      description="Check the details and choose a meal."
      dismissible={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} loadingText="Saving meal…" disabled={Boolean(quantityError) || !time}>
            Save to meal
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl bg-pine-50 p-4">
          <p className="font-display text-lg font-semibold text-ink">{food.food_name}</p>
          <dl className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
            <Fact label="Weight" value={`${formatNumber(food.weight_g, 1)} g`} />
            <Fact label="Calories" value={`${formatNumber(nutrition.calories)} kcal`} />
            <Fact label="Protein" value={`${formatNumber(nutrition.protein_g, 1)} g`} />
            <Fact label="Carbs" value={`${formatNumber(nutrition.carbs_g, 1)} g`} />
            <Fact label="Fat" value={`${formatNumber(nutrition.fat_g, 1)} g`} />
          </dl>
        </div>

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
            error={quantityError}
            disabled={saving}
          />
          <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={saving} />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Meal</p>
          <MealTypePicker value={mealType} onChange={setPickedMeal} suggested={suggested} time={time} disabled={saving} />
        </div>

        {error && <ErrorMessage title="Couldn’t save" message={error} />}
      </div>
    </Modal>
  );
}
