import { cn } from '../../utils/cn';

interface SegmentedProps<T extends string> {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  fullWidth?: boolean;
  className?: string;
}

export default function Segmented<T extends string>({ options, value, onChange, ariaLabel, fullWidth, className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex rounded-xl bg-pine-50 p-1', fullWidth && 'flex w-full', className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors',
              fullWidth && 'flex-1',
              active ? 'bg-white text-pine-800 shadow-sm' : 'text-ink-mute hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
