import {
  Bell,
  Menu,
  Search,
  ChevronDown,
} from "lucide-react";

export default function Navbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-white/95 px-4 backdrop-blur md:px-8">

      <div className="flex items-center gap-4">

        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={24} />
        </button>

        <div className="relative hidden sm:block">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            placeholder="Search meals, foods..."
            className="h-11 w-64 rounded-xl border-0 bg-slate-100 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-green-500/20 md:w-80"
          />

        </div>

      </div>

      <div className="flex items-center gap-4 md:gap-7">

        <button className="relative rounded-xl p-2 hover:bg-slate-100">

          <Bell size={21} className="text-slate-600" />

          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />

        </button>

        <div className="flex cursor-pointer items-center gap-3">

          <img
            src="https://i.pravatar.cc/100?img=15"
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover"
          />

          <div className="hidden md:block">

            <p className="text-sm font-semibold text-slate-800">
              Sumanth
            </p>

            <p className="text-xs text-slate-500">
              Premium User
            </p>

          </div>

          <ChevronDown
            size={17}
            className="hidden text-slate-400 md:block"
          />

        </div>

      </div>

    </header>
  );
}