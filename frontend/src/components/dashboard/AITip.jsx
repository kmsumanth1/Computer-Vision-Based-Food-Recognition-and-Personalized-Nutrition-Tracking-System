import { Sparkles, ArrowRight } from "lucide-react";

export default function AITip() {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
          <Sparkles size={22} />
        </div>

        <div>
          <p className="text-sm font-medium text-green-100">
            AI Nutrition Tip
          </p>

          <h2 className="text-lg font-semibold">
            Personalized for you
          </h2>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-green-50">
        You're doing well today! Try adding a protein-rich snack to help
        reach your daily protein target.
      </p>

      <button className="mt-5 flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all">
        View recommendations
        <ArrowRight size={16} />
      </button>
    </div>
  );
}