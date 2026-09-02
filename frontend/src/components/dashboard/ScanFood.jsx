import {
  Camera,
  ScanLine,
  UploadCloud,
} from "lucide-react";

export default function ScanFood() {
  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm">

      <div className="mb-8">

        <h2 className="text-2xl font-semibold">
          Scan Your Food
        </h2>

        <p className="mt-2 text-slate-500">
          Upload an image or scan a barcode to detect calories.
        </p>

      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center">

          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">

            <UploadCloud className="text-green-600" size={34} />

          </div>

          <h3 className="font-semibold">
            Upload Image
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            JPG PNG WEBP
          </p>

          <button className="mt-6 rounded-xl bg-green-500 px-6 py-3 text-white">

            Upload

          </button>

        </div>

        <div className="rounded-3xl border bg-green-50 p-8 text-center">

          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white">

            <ScanLine className="text-green-600" size={34} />

          </div>

          <h3 className="font-semibold">
            Scan Barcode
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Fast nutrition lookup
          </p>

          <button className="mt-6 rounded-xl bg-green-600 px-6 py-3 text-white">

            Scan

          </button>

        </div>

        <div className="flex flex-col items-center justify-center">

          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"
            className="h-56 w-56 rounded-full object-cover shadow-xl"
          />

          <p className="mt-6 text-center font-medium text-green-600">

            AI detects food
            <br />
            and nutrition instantly

          </p>

        </div>

      </div>

    </div>
  );
}