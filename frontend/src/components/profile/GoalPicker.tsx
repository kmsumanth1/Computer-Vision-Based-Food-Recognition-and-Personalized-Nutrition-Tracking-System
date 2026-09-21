import OptionCard from '../common/OptionCard';
import { GOAL_OPTIONS } from '../../constants/profile';
import type { FitnessGoal } from '../../types/user';

interface GoalPickerProps {
  value: FitnessGoal | '';
  onChange: (value: FitnessGoal) => void;
  error?: string;
  disabled?: boolean;
}

export default function GoalPicker({ value, onChange, error, disabled }: GoalPickerProps) {
  return (
    <div>
      <div role="radiogroup" aria-label="Fitness goal" className="grid gap-3 sm:grid-cols-3">
        {GOAL_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
            icon={option.icon}
            iconTone={option.tone}
            title={option.label}
            subtitle={option.tagline}
            description={option.description}
            disabled={disabled}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-protein">{error}</p>}
    </div>
  );
}
