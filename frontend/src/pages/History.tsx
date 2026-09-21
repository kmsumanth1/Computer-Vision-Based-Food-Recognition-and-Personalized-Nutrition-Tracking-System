import { useState } from 'react';
import { History as HistoryIcon } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';
import Loading from '../components/common/Loading';
import Segmented from '../components/common/Segmented';
import CalorieChart from '../components/charts/CalorieChart';
import ChartCard from '../components/charts/ChartCard';
import HistoryTable from '../components/charts/HistoryTable';
import MacroChart from '../components/charts/MacroChart';
import WaterChart from '../components/charts/WaterChart';
import WeightChart from '../components/charts/WeightChart';
import { useAsyncData } from '../hooks/useAsyncData';
import { nutritionService } from '../services/nutrition';
import { formatLitres, formatNumber } from '../utils/format';
import type { HistoryDay, HistoryRange } from '../types/nutrition';

const RANGES: Array<{ value: HistoryRange; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
];

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className={`rounded-2xl p-4 ${tone}`}>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="font-display text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {sub && <p className="text-xs text-ink-mute">{sub}</p>}
    </div>
  );
}

/** Simple mean of values the backend already returned. */
const average = (days: HistoryDay[], pick: (d: HistoryDay) => number): number =>
  days.length === 0 ? 0 : days.reduce((sum, d) => sum + pick(d), 0) / days.length;

export default function History() {
  const [range, setRange] = useState<HistoryRange>('last_7_days');
  const { data, loading, error, reload } = useAsyncData(() => nutritionService.getHistory(range), [range]);

  const days = data ? [...data.days].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const logged = days.filter((d) => d.calories > 0);
  const multiDay = days.length > 1;
  const hasWeight = days.some((d) => d.weight_kg !== null);
  const summaryPrefix = multiDay ? 'Average per day' : 'Total';

  return (
    <PageContainer
      title="History"
      description="Look back at your calories, macros and water."
      actions={
        <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1">
          <Segmented ariaLabel="Time range" options={RANGES} value={range} onChange={setRange} />
        </div>
      }
    >
      {loading ? (
        <Loading message="Loading history…" />
      ) : error ? (
        <ErrorMessage title="Couldn’t load your history" message={error.message} onRetry={() => void reload()} />
      ) : data && logged.length === 0 ? (
        <div className="card">
          <EmptyState icon={HistoryIcon} title="No records for this period" description="Meals and water you log will show up here." />
        </div>
      ) : data ? (
        <div className="space-y-5">
          <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Calories" value={`${formatNumber(average(logged, (d) => d.calories))} kcal`} sub={summaryPrefix} tone="bg-pine-50" />
            <Tile label="Protein" value={`${formatNumber(average(logged, (d) => d.protein_g), 1)} g`} sub={summaryPrefix} tone="bg-protein-soft" />
            <Tile label="Carbs / Fat" value={`${formatNumber(average(logged, (d) => d.carbs_g))} / ${formatNumber(average(logged, (d) => d.fat_g))} g`} sub={summaryPrefix} tone="bg-carbs-soft" />
            <Tile label="Water" value={formatLitres(average(logged, (d) => d.water_ml))} sub={summaryPrefix} tone="bg-water-soft" />
          </section>

          {multiDay && (
            <div className="grid gap-5 lg:grid-cols-2">
              <ChartCard title="Calories per day" description="The dashed line is your daily target.">
                <CalorieChart days={days} target={data.calorie_target} />
              </ChartCard>
              <ChartCard title="Protein, carbs and fat" description="Grams per day.">
                <MacroChart days={days} />
              </ChartCard>
              <ChartCard title="Water intake" description="Litres per day.">
                <WaterChart days={days} targetMl={data.water_target_ml} />
              </ChartCard>
              {hasWeight && (
                <ChartCard title="Weight trend" description="Body weight in kilograms.">
                  <WeightChart days={days} />
                </ChartCard>
              )}
            </div>
          )}

          <section className="card p-5 sm:p-6" aria-label="Daily records">
            <h2 className="mb-2 text-lg font-semibold text-ink">Daily records</h2>
            <HistoryTable days={days} />
          </section>
        </div>
      ) : null}
    </PageContainer>
  );
}
