export default function NutritionCard() {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">

      <div className="mb-6 flex items-center justify-between">

        <h2 className="text-xl font-semibold">
          Macronutrients
        </h2>

        <button className="text-green-600 text-sm font-semibold">
          View Details
        </button>

      </div>

      <div className="space-y-6">

        <div>

          <div className="mb-2 flex justify-between">

            <span>Carbohydrates</span>

            <span>150g / 300g</span>

          </div>

          <div className="h-2 rounded-full bg-slate-100">

            <div className="h-2 w-1/2 rounded-full bg-green-500" />

          </div>

        </div>

        <div>

          <div className="mb-2 flex justify-between">

            <span>Protein</span>

            <span>60g / 100g</span>

          </div>

          <div className="h-2 rounded-full bg-slate-100">

            <div className="h-2 w-3/5 rounded-full bg-blue-500" />

          </div>

        </div>

        <div>

          <div className="mb-2 flex justify-between">

            <span>Fats</span>

            <span>40g / 80g</span>

          </div>

          <div className="h-2 rounded-full bg-slate-100">

            <div className="h-2 w-1/2 rounded-full bg-yellow-400" />

          </div>

        </div>

      </div>

    </div>
  );
}