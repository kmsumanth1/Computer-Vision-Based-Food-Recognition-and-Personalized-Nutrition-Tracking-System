export default function MealCard({
  image,
  title,
  calories,
  time,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white p-4 hover:shadow-md transition">

      <div className="flex items-center gap-4">

        <img
          src={image}
          alt=""
          className="h-16 w-16 rounded-2xl object-cover"
        />

        <div>

          <h3 className="font-semibold">
            {title}
          </h3>

          <p className="text-sm text-slate-500">
            {time}
          </p>

        </div>

      </div>

      <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-600">

        {calories} kcal

      </span>

    </div>
  );
}