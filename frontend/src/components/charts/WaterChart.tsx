import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, CHART_COLORS, ChartTooltip, formatAxisDate } from './chartTheme';
import { formatLitres } from '../../utils/format';
import type { HistoryDay } from '../../types/nutrition';

interface WaterChartProps {
  days: HistoryDay[];
  targetMl: number | null;
}

/** Water intake per day, in litres. */
export default function WaterChart({ days, targetMl }: WaterChartProps) {
  const data = days.map((d) => ({ date: d.date, litres: d.water_ml / 1000 }));
  return (
    <div className="h-64 w-full" role="img" aria-label="Bar chart of water intake per day">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} unit=" L" />
          <Tooltip cursor={{ fill: 'rgba(30,155,209,0.08)' }} content={<ChartTooltip format={(v) => formatLitres(v * 1000)} />} />
          {targetMl !== null && (
            <ReferenceLine y={targetMl / 1000} stroke={CHART_COLORS.target} strokeDasharray="5 4" label={{ value: 'Target', position: 'insideTopRight', fill: CHART_COLORS.target, fontSize: 12 }} />
          )}
          <Bar dataKey="litres" name="Water" fill={CHART_COLORS.water} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
