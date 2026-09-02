import { useState } from "react";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout";

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >

      {!submitted ? (

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>

            <div className="relative">

              <Mail
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="email"
                required
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
              />

            </div>

          </div>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-500 font-semibold text-white shadow-lg shadow-green-500/20 hover:bg-green-600"
          >
            Send Reset Link
            <ArrowRight size={18} />
          </button>

        </form>

      ) : (

        <div className="rounded-2xl border border-green-100 bg-green-50 p-6 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2
              className="text-green-600"
              size={30}
            />
          </div>

          <h3 className="mt-4 font-semibold text-slate-800">
            Check your email
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            If an account exists with that email, we've sent instructions
            to reset your password.
          </p>

        </div>

      )}

      <a
        href="/login"
        className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700"
      >
        <ArrowLeft size={17} />
        Back to Sign In
      </a>

    </AuthLayout>
  );
}