import { Apple, ScanLine, Sparkles } from "lucide-react";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 lg:flex">

        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-white/10" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

          <div className="flex items-center gap-3 text-white">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Apple size={27} />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                AI Food
              </h1>

              <p className="text-sm font-medium text-green-100">
                Calories Meter
              </p>
            </div>

          </div>

          <div className="max-w-lg text-white">

            <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Sparkles size={32} />
            </div>

            <h2 className="text-5xl font-bold leading-tight xl:text-6xl">
              Eat smarter.
              <br />
              Live healthier.
            </h2>

            <p className="mt-6 max-w-md text-lg leading-8 text-green-50">
              Use AI to recognize your food, track calories and understand
              your nutrition—all in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <div className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                AI Food Recognition
              </div>

              <div className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                Smart Nutrition
              </div>

              <div className="rounded-full bg-white/15 px-4 py-2 text-sm backdrop-blur">
                Calorie Tracking
              </div>

            </div>

          </div>

          <p className="text-sm text-green-100">
            © 2026 AI Food Calories Meter
          </p>

        </div>

      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">

        <div className="w-full max-w-md">

          <div className="mb-8 flex items-center gap-3 lg:hidden">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
              <Apple className="text-green-600" size={24} />
            </div>

            <div>
              <h1 className="font-bold text-slate-800">
                AI Food Calories Meter
              </h1>
            </div>

          </div>

          <div className="mb-8">

            <h2 className="text-3xl font-bold tracking-tight text-slate-800">
              {title}
            </h2>

            <p className="mt-2 text-slate-500">
              {subtitle}
            </p>

          </div>

          {children}

        </div>

      </div>

    </div>
  );
}