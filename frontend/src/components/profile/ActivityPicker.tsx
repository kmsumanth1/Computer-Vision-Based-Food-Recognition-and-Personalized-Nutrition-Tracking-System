import OptionCard from '../common/OptionCard';
import { ACTIVITY_OPTIONS } from '../../constants/profile';
import type { ActivityLevel } from '../../types/user';

interface ActivityPickerProps {
  value: ActivityLevel | '';
  onChange: (value: ActivityLevel) => void;
  error?: string;
  disabled?: boolean;
}

export default function ActivityPicker({ value, onChange, error, disabled }: ActivityPickerProps) {
  return (
    <div>
      <div role="radiogroup" aria-label="Daily steps" className="grid gap-3 sm:grid-cols-3">
        {ACTIVITY_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
            icon={option.icon}
            title={option.label}
            subtitle={option.steps}
            description={option.description}
            disabled={disabled}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-protein">{error}</p>}
    </div>
  );
}
