import Segmented from '../common/Segmented';
import TextField from '../common/TextField';
import type { ProfileFormErrors, ProfileFormValues } from '../../utils/profileForm';
import type { Sex } from '../../types/user';

interface BodyFieldsProps {
  values: ProfileFormValues;
  errors: ProfileFormErrors;
  onChange: <K extends keyof ProfileFormValues>(field: K, value: ProfileFormValues[K]) => void;
  disabled?: boolean;
}

const SEX_OPTIONS: Array<{ value: Sex; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export default function BodyFields({ values, errors, onChange, disabled }: BodyFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        className="sm:col-span-2"
        label="Name"
        autoComplete="name"
        value={values.name}
        onChange={(e) => onChange('name', e.target.value)}
        error={errors.name}
        disabled={disabled}
      />

      <div className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-semibold text-ink" id="sex-label">
          Sex
        </span>
        <Segmented
          ariaLabel="Sex"
          fullWidth
          options={SEX_OPTIONS}
          value={(values.sex || '') as Sex}
          onChange={(v) => onChange('sex', v)}
        />
        {errors.sex && <p className="mt-1.5 text-sm text-protein">{errors.sex}</p>}
      </div>

      <TextField
        label="Age"
        type="number"
        inputMode="numeric"
        min={14}
        max={100}
        value={values.age}
        onChange={(e) => onChange('age', e.target.value)}
        suffix="years"
        error={errors.age}
        disabled={disabled}
      />
      <TextField
        label="Height"
        type="number"
        inputMode="decimal"
        step="0.1"
        value={values.height_cm}
        onChange={(e) => onChange('height_cm', e.target.value)}
        suffix="cm"
        error={errors.height_cm}
        disabled={disabled}
      />
      <TextField
        label="Weight"
        type="number"
        inputMode="decimal"
        step="0.1"
        value={values.weight_kg}
        onChange={(e) => onChange('weight_kg', e.target.value)}
        suffix="kg"
        error={errors.weight_kg}
        disabled={disabled}
      />
      <TextField
        label="Body fat percentage"
        type="number"
        inputMode="decimal"
        step="0.1"
        value={values.body_fat_percentage}
        onChange={(e) => onChange('body_fat_percentage', e.target.value)}
        suffix="%"
        hint="A best estimate is fine."
        error={errors.body_fat_percentage}
        disabled={disabled}
      />
    </div>
  );
}
