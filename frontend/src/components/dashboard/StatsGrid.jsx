import {
  Flame,
  Target,
  Droplets,
  Utensils,
} from "lucide-react";

import StatCard from "./StatCard";

export default function StatsGrid() {

  const cards = [

    {
      title: "Calories Consumed",
      value: "1,250",
      unit: "kcal",
      icon: <Flame size={30} />,
      color: "#22c55e",
      subtitle: "45% of daily goal",
    },

    {
      title: "Calories Goal",
      value: "2,800",
      unit: "kcal",
      icon: <Target size={30} />,
      color: "#f59e0b",
      subtitle: "Edit Goal",
    },

    {
      title: "Remaining",
      value: "1,550",
      unit: "kcal",
      icon: <Droplets size={30} />,
      color: "#3b82f6",
      subtitle: "55% left",
    },

    {
      title: "Meals Today",
      value: "3",
      unit: "Meals",
      icon: <Utensils size={30} />,
      color: "#8b5cf6",
      subtitle: "View All",
    },

  ];

  return (

    <div className="mt-8 grid gap-6 xl:grid-cols-4 md:grid-cols-2">

      {cards.map((card, index) => (

        <StatCard
          key={index}
          {...card}
        />

      ))}

    </div>

  );

}   