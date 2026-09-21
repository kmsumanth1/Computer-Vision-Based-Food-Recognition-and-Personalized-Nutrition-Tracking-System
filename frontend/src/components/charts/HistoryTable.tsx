import { formatDay, formatLitres, formatNumber } from '../../utils/format';
import type { HistoryDay } from '../../types/nutrition';

/** Date, calories, protein, carbs, fat and water for each day. Newest first. */
export default function HistoryTable({ days }: { days: HistoryDay[] }) {
  const rows = [...days].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      {/* Phones: one card per day */}
      <ul className="divide-y divide-line sm:hidden">
        {rows.map((d) => (
          <li key={d.date} className="py-3.5">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-ink">{formatDay(d.date)}</p>
              <p className="font-display text-lg font-semibold tabular-nums text-ink">{formatNumber(d.calories)} kcal</p>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {formatNumber(d.protein_g, 1)} g protein · {formatNumber(d.carbs_g, 1)} g carbs · {formatNumber(d.fat_g, 1)} g fat
            </p>
            <p className="text-sm text-ink-mute">Water {formatLitres(d.water_ml)}</p>
          </li>
        ))}
      </ul>

      {/* Larger screens: table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Daily nutrition history</caption>
          <thead>
            <tr className="border-b border-line text-ink-mute">
              <th scope="col" className="py-2.5 pr-4 font-medium">Date</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Calories</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Protein</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Carbs</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Fat</th>
              <th scope="col" className="py-2.5 pl-4 text-right font-medium">Water</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular-nums">
            {rows.map((d) => (
              <tr key={d.date} className="hover:bg-pine-50/50">
                <th scope="row" className="py-3 pr-4 font-medium text-ink">{formatDay(d.date)}</th>
                <td className="px-4 py-3 text-right font-semibold text-ink">{formatNumber(d.calories)} kcal</td>
                <td className="px-4 py-3 text-right text-ink-soft">{formatNumber(d.protein_g, 1)} g</td>
                <td className="px-4 py-3 text-right text-ink-soft">{formatNumber(d.carbs_g, 1)} g</td>
                <td className="px-4 py-3 text-right text-ink-soft">{formatNumber(d.fat_g, 1)} g</td>
                <td className="py-3 pl-4 text-right text-ink-soft">{formatLitres(d.water_ml)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
