import { useState } from 'react';
import { Droplets } from 'lucide-react';
import Button from '../common/Button';
import ProgressBar from '../common/ProgressBar';
import { WATER_QUICK_ADD } from '../../constants/config';
import { waterService } from '../../services/water';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/apiError';
import { formatLitres, percentOf } from '../../utils/format';
import type { WaterSummary } from '../../types/nutrition';

interface WaterCardProps {
  water: WaterSummary;
  onChange: (next: WaterSummary) => void;
}

export default function WaterCard({ water, onChange }: WaterCardProps) {
  const { showToast } = useToast();
  const [pending, setPending] = useState<number | null>(null);

  async function add(amount_ml: number) {
    setPending(amount_ml);
    try {
      const next = await waterService.add({ amount_ml, date: water.date });
      onChange(next);
    } catch (error) {
      showToast(parseApiError(error, 'We couldn’t save your water. Try again.').message, 'error');
    } finally {
      setPending(null);
    }
  }

  const pct = percentOf(water.consumed_ml, water.target_ml);

  return (
    <section className="card flex flex-col p-5 sm:p-6" aria-labelledby="water-heading">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-water-soft text-water">
          <Droplets className="h-5 w-5" aria-hidden />
        </span>
        <h2 id="water-heading" className="text-lg font-semibold text-ink">
          Today’s water intake
        </h2>
      </div>

      <p className="mt-5 tabular-nums">
        <span className="font-display text-4xl font-semibold text-ink">{formatLitres(water.consumed_ml)}</span>
        <span className="ml-1.5 text-lg text-ink-mute">/ {formatLitres(water.target_ml)}</span>
      </p>
      <ProgressBar value={pct} color="bg-water" trackClassName="bg-water-soft" className="mt-3" label="Water intake" />
      <p className="mt-2 text-sm text-ink-mute">
        {water.consumed_ml >= water.target_ml
          ? 'Daily water target reached.'
          : `${formatLitres(water.target_ml - water.consumed_ml)} to go.`}
      </p>

      <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
        {WATER_QUICK_ADD.map(({ label, amount_ml }) => (
          <Button
            key={amount_ml}
            variant="secondary"
            size="md"
            onClick={() => add(amount_ml)}
            loading={pending === amount_ml}
            disabled={pending !== null}
            aria-label={`Add ${label.replace('+', '')} of water`}
            className="px-2"
          >
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}
