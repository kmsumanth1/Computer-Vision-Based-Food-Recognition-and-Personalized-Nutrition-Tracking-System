import MealCard from "./MealCard";

const meals = [
  {
    title: "Breakfast",
    calories: 420,
    time: "08:15 AM",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300",
  },
  {
    title: "Lunch",
    calories: 620,
    time: "01:20 PM",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300",
  },
  {
    title: "Snack",
    calories: 210,
    time: "05:00 PM",
    image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=300",
  },
];

export default function Meals() {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">

      <div className="mb-6 flex items-center justify-between">

        <h2 className="text-xl font-semibold">
          Today's Meals
        </h2>

        <button className="font-semibold text-green-600">
          View All
        </button>

      </div>

      <div className="space-y-4">

        {meals.map((meal) => (
          <MealCard key={meal.title} {...meal} />
        ))}

      </div>

    </div>
  );
}