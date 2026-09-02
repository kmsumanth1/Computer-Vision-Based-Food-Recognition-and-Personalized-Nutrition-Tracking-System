import {
  FaFire,
  FaBullseye,
  FaTint,
  FaUtensils,
} from "react-icons/fa";

import "../styles/statscards.css";

function StatsCards() {
  const cards = [
    {
      icon: <FaFire />,
      title: "Calories Consumed",
      value: "1,250",
      unit: "kcal",
      subtitle: "45% of daily goal",
      color: "#22c55e",
    },
    {
      icon: <FaBullseye />,
      title: "Calories Goal",
      value: "2,800",
      unit: "kcal",
      subtitle: "Edit Goal",
      color: "#f59e0b",
    },
    {
      icon: <FaTint />,
      title: "Calories Remaining",
      value: "1,550",
      unit: "kcal",
      subtitle: "55% left",
      color: "#3b82f6",
    },
    {
      icon: <FaUtensils />,
      title: "Meals Today",
      value: "3",
      unit: "Meals",
      subtitle: "View All",
      color: "#8b5cf6",
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, index) => (
        <div className="stat-card" key={index}>
          <div
            className="stat-icon"
            style={{ background: `${card.color}20`, color: card.color }}
          >
            {card.icon}
          </div>

          <div className="stat-content">
            <h4>{card.title}</h4>

            <h2>
              {card.value}
              <span>{card.unit}</span>
            </h2>

            <p>{card.subtitle}</p>

            {index === 0 && (
              <div className="progress">
                <div className="progress-fill"></div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;