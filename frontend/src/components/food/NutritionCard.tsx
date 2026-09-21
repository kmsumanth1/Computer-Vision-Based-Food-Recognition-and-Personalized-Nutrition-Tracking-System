import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import type { Nutrition } from '../../types/food';

interface NutritionCardProps {
  nutrition: Nutrition;
  /** e.g. "for 240 g" */
  caption?: string;
  /** True while the backend is recalculating; the numbers are dimmed */
  updating?: boolean;
  className?: string;
}

function MacroTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={cn('rounded-xl p-3.5', tone)}>
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-ink">
        {formatNumber(value, 1)}
        <span className="ml-0.5 text-sm font-medium text-ink-mute">g</span>
      </dd>
    </div>
  );
}

/** Calories, macros, fiber and other nutrients exactly as the backend returned them. */
export default function NutritionCard({ nutrition, caption, updating, className }: NutritionCardProps) {
  return (
    <section
      aria-label="Nutrition information"
      aria-busy={updating || undefined}
      className={cn('transition-opacity duration-200', updating && 'opacity-50', className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">Nutrition information</h3>
        {caption && <p className="text-sm text-ink-mute">{caption}</p>}
      </div>

      <div className="mt-3 rounded-2xl bg-pine-900 p-4 text-white">
        <p className="text-sm text-white/70">Calories</p>
        <p className="font-display text-4xl font-semibold tabular-nums">
          {formatNumber(nutrition.calories)} <span className="text-lg font-medium text-volt">kcal</span>
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MacroTile label="Protein" value={nutrition.protein_g} tone="bg-protein-soft" />
        <MacroTile label="Carbohydrates" value={nutrition.carbs_g} tone="bg-carbs-soft" />
        <MacroTile label="Fat" value={nutrition.fat_g} tone="bg-fat-soft" />
        <MacroTile label="Fiber" value={nutrition.fiber_g} tone="bg-pine-50" />
      </dl>

      {nutrition.other_nutrients.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-ink">Other nutrients</h4>
          <dl className="mt-2 divide-y divide-line rounded-xl border border-line">
            {nutrition.other_nutrients.map((n) => (
              <div key={n.name} className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm">
                <dt className="text-ink-soft">{n.name}</dt>
                <dd className="font-medium tabular-nums text-ink">
                  {formatNumber(n.amount, 1)} {n.unit}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
