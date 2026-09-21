import type { NutritionPlan } from './nutrition';

export type Sex = 'male' | 'female';
export type ActivityLevel = 'low' | 'moderate' | 'high';
export type FitnessGoal = 'cut' | 'bulk' | 'maintain';

export interface UserProfile {
  name: string;
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  body_fat_percentage: number;
  activity_level: ActivityLevel;
  goal: FitnessGoal;
}

/** POST /profile/setup */
export type ProfileSetupRequest = UserProfile;

/** PUT /profile: any subset of the profile */
export type ProfileUpdateRequest = Partial<UserProfile>;

/** Response of GET /profile, PUT /profile and POST /profile/setup */
export interface ProfileResponse {
  profile: UserProfile;
  /** Present when the backend has (re)calculated targets; null right after setup */
  plan: NutritionPlan | null;
}
