import {
  LayoutDashboard,
  ScanLine,
  UtensilsCrossed,
  History,
  PieChart,
  Target,
  BarChart3,
  Droplets,
  User,
  Settings,
  LogOut,
  Apple,
  Crown,
  X,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, title: "Dashboard" },
  { icon: ScanLine, title: "Scan Food" },
  { icon: UtensilsCrossed, title: "Meals" },
  { icon: History, title: "History" },
  { icon: PieChart, title: "Nutrition" },
  { icon: Target, title: "Goals" },
  { icon: BarChart3, title: "Reports" },
  { icon: Droplets, title: "Water Tracker" },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col justify-between border-r bg-white p-6 transition-transform duration-300 lg:sticky lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >

        <div>

          <div className="mb-10 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                <Apple className="text-green-600" size={27} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  AI Food
                </h1>

                <p className="text-sm font-semibold text-green-600">
                  Calories Meter
                </p>
              </div>

            </div>

            <button
              onClick={onClose}
              className="lg:hidden"
            >
              <X size={22} />
            </button>

          </div>

          <nav className="space-y-1.5">

            {menuItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                    index === 0
                      ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                      : "text-slate-600 hover:bg-green-50 hover:text-green-600"
                  }`}
                >
                  <Icon size={19} />
                  {item.title}
                </button>
              );
            })}

          </nav>

        </div>

        <div className="space-y-4">

          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-4">

            <div className="flex items-center gap-2">
              <Crown className="text-amber-500" size={18} />

              <span className="font-semibold text-slate-800">
                Go Premium
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Unlock advanced AI nutrition insights.
            </p>

            <button className="mt-4 w-full rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white hover:bg-green-600">
              Upgrade Now
            </button>

          </div>

          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 hover:bg-red-50 hover:text-red-500">
            <LogOut size={19} />
            Logout
          </button>

          <div className="flex items-center gap-3 border-t pt-4">

            <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
              <User size={18} className="text-green-600" />
            </div>

            <div>
              <p className="text-sm font-semibold">
                Sumanth
              </p>

              <p className="text-xs text-slate-500">
                Premium User
              </p>
            </div>

            <Settings
              size={17}
              className="ml-auto text-slate-400"
            />

          </div>

        </div>

      </aside>
    </>
  );
}