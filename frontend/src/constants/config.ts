/** AI confidence below this shows a "please double-check" warning (0 to 1). */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ACCEPTED_IMAGE_EXTENSIONS = 'JPG, JPEG, PNG or WEBP';
export const MAX_IMAGE_SIZE_MB = 10;

export const WATER_QUICK_ADD = [
  { label: '+250 ml', amount_ml: 250 },
  { label: '+500 ml', amount_ml: 500 },
  { label: '+1 L', amount_ml: 1000 },
] as const;

export const WEIGHT_LIMITS = { min: 1, max: 5000 } as const;
export const WEIGHT_RECALC_DEBOUNCE_MS = 450;
export const WEIGHT_STEP_G = 10;

export const PROFILE_LIMITS = {
  age: { min: 14, max: 100 },
  height_cm: { min: 100, max: 250 },
  weight_kg: { min: 30, max: 300 },
  body_fat_percentage: { min: 3, max: 60 },
} as const;
