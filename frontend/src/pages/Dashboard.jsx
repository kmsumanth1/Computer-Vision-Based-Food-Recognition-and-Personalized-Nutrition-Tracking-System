import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  Utensils,
  Apple,
  TrendingUp,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  Droplets,
  Flame,
  Beef,
  Wheat,
  CircleUserRound,
  ChevronRight,
  Menu,
  X,
  Camera,
  Clock3,
  MoreHorizontal,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [water, setWater] = useState(4);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const userName =
    user.full_name ||
    user.name ||
    "User";

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Scan Food",
      icon: ScanLine,
      path: "/scan",
    },
    {
      name: "Meals",
      icon: Utensils,
      path: "/meals",
    },
    {
      name: "Nutrition",
      icon: Apple,
      path: "/nutrition",
    },
    {
      name: "Progress",
      icon: TrendingUp,
      path: "/progress",
    },
  ];

  const bottomItems = [
    {
      name: "Profile",
      icon: User,
      path: "/profile",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const addWater = () => {
    if (water < 8) {
      setWater((prev) => prev + 1);
    }
  };

  const removeWater = () => {
    if (water > 0) {
      setWater((prev) => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] text-gray-900">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-gray-100 px-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-white shadow-lg shadow-green-600/20">
              <Apple size={24} />
            </div>

            <div className="text-left">
              <h1 className="font-bold text-gray-900">
                AI Food
              </h1>
              <p className="text-xs text-green-600">
                Calories Meter
              </p>
            </div>
          </button>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Main Menu
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() =>
                    handleNavigation(item.path)
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    item.name === "Dashboard"
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-green-600"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Account
          </p>

          <nav className="space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() =>
                    handleNavigation(item.path)
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-green-600"
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Upgrade Card */}
        <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 p-5 text-white">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Flame size={18} />
          </div>

          <h3 className="font-semibold">
            Your daily goal
          </h3>

          <p className="mt-1 text-xs leading-5 text-green-50">
            Keep tracking your meals to stay on target.
          </p>

          <button
            onClick={() => navigate("/nutrition")}
            className="mt-4 flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            View nutrition
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Logout */}
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-72">

        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            >
              <Menu size={23} />
            </button>

            <div>
              <p className="text-xs text-gray-400">
                Today
              </p>

              <h2 className="font-semibold text-gray-900">
                Good morning, {userName.split(" ")[0]} 👋
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">

            {/* Search */}
            <button
              onClick={() => navigate("/meals")}
              className="hidden rounded-xl p-2.5 text-gray-500 hover:bg-gray-100 sm:block"
            >
              <Search size={20} />
            </button>

            {/* Notification */}
            <button
              className="relative rounded-xl p-2.5 text-gray-500 hover:bg-gray-100"
            >
              <Bell size={20} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
            </button>

            {/* Profile */}
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-gray-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CircleUserRound size={22} />
              </div>

              <span className="hidden text-sm font-medium sm:block">
                {userName}
              </span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">

          {/* Welcome */}
          <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1 text-sm font-medium text-green-600">
                Your nutrition overview
              </p>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Today's Dashboard
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Stay consistent and keep moving toward your goals.
              </p>
            </div>

            <button
              onClick={() => navigate("/scan")}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
            >
              <Camera size={18} />
              Scan Food
            </button>
          </section>

          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* Calories */}
            <button
              onClick={() => navigate("/nutrition")}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Calories
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    1,420
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Flame size={21} />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-gray-400">
                    Daily goal
                  </span>
                  <span className="font-semibold text-gray-600">
                    71%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[71%] rounded-full bg-orange-400" />
                </div>
              </div>
            </button>

            {/* Protein */}
            <button
              onClick={() => navigate("/nutrition")}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Protein
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    82g
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  <Beef size={21} />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-gray-400">
                    Goal 120g
                  </span>
                  <span className="font-semibold text-gray-600">
                    68%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[68%] rounded-full bg-blue-500" />
                </div>
              </div>
            </button>

            {/* Carbs */}
            <button
              onClick={() => navigate("/nutrition")}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Carbs
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    156g
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 text-yellow-500">
                  <Wheat size={21} />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-gray-400">
                    Goal 220g
                  </span>
                  <span className="font-semibold text-gray-600">
                    71%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full w-[71%] rounded-full bg-yellow-400" />
                </div>
              </div>
            </button>

            {/* Water */}
            <button
              onClick={() => navigate("/nutrition")}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Water
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {water}
                    <span className="text-base font-medium text-gray-400">
                      /8
                    </span>
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-500">
                  <Droplets size={21} />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-gray-400">
                    Glasses
                  </span>
                  <span className="font-semibold text-gray-600">
                    {Math.round((water / 8) * 100)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all"
                    style={{
                      width: `${(water / 8) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </button>
          </section>

          {/* Middle Grid */}
          <section className="mt-6 grid gap-6 xl:grid-cols-3">

            {/* Calories Chart */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm xl:col-span-2">

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    Calorie Overview
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    Your calorie intake this week
                  </p>
                </div>

                <button
                  onClick={() => navigate("/progress")}
                  className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700"
                >
                  View progress
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mt-7 flex h-56 items-end justify-between gap-3 px-2">

                {[
                  ["Mon", 62],
                  ["Tue", 78],
                  ["Wed", 55],
                  ["Thu", 84],
                  ["Fri", 72],
                  ["Sat", 91],
                  ["Sun", 71],
                ].map(([day, height]) => (
                  <div
                    key={day}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                  >
                    <div className="flex h-full w-full items-end justify-center">
                      <div
                        className="w-full max-w-10 rounded-t-lg bg-green-100 transition hover:bg-green-500"
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    </div>

                    <span className="text-xs text-gray-400">
                      {day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Water Tracker */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    Water Intake
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    Daily hydration goal
                  </p>
                </div>

                <Droplets
                  size={21}
                  className="text-cyan-500"
                />
              </div>

              <div className="mt-7 flex items-center justify-center">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-cyan-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {water}
                    </p>
                    <p className="text-xs text-gray-400">
                      of 8 glasses
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={removeWater}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  −
                </button>

                <button
                  onClick={addWater}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600"
                >
                  <Plus size={17} />
                  Add Water
                </button>
              </div>
            </div>
          </section>

          {/* Today's Meals */}
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:p-6">
              <div>
                <h3 className="font-semibold">
                  Today's Meals
                </h3>

                <p className="mt-1 text-xs text-gray-400">
                  Your meals and calorie intake
                </p>
              </div>

              <button
                onClick={() => navigate("/meals")}
                className="text-sm font-medium text-green-600 hover:text-green-700"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-gray-100">

              {[
                {
                  name: "Breakfast",
                  food: "Oats, banana & milk",
                  calories: 420,
                  icon: "🥣",
                  time: "8:30 AM",
                },
                {
                  name: "Lunch",
                  food: "Chicken, rice & vegetables",
                  calories: 610,
                  icon: "🍛",
                  time: "1:15 PM",
                },
                {
                  name: "Snack",
                  food: "Greek yogurt & nuts",
                  calories: 240,
                  icon: "🥛",
                  time: "4:30 PM",
                },
              ].map((meal) => (
                <button
                  key={meal.name}
                  onClick={() => navigate("/meals")}
                  className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-gray-50 sm:px-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                    {meal.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {meal.name}
                      </h4>

                      <span className="hidden text-xs text-gray-400 sm:block">
                        {meal.time}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm text-gray-400">
                      {meal.food}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {meal.calories}
                    </p>

                    <p className="text-xs text-gray-400">
                      kcal
                    </p>
                  </div>

                  <ChevronRight
                    size={18}
                    className="text-gray-300"
                  />
                </button>
              ))}
            </div>

            {/* Add Meal */}
            <div className="border-t border-gray-100 p-5 sm:p-6">
              <button
                onClick={() => navigate("/scan")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-green-300 py-3 text-sm font-semibold text-green-600 transition hover:bg-green-50"
              >
                <Plus size={18} />
                Add a meal
              </button>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mt-6">

            <h3 className="mb-4 font-semibold">
              Quick Actions
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <button
                onClick={() => navigate("/scan")}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <ScanLine size={21} />
                </div>

                <div>
                  <p className="font-medium">
                    Scan Food
                  </p>
                  <p className="text-xs text-gray-400">
                    Analyze your food
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate("/meals")}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Utensils size={21} />
                </div>

                <div>
                  <p className="font-medium">
                    Add Meal
                  </p>
                  <p className="text-xs text-gray-400">
                    Record your meal
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate("/nutrition")}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  <Apple size={21} />
                </div>

                <div>
                  <p className="font-medium">
                    Nutrition
                  </p>
                  <p className="text-xs text-gray-400">
                    View nutrients
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate("/progress")}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
                  <TrendingUp size={21} />
                </div>

                <div>
                  <p className="font-medium">
                    Progress
                  </p>
                  <p className="text-xs text-gray-400">
                    Track your goals
                  </p>
                </div>
              </button>

            </div>
          </section>

          {/* Footer */}
          <footer className="py-8 text-center text-xs text-gray-400">
            AI Food Calories Meter • Personalized nutrition powered by AI
          </footer>

        </div>
      </main>
    </div>
  );
}