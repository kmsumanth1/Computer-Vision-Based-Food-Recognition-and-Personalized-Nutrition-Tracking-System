import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/format';
import { GOAL_LABEL } from '../../constants/profile';
import type { CalorieTargets } from '../../types/nutrition';
import type { FitnessGoal } from '../../types/user';

const ORDER: Array<{ key: keyof CalorieTargets; goal: FitnessGoal }> = [
  { key: 'cut', goal: 'cut' },
  { key: 'maintain', goal: 'maintain' },
  { key: 'bulk', goal: 'bulk' },
];

interface TargetCardsProps {
  targets: CalorieTargets;
  goal: FitnessGoal;
  className?: string;
  /** stack: vertical list; row: three columns */
  layout?: 'stack' | 'row';
}

/** Cut / Maintain / Bulk daily calorie targets with the current goal highlighted. */
export default function TargetCards({ targets, goal, className, layout = 'row' }: TargetCardsProps) {
  return (
    <ul className={cn('grid gap-3', layout === 'row' ? 'grid-cols-3' : 'grid-cols-1', className)}>
      {ORDER.map(({ key, goal: itemGoal }) => {
        const active = itemGoal === goal;
        return (
          <li
            key={key}
            className={cn(
              'rounded-2xl border p-4',
              layout === 'stack' && 'flex items-center justify-between gap-3',
              active ? 'border-pine-700 bg-pine-800 text-white' : 'border-line bg-white',
            )}
          >
            <div>
              <p className={cn('text-sm font-semibold', active ? 'text-white' : 'text-ink')}>{GOAL_LABEL[itemGoal]}</p>
              {active && <p className="text-xs text-volt">Your goal</p>}
            </div>
            <p className={cn('tabular-nums', layout === 'row' && 'mt-2')}>
              <span className="font-display text-2xl font-semibold">{formatNumber(targets[key])}</span>{' '}
              <span className={cn('text-sm', active ? 'text-white/70' : 'text-ink-mute')}>kcal/day</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
