import { cn } from '../../utils/cn';
import { clamp } from '../../utils/format';

interface ProgressBarProps {
  /** 0 to 100. Values above 100 are drawn full. */
  value: number;
  /** Tailwind background class for the fill */
  color?: string;
  trackClassName?: string;
  className?: string;
  label: string;
}

export default function ProgressBar({ value, color = 'bg-pine-600', trackClassName = 'bg-pine-50', className, label }: ProgressBarProps) {
  const pct = clamp(value, 0, 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('h-2.5 w-full overflow-hidden rounded-full', trackClassName, className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}
