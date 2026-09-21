import { Link } from 'react-router-dom';
import { MEAL_META, MEAL_TYPES } from '../../constants/meals';
import { formatNumber, formatKcal } from '../../utils/format';
import { groupByMeal, sumEntries } from '../../utils/nutrition';
import { describeAmount } from '../../utils/meals';
import type { MealEntry } from '../../types/meal';

export default function MealSummary({ entries }: { entries: MealEntry[] }) {
  const groups = groupByMeal(entries);
  const total = sumEntries(entries).calories;

  return (
    <section className="card flex flex-col p-5 sm:p-6" aria-labelledby="meals-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="meals-heading" className="text-lg font-semibold text-ink">
          Today’s meals
        </h2>
        <Link to="/meals" className="text-sm font-semibold text-pine-700 hover:underline">
          View meals
        </Link>
      </div>

      <div className="mt-3 divide-y divide-line">
        {MEAL_TYPES.map((type) => {
          const { label, icon: Icon } = MEAL_META[type];
          const items = groups[type];
          const subtotal = sumEntries(items).calories;
          return (
            <div key={type} className="py-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <Icon className="h-4 w-4 text-pine-600" aria-hidden />
                  {label}
                </p>
                <p className="text-sm font-semibold tabular-nums text-ink">{items.length > 0 ? formatKcal(subtotal) : '–'}</p>
              </div>
              {items.length === 0 ? (
                <p className="mt-1 pl-6 text-sm text-ink-mute">Nothing logged yet.</p>
              ) : (
                <ul className="mt-1.5 space-y-1 pl-6">
                  {items.map((entry) => (
                    <li key={entry.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-ink-soft">
                        {entry.food_name} <span className="text-ink-mute">· {describeAmount(entry)}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-ink-mute">{formatNumber(entry.nutrition.calories)} kcal</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center justify-between rounded-xl bg-pine-900 px-4 py-3.5 text-white">
        <p className="font-semibold">Total calories consumed</p>
        <p className="font-display text-xl font-semibold tabular-nums text-volt">{formatKcal(total)}</p>
      </div>
    </section>
  );
}
