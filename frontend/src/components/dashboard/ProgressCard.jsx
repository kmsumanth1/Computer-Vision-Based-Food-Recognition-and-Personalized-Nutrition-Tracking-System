import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function ProgressCard() {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">

      <h2 className="mb-6 text-xl font-semibold">
        Daily Goal Progress
      </h2>

      <div className="mx-auto h-44 w-44">

        <CircularProgressbar
          value={45}
          text="45%"
          styles={{
            path: {
              stroke: "#22c55e",
              strokeLinecap: "round",
            },
            trail: {
              stroke: "#e5e7eb",
            },
            text: {
              fill: "#111827",
              fontSize: "18px",
              fontWeight: "700",
            },
          }}
        />

      </div>

      <div className="mt-8 space-y-4">

        <div className="flex justify-between">

          <span>Consumed</span>

          <span className="font-semibold">
            1250 kcal
          </span>

        </div>

        <div className="flex justify-between">

          <span>Remaining</span>

          <span className="font-semibold">
            1550 kcal
          </span>

        </div>

      </div>

    </div>
  );
}