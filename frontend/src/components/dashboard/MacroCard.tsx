import ProgressBar from '../common/ProgressBar';
import { formatNumber, percentOf } from '../../utils/format';
import { remainingOf } from '../../utils/nutrition';
import type { DailyTotals, MacroTargets } from '../../types/nutrition';

interface MacroCardProps {
  totals: DailyTotals;
  targets: MacroTargets;
}

interface MacroRow {
  key: string;
  label: string;
  consumed: number;
  target: number;
  bar: string;
  track: string;
  dot: string;
}

export default function MacroCard({ totals, targets }: MacroCardProps) {
  const rows: MacroRow[] = [
    { key: 'protein', label: 'Protein', consumed: totals.protein_g, target: targets.protein_g, bar: 'bg-protein', track: 'bg-protein-soft', dot: 'bg-protein' },
    { key: 'carbs', label: 'Carbohydrates', consumed: totals.carbs_g, target: targets.carbs_g, bar: 'bg-carbs', track: 'bg-carbs-soft', dot: 'bg-carbs' },
    { key: 'fat', label: 'Fats', consumed: totals.fat_g, target: targets.fat_g, bar: 'bg-fat', track: 'bg-fat-soft', dot: 'bg-fat' },
  ];

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="macros-heading">
      <h2 id="macros-heading" className="text-lg font-semibold text-ink">
        Macronutrients
      </h2>
      <div className="mt-4 grid gap-6 md:grid-cols-3 md:gap-8">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-semibold text-ink">
                <span className={`h-2.5 w-2.5 rounded-full ${row.dot}`} aria-hidden />
                {row.label}
              </p>
              <p className="text-sm tabular-nums text-ink-mute">{Math.round(percentOf(row.consumed, row.target))}%</p>
            </div>
            <ProgressBar value={percentOf(row.consumed, row.target)} color={row.bar} trackClassName={row.track} className="mt-2.5" label={row.label} />
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-ink-mute">Consumed</dt>
                <dd className="font-semibold tabular-nums text-ink">{formatNumber(row.consumed)} g</dd>
              </div>
              <div>
                <dt className="text-ink-mute">Target</dt>
                <dd className="font-semibold tabular-nums text-ink">{formatNumber(row.target)} g</dd>
              </div>
              <div>
                <dt className="text-ink-mute">Remaining</dt>
                <dd className="font-semibold tabular-nums text-ink">{formatNumber(remainingOf(row.target, row.consumed))} g</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
