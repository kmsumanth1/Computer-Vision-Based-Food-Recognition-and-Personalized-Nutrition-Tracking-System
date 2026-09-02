import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Apple, Leaf, Loader2 } from "lucide-react";
import api from "../../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const user = response.data.user;

      // Store logged-in user information
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        "Login failed. Please check your email and password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fbf7] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl border border-green-100">
        <div className="grid min-h-[650px] md:grid-cols-2">

          {/* Left Side */}
          <div className="hidden md:flex relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 p-12 text-white">
            <div className="relative z-10 flex flex-col justify-between w-full">

              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <Leaf size={28} />
                  </div>

                  <div>
                    <h1 className="text-xl font-bold">
                      AI Food
                    </h1>
                    <p className="text-sm text-green-100">
                      Calories Meter
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-4xl font-bold leading-tight">
                  Eat smart.
                  <br />
                  Live healthy.
                </h2>

                <p className="mt-5 max-w-md text-green-50 leading-7">
                  Track your food, understand your nutrition,
                  and reach your health goals with AI-powered
                  food recognition.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-2xl font-bold">AI</p>
                    <p className="text-xs text-green-100">
                      Food Recognition
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-2xl font-bold">24/7</p>
                    <p className="text-xs text-green-100">
                      Tracking
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-2xl font-bold">100%</p>
                    <p className="text-xs text-green-100">
                      Personalized
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-green-100">
                Your nutrition journey starts here.
              </p>
            </div>

            <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-white/10" />
            <div className="absolute -top-24 -right-20 h-64 w-64 rounded-full bg-white/10" />
          </div>

          {/* Right Side */}
          <div className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
            <div className="w-full max-w-md">

              {/* Mobile Logo */}
              <div className="mb-8 flex items-center gap-3 md:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <Leaf size={25} />
                </div>

                <div>
                  <h1 className="font-bold text-gray-900">
                    AI Food
                  </h1>
                  <p className="text-xs text-green-600">
                    Calories Meter
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Welcome back!
                </h2>

                <p className="mt-2 text-gray-500">
                  Sign in to continue your nutrition journey.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff size={19} />
                      ) : (
                        <Eye size={19} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-medium text-green-600 hover:text-green-700"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">
                  OR
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <span className="font-bold text-red-500">
                    G
                  </span>
                  Google
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Apple size={18} />
                  Apple
                </button>
              </div>

              {/* Signup */}
              <p className="mt-8 text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-green-600 hover:text-green-700"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}