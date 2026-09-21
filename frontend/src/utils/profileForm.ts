import { PROFILE_LIMITS } from '../constants/config';
import type { ActivityLevel, FitnessGoal, Sex, UserProfile } from '../types/user';

/** Form state keeps numbers as strings so users can type freely. */
export interface ProfileFormValues {
  name: string;
  sex: Sex | '';
  age: string;
  height_cm: string;
  weight_kg: string;
  body_fat_percentage: string;
  activity_level: ActivityLevel | '';
  goal: FitnessGoal | '';
}

export type ProfileFormErrors = Partial<Record<keyof ProfileFormValues, string>>;

export const emptyProfileForm = (name = ''): ProfileFormValues => ({
  name,
  sex: '',
  age: '',
  height_cm: '',
  weight_kg: '',
  body_fat_percentage: '',
  activity_level: '',
  goal: '',
});

export const profileToForm = (p: UserProfile): ProfileFormValues => ({
  name: p.name,
  sex: p.sex,
  age: String(p.age),
  height_cm: String(p.height_cm),
  weight_kg: String(p.weight_kg),
  body_fat_percentage: String(p.body_fat_percentage),
  activity_level: p.activity_level,
  goal: p.goal,
});

function checkRange(raw: string, label: string, min: number, max: number, unit: string, integer = false): string | undefined {
  if (raw.trim() === '') return `Enter your ${label}.`;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return `Enter a ${label} between ${min} and ${max}${unit}.`;
  if (integer && !Number.isInteger(value)) return `Enter ${label} as a whole number.`;
  return undefined;
}

export function validateProfileForm(v: ProfileFormValues): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  if (!v.name.trim()) errors.name = 'Enter your name.';
  if (!v.sex) errors.sex = 'Choose one.';
  const { age, height_cm, weight_kg, body_fat_percentage } = PROFILE_LIMITS;
  errors.age = checkRange(v.age, 'age', age.min, age.max, ' years', true);
  errors.height_cm = checkRange(v.height_cm, 'height', height_cm.min, height_cm.max, ' cm');
  errors.weight_kg = checkRange(v.weight_kg, 'weight', weight_kg.min, weight_kg.max, ' kg');
  errors.body_fat_percentage = checkRange(v.body_fat_percentage, 'body fat', body_fat_percentage.min, body_fat_percentage.max, '%');
  if (!v.activity_level) errors.activity_level = 'Choose your daily activity.';
  if (!v.goal) errors.goal = 'Choose a goal.';
  return Object.fromEntries(Object.entries(errors).filter(([, msg]) => Boolean(msg))) as ProfileFormErrors;
}

/** Only call after validateProfileForm returned no errors. */
export const formToProfile = (v: ProfileFormValues): UserProfile => ({
  name: v.name.trim(),
  sex: v.sex as Sex,
  age: Number(v.age),
  height_cm: Number(v.height_cm),
  weight_kg: Number(v.weight_kg),
  body_fat_percentage: Number(v.body_fat_percentage),
  activity_level: v.activity_level as ActivityLevel,
  goal: v.goal as FitnessGoal,
});
