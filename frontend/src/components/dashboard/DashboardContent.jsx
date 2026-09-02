import ScanFood from "./ScanFood";
import Meals from "./Meals";

export default function DashboardContent() {
  return (
    <div className="mt-8 space-y-8">

      <ScanFood />

      <Meals />

    </div>
  );
}