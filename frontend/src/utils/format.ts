export function formatNumber(value: number, maxDigits = 0): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: maxDigits }).format(value);
}

export const formatKcal = (value: number): string => `${formatNumber(value)} kcal`;

export const formatGrams = (value: number, maxDigits = 1): string => `${formatNumber(value, maxDigits)} g`;

/** 1800 -> "1.8 L", 3000 -> "3.0 L", 250 -> "0.25 L" */
export function formatLitres(ml: number): string {
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(ml / 1000);
  return `${formatted} L`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** consumed / target as a percentage (not clamped). */
export function percentOf(consumed: number, target: number): number {
  return target > 0 ? (consumed / target) * 100 : 0;
}

/** Local calendar date as YYYY-MM-DD. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const todayISO = (): string => toISODate(new Date());

/** Parses YYYY-MM-DD as a local date (avoids the UTC shift of `new Date('2026-09-19')`). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDay(iso: string, style: 'short' | 'long' = 'short'): string {
  const date = parseISODate(iso);
  if (style === 'long') {
    return new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  }
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
}

export function formatDayCompact(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(parseISODate(iso));
}

/** "13:05" -> "1:05 PM" */
export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(h ?? 0, m ?? 0, 0, 0);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

export function nowHHmm(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
