import MeterDial from '../common/MeterDial';
import { formatNumber } from '../../utils/format';
import { GOAL_LABEL } from '../../constants/profile';
import { remainingOf } from '../../utils/nutrition';
import type { FitnessGoal } from '../../types/user';

interface CalorieCardProps {
  consumed: number;
  target: number;
  goal: FitnessGoal;
}

function Stat({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div>
      <p className="text-sm text-ink-mute">{label}</p>
      <p className="tabular-nums">
        <span className={strong ? 'font-display text-3xl font-semibold text-ink' : 'font-display text-2xl font-semibold text-ink'}>
          {formatNumber(value)}
        </span>{' '}
        <span className="text-sm text-ink-mute">kcal</span>
      </p>
    </div>
  );
}

export default function CalorieCard({ consumed, target, goal }: CalorieCardProps) {
  const remaining = remainingOf(target, consumed);
  const over = Math.max(0, consumed - target);
  const progress = target > 0 ? consumed / target : 0;

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="calories-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="calories-heading" className="text-lg font-semibold text-ink">
          Today’s calories
        </h2>
        <span className="rounded-full bg-volt-soft px-3 py-1 text-xs font-semibold text-pine-800">{GOAL_LABEL[goal]} goal</span>
      </div>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        <MeterDial
          progress={progress}
          className="w-52 shrink-0"
          label={`${formatNumber(consumed)} of ${formatNumber(target)} kilocalories consumed`}
        >
          <span className="font-display text-4xl font-semibold tabular-nums leading-none text-ink">
            {formatNumber(over > 0 ? over : remaining)}
          </span>
          <span className="mt-1 text-sm text-ink-mute">{over > 0 ? 'kcal over target' : 'kcal remaining'}</span>
        </MeterDial>

        <div className="grid w-full grid-cols-3 gap-4 sm:grid-cols-1 sm:gap-5">
          <Stat label="Consumed" value={consumed} strong />
          <Stat label="Target" value={target} />
          <Stat label="Remaining" value={remaining} />
        </div>
      </div>
    </section>
  );
}
