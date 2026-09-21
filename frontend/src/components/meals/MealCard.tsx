import { Plus } from 'lucide-react';
import Button from '../common/Button';
import MealItem from './MealItem';
import { MEAL_META } from '../../constants/meals';
import { formatKcal } from '../../utils/format';
import { sumEntries } from '../../utils/nutrition';
import type { MealEntry, MealType } from '../../types/meal';

interface MealCardProps {
  type: MealType;
  entries: MealEntry[];
  onAdd: (type: MealType) => void;
  onEdit: (entry: MealEntry) => void;
  onDelete: (entry: MealEntry) => void;
}

export default function MealCard({ type, entries, onAdd, onEdit, onDelete }: MealCardProps) {
  const { label, icon: Icon } = MEAL_META[type];
  const total = sumEntries(entries).calories;

  return (
    <section className="card flex flex-col p-5 sm:p-6" aria-labelledby={`meal-${type}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`meal-${type}`} className="flex items-center gap-2.5 text-lg font-semibold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-50 text-pine-600">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          {label}
        </h2>
        <Button size="sm" variant="secondary" onClick={() => onAdd(type)} leftIcon={<Plus className="h-4 w-4" />} aria-label={`Add food to ${label}`}>
          Add food
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-mute">Nothing logged for {label.toLowerCase()} yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {entries.map((entry) => (
            <MealItem key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-line pt-3.5">
        <p className="text-sm font-semibold text-ink-soft">{label} total</p>
        <p className="font-display text-lg font-semibold tabular-nums text-ink">{formatKcal(total)}</p>
      </div>
    </section>
  );
}
