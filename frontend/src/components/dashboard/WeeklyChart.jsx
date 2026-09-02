import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function WeeklyChart() {
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],

    datasets: [
      {
        label: "Calories",
        data: [2100, 1850, 2300, 1950, 2200, 1750, 2050],
        backgroundColor: "#22c55e",
        borderRadius: 8,
        barThickness: 25,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },
      },

      y: {
        beginAtZero: true,

        grid: {
          color: "#f1f5f9",
        },

        ticks: {
          color: "#64748b",
        },
      },
    },
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Weekly Calories
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your calorie intake this week
          </p>
        </div>

        <button className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50">
          This Week
        </button>
      </div>

      <div className="mt-6 h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}