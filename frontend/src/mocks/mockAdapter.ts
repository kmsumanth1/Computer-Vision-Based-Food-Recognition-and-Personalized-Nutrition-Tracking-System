/**
 * In-browser stand-in for the FastAPI backend, active only when VITE_USE_MOCK=true.
 * It implements the same endpoints, request bodies and response shapes as the real API,
 * so switching to the real backend is a one-line env change (VITE_USE_MOCK=false).
 *
 * Demo shortcuts for error states:
 *  - Upload/capture a file whose name contains "unknown"  -> FOOD_NOT_RECOGNIZED
 *  - Upload a file whose name contains "lowconf"          -> low-confidence result
 *  - A barcode starting with "000"                        -> BARCODE_NOT_FOUND
 *  - Manual food names that match nothing                 -> NUTRITION_UNAVAILABLE
 */
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse, AuthUser } from '../types/auth';
import type { DashboardData, HistoryDay, HistoryRange, HistoryResponse, WaterSummary } from '../types/nutrition';
import type { CalculateWeightResponse } from '../types/food';
import type { CreateMealRequest, MealEntry, MealsResponse, UpdateMealRequest } from '../types/meal';
import type { ProfileResponse, UserProfile } from '../types/user';
import { ACCEPTED_IMAGE_TYPES, WEIGHT_LIMITS } from '../constants/config';
import { toISODate, todayISO } from '../utils/format';
import { uid } from '../utils/id';
import { sumEntries } from '../utils/nutrition';
import { CATALOG_FOODS, CATALOG_PRODUCTS, findFoodById, findFoodByName } from './foodCatalog';
import { computePlan, nutritionFor, toFoodItem } from './nutritionMath';
import { loadDb, saveDb, seedHistory, waterKey, type MockDb, type MockUser, type StoredEntry } from './mockDb';

class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

interface RequestContext {
  config: InternalAxiosRequestConfig;
  match: RegExpMatchArray;
  body: unknown;
  query: Record<string, string | undefined>;
  db: MockDb;
}

interface Route {
  method: string;
  pattern: RegExp;
  auth: boolean;
  delay: number;
  handler: (ctx: RequestContext, user: MockUser | null) => unknown;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toAuthUser = (db: MockDb, user: MockUser): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  profile_completed: Boolean(db.profiles[user.id]),
});

const stripUser = (entry: StoredEntry): MealEntry => {
  const { user_id: _userId, ...rest } = entry;
  return rest;
};

const requireProfile = (db: MockDb, user: MockUser): UserProfile => {
  const profile = db.profiles[user.id];
  if (!profile) throw new HttpError(404, 'PROFILE_NOT_FOUND', 'Profile has not been set up.');
  return profile;
};

const isValidWeight = (w: unknown): w is number =>
  typeof w === 'number' && Number.isFinite(w) && w >= WEIGHT_LIMITS.min && w <= WEIGHT_LIMITS.max;

function buildHistoryDay(db: MockDb, user: MockUser, date: string): HistoryDay | null {
  const entries = db.entries.filter((e) => e.user_id === user.id && e.date === date);
  const water = db.water[waterKey(user.id, date)] ?? 0;
  const seeded = db.history[user.id]?.find((d) => d.date === date) ?? null;
  const isToday = date === todayISO();

  if (entries.length === 0 && water === 0) {
    if (seeded) return seeded;
    return isToday
      ? { date, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 0, weight_kg: db.profiles[user.id]?.weight_kg ?? null }
      : null;
  }
  const t = sumEntries(entries);
  return {
    date,
    calories: Math.round(t.calories),
    protein_g: Math.round(t.protein_g),
    carbs_g: Math.round(t.carbs_g),
    fat_g: Math.round(t.fat_g),
    water_ml: water,
    weight_kg: isToday ? (db.profiles[user.id]?.weight_kg ?? null) : (seeded?.weight_kg ?? null),
  };
}

function datesForRange(range: HistoryRange): string[] {
  const days = range === 'last_7_days' ? 7 : range === 'last_30_days' ? 30 : 1;
  const offsetStart = range === 'yesterday' ? 1 : 0;
  const out: string[] = [];
  for (let i = days - 1 + offsetStart; i >= offsetStart; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(toISODate(d));
  }
  return out;
}

