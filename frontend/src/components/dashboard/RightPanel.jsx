import ProgressCard from "./ProgressCard";
import NutritionCard from "./NutritionCard";

export default function RightPanel() {
  return (
    <div className="space-y-6">

      <ProgressCard />

      <NutritionCard />

    </div>
  );
}