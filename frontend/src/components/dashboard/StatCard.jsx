import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function StatCard({
  title,
  value,
  unit,
  icon,
  color,
  subtitle,
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100"
    >
      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-bold text-slate-800">

            {value}

            <span className="ml-2 text-lg font-medium text-slate-500">
              {unit}
            </span>

          </h2>

          <p className="mt-4 text-sm font-medium text-green-600">
            {subtitle}
          </p>

        </div>

        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: `${color}15` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>

      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full"
          style={{
            width: "45%",
            background: color,
          }}
        />

      </div>

    </motion.div>
  );
}