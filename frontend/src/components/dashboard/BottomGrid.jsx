import WaterTracker from "./WaterTracker";
import AITip from "./AITip";
import WeeklyChart from "./WeeklyChart";

export default function BottomGrid() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <WaterTracker />

      <AITip />

      <div className="lg:col-span-2">
        <WeeklyChart />
      </div>
    </div>
  );
}