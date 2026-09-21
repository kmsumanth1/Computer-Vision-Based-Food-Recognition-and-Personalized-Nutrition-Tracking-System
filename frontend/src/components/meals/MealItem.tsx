import { Pencil, Trash2 } from 'lucide-react';
import { describeAmount } from '../../utils/meals';
import { formatNumber, formatTime12 } from '../../utils/format';
import type { MealEntry } from '../../types/meal';

interface MealItemProps {
  entry: MealEntry;
  onEdit: (entry: MealEntry) => void;
  onDelete: (entry: MealEntry) => void;
}

export default function MealItem({ entry, onEdit, onDelete }: MealItemProps) {
  const { nutrition } = entry;
  return (
    <li className="flex items-start gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{entry.food_name}</p>
        <p className="text-sm text-ink-mute">
          {describeAmount(entry)} · {formatTime12(entry.time)}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          <span className="font-semibold tabular-nums text-ink">{formatNumber(nutrition.protein_g, 1)} g</span> protein
          <span className="mx-1.5 text-line">|</span>
          <span className="tabular-nums">{formatNumber(nutrition.carbs_g, 1)} g</span> carbs
          <span className="mx-1.5 text-line">|</span>
          <span className="tabular-nums">{formatNumber(nutrition.fat_g, 1)} g</span> fat
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="font-display text-lg font-semibold tabular-nums text-ink">
          {formatNumber(nutrition.calories)} <span className="text-sm font-medium text-ink-mute">kcal</span>
        </p>
        <div className="-mr-2 flex">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="rounded-lg p-2 text-ink-mute hover:bg-pine-50 hover:text-pine-700"
            aria-label={`Edit ${entry.food_name} or change its weight`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="rounded-lg p-2 text-ink-mute hover:bg-protein-soft hover:text-protein"
            aria-label={`Delete ${entry.food_name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
