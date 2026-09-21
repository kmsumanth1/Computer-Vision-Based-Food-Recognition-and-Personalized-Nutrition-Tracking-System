import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, CHART_COLORS, ChartTooltip, formatAxisDate } from './chartTheme';
import { formatNumber } from '../../utils/format';
import type { HistoryDay } from '../../types/nutrition';

/** Body weight trend. Days without a logged weight are skipped. */
export default function WeightChart({ days }: { days: HistoryDay[] }) {
  const data = days.filter((d) => d.weight_kg !== null).map((d) => ({ date: d.date, weight: d.weight_kg }));
  return (
    <div className="h-64 w-full" role="img" aria-label="Line chart of body weight">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={(v: number) => formatNumber(v, 1)} />
          <Tooltip content={<ChartTooltip format={(v) => `${formatNumber(v, 1)} kg`} />} />
          <Line type="monotone" dataKey="weight" name="Weight" stroke={CHART_COLORS.weight} strokeWidth={2.5} dot={{ r: 2.5, fill: CHART_COLORS.weight }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
