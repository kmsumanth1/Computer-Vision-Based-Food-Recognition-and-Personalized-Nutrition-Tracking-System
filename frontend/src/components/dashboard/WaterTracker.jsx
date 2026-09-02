import { Droplets, Plus, Minus } from "lucide-react";

export default function WaterTracker() {
  const glasses = 6;
  const goal = 8;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Water Intake
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Stay hydrated throughout the day
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
          <Droplets className="text-blue-500" size={24} />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-slate-800">
            {glasses * 250}
            <span className="ml-1 text-base font-medium text-slate-500">
              ml
            </span>
          </p>

          <p className="mt-1 text-sm text-slate-500">
            of {goal * 250} ml goal
          </p>
        </div>

        <div className="flex gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border hover:bg-slate-50">
            <Minus size={17} />
          </button>

          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-600">
            <Plus size={17} />
          </button>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {Array.from({ length: goal }).map((_, index) => (
          <div
            key={index}
            className={`h-10 flex-1 rounded-lg ${
              index < glasses ? "bg-blue-400" : "bg-slate-100"
            }`}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-sm font-medium text-blue-600">
        {goal - glasses} more glasses to reach your goal
      </p>
    </div>
  );
}