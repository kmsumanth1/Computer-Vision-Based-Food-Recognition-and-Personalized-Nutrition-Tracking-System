import { useState } from 'react';
import { CheckCircle2, ScanLine } from 'lucide-react';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';
import NutritionCard from './NutritionCard';
import WeightInput from './WeightInput';
import AddFoodModal from '../meals/AddFoodModal';
import { LOW_CONFIDENCE_THRESHOLD } from '../../constants/config';
import { useWeightNutrition } from '../../hooks/useWeightNutrition';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import type { FoodItem, FoodSource } from '../../types/food';
import type { MealEntry } from '../../types/meal';

interface FoodResultProps {
  food: FoodItem;
  source: FoodSource;
  onAdded: (entry: MealEntry) => void;
  onStartOver: () => void;
  onAddManually: () => void;
}

/** What the AI (or barcode lookup) found, with an editable weight and an Add to Meal action. */
export default function FoodResult({ food, source, onAdded, onStartOver, onAddManually }: FoodResultProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const weight = useWeightNutrition({
    foodId: food.food_id,
    initialWeightG: food.reference_weight_g,
    initialNutrition: food.nutrition,
  });

  const hasConfidence = typeof food.confidence === 'number';
  const lowConfidence = hasConfidence && (food.confidence as number) < LOW_CONFIDENCE_THRESHOLD;
  const isPackaged = source === 'barcode';
  const canAdd = weight.isCurrent && !weight.calculating && !weight.validationError && !weight.error;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <section className="card p-5 sm:p-6">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-pine-600">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {isPackaged ? 'Product found' : 'Food detected'}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">{food.name}</h2>

        {isPackaged ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {food.brand && (
              <div>
                <dt className="text-ink-mute">Brand</dt>
                <dd className="font-medium text-ink">{food.brand}</dd>
              </div>
            )}
            {food.serving_size_label && (
              <div>
                <dt className="text-ink-mute">Serving size</dt>
                <dd className="font-medium text-ink">{food.serving_size_label}</dd>
              </div>
            )}
            {food.barcode && (
              <div className="col-span-2">
                <dt className="text-ink-mute">Barcode</dt>
                <dd className="font-medium tabular-nums text-ink">{food.barcode}</dd>
              </div>
            )}
          </dl>
        ) : (
          hasConfidence && (
            <div className="mt-3 flex items-center gap-3">
              <div
                role="progressbar"
                aria-label="AI confidence"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round((food.confidence as number) * 100)}
                className="h-2 w-32 overflow-hidden rounded-full bg-pine-50"
              >
                <div
                  className={cn('h-full rounded-full', lowConfidence ? 'bg-carbs' : 'bg-pine-500')}
                  style={{ width: `${Math.round((food.confidence as number) * 100)}%` }}
                />
              </div>
              <p className="text-sm text-ink-soft">
                Confidence <span className="font-semibold tabular-nums text-ink">{formatNumber((food.confidence as number) * 100)}%</span>
              </p>
            </div>
          )
        )}

        {lowConfidence && (
          <ErrorMessage
            tone="warning"
            className="mt-4"
            title="The AI isn’t very sure about this one"
            message="Check that the name is right before you add it. If it’s wrong, add the food manually instead."
            action={
              <Button size="sm" variant="secondary" onClick={onAddManually}>
                Add food manually
              </Button>
            }
          />
        )}

        <div className="mt-6 border-t border-line pt-5">
          <WeightInput
            weightInput={weight.weightInput}
            weightG={weight.weightG}
            onChange={weight.setWeightInput}
            referenceWeightG={food.reference_weight_g}
            calculating={weight.calculating}
            validationError={weight.validationError}
            error={weight.error}
            onRetry={weight.retry}
            description={
              isPackaged
                ? 'Enter how much you ate and the nutrition updates.'
                : 'The AI can’t know exactly how much you have. Enter the real weight and the nutrition updates.'
            }
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" onClick={() => setModalOpen(true)} disabled={!canAdd} className="sm:flex-1">
            Add to Meal
          </Button>
          <Button size="lg" variant="secondary" onClick={onStartOver} leftIcon={<ScanLine className="h-4 w-4" />}>
            {isPackaged ? 'Scan another' : 'Analyze another'}
          </Button>
        </div>
        {weight.calculating && <p className="mt-2 text-sm text-ink-mute">Updating nutrition for the new weight…</p>}
      </section>

      <div className="card p-5 sm:p-6">
        <NutritionCard
          nutrition={weight.nutrition}
          caption={weight.weightG !== null ? `for ${formatNumber(weight.weightG, 1)} g` : undefined}
          updating={weight.calculating || !weight.isCurrent}
        />
      </div>

      <AddFoodModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        food={{
          food_id: food.food_id,
          food_name: food.name,
          weight_g: weight.weightG ?? food.reference_weight_g,
          nutrition: weight.nutrition,
          source,
        }}
        onAdded={(entry) => {
          setModalOpen(false);
          onAdded(entry);
        }}
      />
    </div>
  );
}
