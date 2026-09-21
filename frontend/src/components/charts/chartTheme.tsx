import { formatDayCompact } from '../../utils/format';

export const CHART_COLORS = {
  calories: '#0F6B53',
  protein: '#E5484D',
  carbs: '#E99A0C',
  fat: '#5B6CF0',
  water: '#1E9BD1',
  weight: '#10231C',
  grid: '#E2E8E4',
  axis: '#6B7F76',
  target: '#3F534B',
} as const;

export const AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 12 } as const;

export const formatAxisDate = (iso: string): string => formatDayCompact(iso);

interface TooltipRow {
  name?: string | number;
  value?: string | number;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: TooltipRow[];
  /** Formats each value, e.g. adds a unit */
  format: (value: number, name: string) => string;
}

/** Tooltip shared by all charts. */
export function ChartTooltip({ active, label, payload, format }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-pop">
      <p className="mb-1 font-semibold text-ink">{typeof label === 'string' ? formatDayCompact(label) : label}</p>
      <ul className="space-y-0.5">
        {payload.map((row) => (
          <li key={String(row.name)} className="flex items-center gap-2 text-ink-soft">
            <span className="h-2 w-2 rounded-full" style={{ background: row.color }} aria-hidden />
            <span>{row.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-ink">{format(Number(row.value), String(row.name))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
