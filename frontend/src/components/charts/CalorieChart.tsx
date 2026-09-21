import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, CHART_COLORS, ChartTooltip, formatAxisDate } from './chartTheme';
import { formatNumber } from '../../utils/format';
import type { HistoryDay } from '../../types/nutrition';

interface CalorieChartProps {
  days: HistoryDay[];
  target: number | null;
}

/** Calories per day, with the daily target as a reference line. */
export default function CalorieChart({ days, target }: CalorieChartProps) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Bar chart of calories per day">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={52} />
          <Tooltip cursor={{ fill: 'rgba(15,107,83,0.06)' }} content={<ChartTooltip format={(v) => `${formatNumber(v)} kcal`} />} />
          {target !== null && (
            <ReferenceLine y={target} stroke={CHART_COLORS.target} strokeDasharray="5 4" label={{ value: 'Target', position: 'insideTopRight', fill: CHART_COLORS.target, fontSize: 12 }} />
          )}
          <Bar dataKey="calories" name="Calories" fill={CHART_COLORS.calories} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