function makeSession(db: MockDb, user: MockUser): AuthResponse {
  return { access_token: `mock.${user.id}`, token_type: 'bearer', user: toAuthUser(db, user) };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const routes: Route[] = [
  // ---- Auth ---------------------------------------------------------------
  {
    method: 'post',
    pattern: /^\/auth\/register$/,
    auth: false,
    delay: 700,
    handler: ({ body, db }) => {
      const { name, email, password } = body as { name?: string; email?: string; password?: string };
      if (!name?.trim()) throw new HttpError(422, 'VALIDATION_ERROR', 'Name is required.');
      if (!email || !EMAIL_RE.test(email)) throw new HttpError(422, 'VALIDATION_ERROR', 'Enter a valid email address.');
      if (!password || password.length < 8)
        throw new HttpError(422, 'VALIDATION_ERROR', 'Password must be at least 8 characters.');
      if (db.users.some((u) => u.email === email.toLowerCase())) throw new HttpError(409, 'EMAIL_EXISTS', 'Email exists.');
      const user: MockUser = { id: uid(), name: name.trim(), email: email.toLowerCase(), password };
      db.users.push(user);
      saveDb(db);
      return makeSession(db, user);
    },
  },
  {
    method: 'post',
    pattern: /^\/auth\/login$/,
    auth: false,
    delay: 700,
    handler: ({ body, db }) => {
      const { email, password } = body as { email?: string; password?: string };
      const user = db.users.find((u) => u.email === email?.toLowerCase() && u.password === password);
      if (!user) throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.');
      return makeSession(db, user);
    },
  },
  {
    method: 'post',
    pattern: /^\/auth\/forgot-password$/,
    auth: false,
    delay: 900,
    handler: ({ body }) => {
      const { email } = body as { email?: string };
      if (!email || !EMAIL_RE.test(email)) throw new HttpError(422, 'VALIDATION_ERROR', 'Enter a valid email address.');
      return { message: 'Password reset instructions have been sent to your email.' };
    },
  },

  // ---- Profile & nutrition plan -------------------------------------------
  {
    method: 'post',
    pattern: /^\/profile\/setup$/,
    auth: true,
    delay: 600,
    handler: ({ body, db }, user) => {
      const profile = body as UserProfile;
      if (!profile || !profile.sex || !profile.goal || !profile.activity_level)
        throw new HttpError(422, 'VALIDATION_ERROR', 'Some profile fields are missing.');
      db.profiles[user!.id] = profile;
      user!.name = profile.name || user!.name;
      if (!db.history[user!.id]) db.history[user!.id] = seedHistory(user!.id, profile, computePlan(profile));
      saveDb(db);
      const res: ProfileResponse = { profile, plan: null };
      return res;
    },
  },
  {
    method: 'get',
    pattern: /^\/profile$/,
    auth: true,
    delay: 350,
    handler: ({ db }, user) => {
      const profile = requireProfile(db, user!);
      const res: ProfileResponse = { profile, plan: computePlan(profile) };
      return res;
    },
  },
  {
    method: 'put',
    pattern: /^\/profile$/,
    auth: true,
    delay: 700,
    handler: ({ body, db }, user) => {
      const current = requireProfile(db, user!);
      const next = { ...current, ...(body as Partial<UserProfile>) };
      db.profiles[user!.id] = next;
      user!.name = next.name || user!.name;
      saveDb(db);
      const res: ProfileResponse = { profile: next, plan: computePlan(next) };
      return res;
    },
  },
  {
    method: 'post',
    pattern: /^\/nutrition\/calculate$/,
    auth: true,
    delay: 3200, // long enough to see the calculation screen
    handler: ({ db }, user) => computePlan(requireProfile(db, user!)),
  },

  // ---- Dashboard ------------------------------------------------------------
  {
    method: 'get',
    pattern: /^\/dashboard$/,
    auth: true,
    delay: 450,
    handler: ({ db, query }, user) => {
      const plan = computePlan(requireProfile(db, user!));
      const date = query.date ?? todayISO();
      const entries = db.entries.filter((e) => e.user_id === user!.id && e.date === date).map(stripUser);
      const water: WaterSummary = {
        date,
        consumed_ml: db.water[waterKey(user!.id, date)] ?? 0,
        target_ml: plan.water_target_ml,
      };
      const data: DashboardData = { date, plan, totals: sumEntries(entries), water, entries };
      return data;
    },
  },

  // ---- Food -------------------------------------------------------------------
  {
    method: 'post',
    pattern: /^\/food\/analyze$/,
    auth: true,
    delay: 2200,
    handler: ({ body }) => {
      const image = body instanceof FormData ? body.get('image') : null;
      if (!(image instanceof File)) throw new HttpError(422, 'INVALID_IMAGE', 'Image missing.');
      const typeOk = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(image.type);
      if (!typeOk || image.size === 0) throw new HttpError(422, 'INVALID_IMAGE', 'Invalid image.');
      const name = image.name.toLowerCase();
      if (name.includes('unknown')) throw new HttpError(422, 'FOOD_NOT_RECOGNIZED', 'No food detected.');

      const seed = image.size + name.length * 7;
      const food = CATALOG_FOODS[seed % CATALOG_FOODS.length];
      const confidence = name.includes('lowconf') ? 0.42 : 0.72 + (seed % 25) / 100;
      return { food: toFoodItem(food, Math.round(confidence * 100) / 100) };
    },
  },
  {
    method: 'post',
    pattern: /^\/food\/calculate-weight$/,
    auth: true,
    delay: 350,
    handler: ({ body }) => {
      const { food_id, food_name, weight_g } = body as { food_id?: string; food_name?: string; weight_g?: number };
      if (!isValidWeight(weight_g)) throw new HttpError(422, 'INVALID_WEIGHT', 'Invalid weight.');
      const food = findFoodById(food_id) ?? findFoodByName(food_name);
      if (!food) throw new HttpError(404, 'NUTRITION_UNAVAILABLE', 'No nutrition data.');
      const res: CalculateWeightResponse = {
        food_id: food.id,
        food_name: food.name,
        weight_g,
        nutrition: nutritionFor(food, weight_g),
      };
      return res;
    },
  },
  {
    method: 'post',
    pattern: /^\/food\/barcode$/,
    auth: true,
    delay: 900,
    handler: ({ body }) => {
      const { barcode } = body as { barcode?: string };
      if (!barcode || !/^\d{6,14}$/.test(barcode)) throw new HttpError(404, 'BARCODE_NOT_FOUND', 'Unknown barcode.');
      if (barcode.startsWith('000')) throw new HttpError(404, 'BARCODE_NOT_FOUND', 'Unknown barcode.');
      const exact = CATALOG_PRODUCTS.find((p) => p.barcode === barcode);
      const product =
        exact ?? CATALOG_PRODUCTS[Number(barcode.slice(-3)) % CATALOG_PRODUCTS.length];
      const item = toFoodItem(product);
      return { food: exact ? item : { ...item, barcode } };
    },
  },

  // ---- Meals ------------------------------------------------------------------
  {
    method: 'get',
    pattern: /^\/meals$/,
    auth: true,
    delay: 450,
    handler: ({ db, query }, user) => {
      requireProfile(db, user!);
      const date = query.date ?? todayISO();
      const entries = db.entries.filter((e) => e.user_id === user!.id && e.date === date).map(stripUser);
      const res: MealsResponse = { date, totals: sumEntries(entries), entries };
      return res;
    },
  },
  {
    method: 'post',
    pattern: /^\/meals$/,
    auth: true,
    delay: 600,
    handler: ({ body, db }, user) => {
      const req = body as CreateMealRequest;
      if (!isValidWeight(req.weight_g)) throw new HttpError(422, 'INVALID_WEIGHT', 'Invalid weight.');
      const food = findFoodById(req.food_id) ?? findFoodByName(req.food_name);
      if (!food) throw new HttpError(404, 'NUTRITION_UNAVAILABLE', 'No nutrition data.');
      const entry: StoredEntry = {
        id: uid(),
        user_id: user!.id,
        meal_type: req.meal_type,
        food_id: food.id,
        food_name: food.name,
        quantity: req.quantity > 0 ? req.quantity : 1,
        weight_g: req.weight_g,
        nutrition: nutritionFor(food, req.weight_g),
        date: req.date,
        time: req.time,
        source: req.source,
      };
      db.entries.push(entry);
      saveDb(db);
      return stripUser(entry);
    },
  },
  {
    method: 'put',
    pattern: /^\/meals\/([^/]+)$/,
    auth: true,
    delay: 600,
    handler: ({ body, db, match }, user) => {
      const entry = db.entries.find((e) => e.id === decodeURIComponent(match[1]) && e.user_id === user!.id);
      if (!entry) throw new HttpError(404, 'NOT_FOUND', 'Meal entry not found.');
      const patch = body as UpdateMealRequest;
      if (patch.weight_g !== undefined) {
        if (!isValidWeight(patch.weight_g)) throw new HttpError(422, 'INVALID_WEIGHT', 'Invalid weight.');
        const food = findFoodById(entry.food_id);
        if (!food) throw new HttpError(404, 'NUTRITION_UNAVAILABLE', 'No nutrition data.');
        entry.weight_g = patch.weight_g;
        entry.nutrition = nutritionFor(food, patch.weight_g);
      }
      if (patch.meal_type) entry.meal_type = patch.meal_type;
      if (patch.quantity !== undefined && patch.quantity > 0) entry.quantity = patch.quantity;
      if (patch.time) entry.time = patch.time;
      saveDb(db);
      return stripUser(entry);
    },
  },
  {
    method: 'delete',
    pattern: /^\/meals\/([^/]+)$/,
    auth: true,
    delay: 450,
    handler: ({ db, match }, user) => {
      const id = decodeURIComponent(match[1]);
      const before = db.entries.length;
      db.entries = db.entries.filter((e) => !(e.id === id && e.user_id === user!.id));
      if (db.entries.length === before) throw new HttpError(404, 'NOT_FOUND', 'Meal entry not found.');
      saveDb(db);
      return null;
    },
  },

  // ---- Water ------------------------------------------------------------------
  {
    method: 'get',
    pattern: /^\/water$/,
    auth: true,
    delay: 300,
    handler: ({ db, query }, user) => {
      const plan = computePlan(requireProfile(db, user!));
      const date = query.date ?? todayISO();
      const res: WaterSummary = { date, consumed_ml: db.water[waterKey(user!.id, date)] ?? 0, target_ml: plan.water_target_ml };
      return res;
    },
  },
  {
    method: 'post',
    pattern: /^\/water$/,
    auth: true,
    delay: 350,
    handler: ({ body, db }, user) => {
      const { amount_ml, date } = body as { amount_ml?: number; date?: string };
      if (typeof amount_ml !== 'number' || amount_ml <= 0 || amount_ml > 5000)
        throw new HttpError(422, 'VALIDATION_ERROR', 'Enter a water amount between 1 ml and 5 L.');
      const plan = computePlan(requireProfile(db, user!));
      const day = date ?? todayISO();
      const key = waterKey(user!.id, day);
      db.water[key] = (db.water[key] ?? 0) + amount_ml;
      saveDb(db);
      const res: WaterSummary = { date: day, consumed_ml: db.water[key], target_ml: plan.water_target_ml };
      return res;
    },
  },

  // ---- History ----------------------------------------------------------------
  {
    method: 'get',
    pattern: /^\/history$/,
    auth: true,
    delay: 700,
    handler: ({ db, query }, user) => {
      const plan = computePlan(requireProfile(db, user!));
      const range = (query.range ?? 'last_7_days') as HistoryRange;
      const days = datesForRange(range)
        .map((date) => buildHistoryDay(db, user!, date))
        .filter((d): d is HistoryDay => d !== null);
      const res: HistoryResponse = {
        range,
        days,
        calorie_target: plan.daily_calories,
        water_target_ml: plan.water_target_ml,
      };
      return res;
    },
  },
];

function parseBody(data: unknown): unknown {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

function respond<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return { data, status, statusText: status === 200 ? 'OK' : 'Error', headers: {}, config };
}

function fail(config: InternalAxiosRequestConfig, status: number, code: string, message: string): AxiosError {
  const response: AxiosResponse = {
    data: { detail: { code, message } },
    status,
    statusText: 'Error',
    headers: {},
    config,
  };
  return new AxiosError(message, String(status), config, null, response);
}

export async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const method = (config.method ?? 'get').toLowerCase();
  const url = (config.url ?? '').split('?')[0];

  const route = routes.find((r) => r.method === method && r.pattern.test(url));
  if (!route) return Promise.reject(fail(config, 404, 'NOT_FOUND', `No mock route for ${method.toUpperCase()} ${url}`));

  await sleep(route.delay + Math.random() * 150);

  try {
    const db = loadDb();
    let user: MockUser | null = null;
    if (route.auth) {
      const header = String(config.headers.get('Authorization') ?? '');
      const userId = header.startsWith('Bearer mock.') ? header.slice('Bearer mock.'.length) : '';
      user = db.users.find((u) => u.id === userId) ?? null;
      if (!user) throw new HttpError(401, 'UNAUTHORIZED', 'Not authenticated.');
    }
    const ctx: RequestContext = {
      config,
      match: url.match(route.pattern)!,
      body: parseBody(config.data),
      query: (config.params ?? {}) as Record<string, string | undefined>,
      db,
    };
    const data = route.handler(ctx, user);
    return respond(config, data, method === 'delete' ? 204 : 200);
  } catch (error) {
    if (error instanceof HttpError) throw fail(config, error.status, error.code, error.message);
    throw fail(config, 500, 'SERVER_ERROR', 'Mock server error.');
  }
}
