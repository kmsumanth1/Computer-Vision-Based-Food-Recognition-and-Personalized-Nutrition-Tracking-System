import type { HistoryDay, NutritionPlan } from '../types/nutrition';
import type { MealEntry } from '../types/meal';
import type { UserProfile } from '../types/user';
import { toISODate } from '../utils/format';

const DB_KEY = 'afcm.mock.db.v1';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

export type StoredEntry = MealEntry & { user_id: string };

export interface MockDb {
  users: MockUser[];
  profiles: Record<string, UserProfile>;
  entries: StoredEntry[];
  /** key: `${userId}|${date}` -> ml */
  water: Record<string, number>;
  /** Seeded past days so the History charts have something to show in demo mode */
  history: Record<string, HistoryDay[]>;
}

const emptyDb = (): MockDb => ({ users: [], profiles: {}, entries: [], water: {}, history: {} });

export function loadDb(): MockDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? { ...emptyDb(), ...(JSON.parse(raw) as Partial<MockDb>) } : emptyDb();
  } catch {
    return emptyDb();
  }
}

export function saveDb(db: MockDb): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export const waterKey = (userId: string, date: string) => `${userId}|${date}`;

// ---- Demo history seed ---------------------------------------------------

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Creates 30 days of plausible past records for a new profile (mock mode only). */
export function seedHistory(userId: string, profile: UserProfile, plan: NutritionPlan): HistoryDay[] {
  const rand = mulberry32(hashString(userId));
  const days: HistoryDay[] = [];
  const trend = profile.goal === 'cut' ? 0.035 : profile.goal === 'bulk' ? -0.03 : 0;

  for (let i = 30; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const calories = Math.round(plan.daily_calories * (0.82 + rand() * 0.3));
    const ratio = calories / plan.daily_calories;
    days.push({
      date: toISODate(date),
      calories,
      protein_g: Math.round(plan.macro_targets.protein_g * ratio * (0.85 + rand() * 0.25)),
      carbs_g: Math.round(plan.macro_targets.carbs_g * ratio * (0.85 + rand() * 0.25)),
      fat_g: Math.round(plan.macro_targets.fat_g * ratio * (0.85 + rand() * 0.25)),
      water_ml: Math.round((plan.water_target_ml * (0.6 + rand() * 0.5)) / 250) * 250,
      weight_kg: Math.round((profile.weight_kg + trend * i + (rand() - 0.5) * 0.5) * 10) / 10,
    });
  }
  return days;
}
