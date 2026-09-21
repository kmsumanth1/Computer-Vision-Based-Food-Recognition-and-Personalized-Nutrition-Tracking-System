import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, CHART_COLORS, ChartTooltip, formatAxisDate } from './chartTheme';
import { formatNumber } from '../../utils/format';
import type { HistoryDay } from '../../types/nutrition';

/** Protein, carbohydrates and fat per day. */
export default function MacroChart({ days }: { days: HistoryDay[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Line chart of protein, carbohydrates and fat per day">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis dataKey="date" tickFormatter={formatAxisDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<ChartTooltip format={(v) => `${formatNumber(v, 1)} g`} />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
          <Line type="monotone" dataKey="protein_g" name="Protein" stroke={CHART_COLORS.protein} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="carbs_g" name="Carbs" stroke={CHART_COLORS.carbs} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="fat_g" name="Fat" stroke={CHART_COLORS.fat} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
