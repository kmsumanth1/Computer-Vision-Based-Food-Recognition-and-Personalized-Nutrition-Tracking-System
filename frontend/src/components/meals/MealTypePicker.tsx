import { MEAL_META, MEAL_TYPES } from '../../constants/meals';
import { formatTime12 } from '../../utils/format';
import { cn } from '../../utils/cn';
import type { MealType } from '../../types/meal';

interface MealTypePickerProps {
  value: MealType;
  onChange: (value: MealType) => void;
  /** Category suggested from the entered time. It is only a hint; the user can pick any. */
  suggested?: MealType;
  time?: string;
  disabled?: boolean;
}

export default function MealTypePicker({ value, onChange, suggested, time, disabled }: MealTypePickerProps) {
  return (
    <div>
      <div role="radiogroup" aria-label="Meal" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MEAL_TYPES.map((type) => {
          const { label, icon: Icon } = MEAL_META[type];
          const active = value === type;
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(type)}
              className={cn(
                'flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-60',
                active ? 'border-pine-600 bg-pine-600 text-white' : 'border-line bg-white text-ink-soft hover:border-pine-300 hover:bg-pine-50',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
      {suggested && time && (
        <p className="mt-2 text-sm text-ink-mute">
          {formatTime12(time)} usually fits <span className="font-medium text-ink-soft">{MEAL_META[suggested].label}</span>
          {value !== suggested ? '. You picked a different meal, and that’s fine.' : '.'}
        </p>
      )}
    </div>
  );
}
