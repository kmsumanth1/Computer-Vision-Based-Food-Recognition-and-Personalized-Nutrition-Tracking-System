import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface OptionCardProps {
  selected: boolean;
  onSelect: () => void;
  icon: LucideIcon;
  iconTone?: string;
  title: string;
  subtitle?: string;
  description?: string;
  disabled?: boolean;
}

/** Large selectable card used for activity level and fitness goal. Behaves as a radio button. */
export default function OptionCard({ selected, onSelect, icon: Icon, iconTone = 'bg-pine-100 text-pine-700', title, subtitle, description, disabled }: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'relative flex h-full w-full flex-col items-start rounded-2xl border p-4 text-left transition-colors sm:p-5',
        'disabled:cursor-not-allowed disabled:opacity-60',
        selected ? 'border-pine-600 bg-pine-50 ring-2 ring-pine-600/20' : 'border-line bg-white hover:border-pine-300',
      )}
    >
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconTone)}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span
        className={cn(
          'absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border transition-colors',
          selected ? 'border-pine-600 bg-pine-600 text-white' : 'border-line bg-white',
        )}
        aria-hidden
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="mt-3 font-display text-lg font-semibold text-ink">{title}</span>
      {subtitle && <span className="text-sm font-medium text-pine-700">{subtitle}</span>}
      {description && <span className="mt-1 text-sm text-ink-mute">{description}</span>}
    </button>
  );
}
