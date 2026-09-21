import { useState } from 'react';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';
import TextField from '../common/TextField';
import NutritionCard from '../food/NutritionCard';
import WeightInput from '../food/WeightInput';
import MealTypePicker from './MealTypePicker';
import { mealService } from '../../services/meals';
import { useWeightNutrition } from '../../hooks/useWeightNutrition';
import { parseApiError } from '../../utils/apiError';
import { formatNumber } from '../../utils/format';
import type { MealEntry, MealType } from '../../types/meal';

interface EditMealModalProps {
  entry: MealEntry | null;
  onClose: () => void;
  onSaved: (entry: MealEntry) => void;
}

/** Wrapper so the form (and its weight hook) starts fresh for every entry. */
export default function EditMealModal({ entry, onClose, onSaved }: EditMealModalProps) {
  return entry ? <EditMealDialog key={entry.id} entry={entry} onClose={onClose} onSaved={onSaved} /> : null;
}

function EditMealDialog({ entry, onClose, onSaved }: { entry: MealEntry; onClose: () => void; onSaved: (entry: MealEntry) => void }) {
  const [mealType, setMealType] = useState<MealType>(entry.meal_type);
  const [quantity, setQuantity] = useState(String(entry.quantity));
  const [time, setTime] = useState(entry.time);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Changing the weight asks the backend for new nutrition values.
  const weight = useWeightNutrition({
    foodId: entry.food_id,
    initialWeightG: entry.weight_g,
    initialNutrition: entry.nutrition,
  });

  const quantityValue = Number(quantity);
  const quantityError =
    quantity.trim() === '' || !Number.isFinite(quantityValue) || quantityValue <= 0 || quantityValue > 100
      ? 'Enter a quantity between 0.1 and 100.'
      : null;
  const canSave = !quantityError && !weight.validationError && weight.isCurrent && !weight.calculating && !weight.error && Boolean(time);

  async function save() {
    if (!canSave || weight.weightG === null) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await mealService.update(entry.id, {
        meal_type: mealType,
        quantity: quantityValue,
        weight_g: weight.weightG,
        time,
      });
      onSaved(updated);
    } catch (e) {
      setError(parseApiError(e, 'We couldn’t save your changes. Please try again.').message);
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit ${entry.food_name}`}
      description="Change the weight, quantity or meal."
      size="lg"
      dismissible={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave} loading={saving} loadingText="Saving changes…">
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <WeightInput
          weightInput={weight.weightInput}
          weightG={weight.weightG}
          onChange={weight.setWeightInput}
          referenceWeightG={entry.weight_g}
          calculating={weight.calculating}
          validationError={weight.validationError}
          error={weight.error}
          onRetry={weight.retry}
          disabled={saving}
        />

        <NutritionCard
          nutrition={weight.nutrition}
          caption={weight.weightG !== null ? `for ${formatNumber(weight.weightG, 1)} g` : undefined}
          updating={weight.calculating || !weight.isCurrent}
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
            error={quantityError}
            disabled={saving}
          />
          <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={saving} />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Meal</p>
          <MealTypePicker value={mealType} onChange={setMealType} disabled={saving} />
        </div>

        {error && <ErrorMessage title="Couldn’t save" message={error} />}
      </div>
    </Modal>
  );
}
