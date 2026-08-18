import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to sign in.");
      }

      setAuth({
        user: data.user,
        token: data.token,
        remember,
      });

      if (data.user.role === "librarian") {
        navigate("/librarian/dashboard", {
          replace: true,
        });
      } else {
        navigate("/student/dashboard", {
          replace: true,
        });
      }
    } catch (error) {
      setError(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.28),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(124,58,237,0.2),transparent_35%)]" />

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-bold tracking-tight text-white">
                  Libro
                </p>

                <p className="text-[9px] text-slate-500">
                  Digital library system
                </p>
              </div>
            </div>

            <div className="max-w-lg">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[9px] font-semibold text-indigo-200">
                <Sparkles className="h-3 w-3" />
                Your reading space
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-[-0.055em] text-white xl:text-5xl">
                Everything you need to
                <span className="block text-indigo-300">discover & learn.</span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                Explore the collection, manage your loans, reserve books, and
                keep your academic reading organized in one place.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <Feature value="1.2K+" label="Books" />
                <Feature value="846" label="Students" />
                <Feature value="24/7" label="Access" />
              </div>
            </div>

            <p className="text-[9px] text-slate-600">
              © 2026 Library Management System
            </p>
          </div>
        </section>

        {/* Login */}
        <main className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-bold tracking-tight text-slate-950">
                  Libro
                </p>

                <p className="text-[9px] text-slate-400">
                  Digital library system
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 lg:hidden">
                <LockKeyhole className="h-5 w-5" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                Welcome back
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
                Sign in to your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Access your library account and continue where you left off.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field
                label="Email address"
                name="email"
                type="email"
                placeholder="you@university.edu"
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
              />

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setError(
                        "Please contact the library administrator for password assistance.",
                      )
                    }
                    className="text-[9px] font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
                />

                <span className="text-[10px] font-medium text-slate-500">
                  Keep me signed in
                </span>
              </label>

              {error && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3">
                  <p className="text-[10px] font-medium leading-5 text-rose-700">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-[0_8px_20px_rgba(79,70,229,0.16)] transition-all hover:bg-indigo-700 hover:shadow-[0_10px_24px_rgba(79,70,229,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}

                {!loading && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-[9px] font-medium text-slate-400">
                Secure access
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

              <p className="text-[9px] leading-5 text-emerald-700">
                Your account is protected with secure authentication. Never
                share your password with anyone.
              </p>
            </div>

            <p className="mt-7 text-center text-[10px] text-slate-400">
              Access is limited to authorized library accounts.
            </p>

            <p className="mt-8 text-center text-[8px] leading-4 text-slate-400">
              By continuing, you agree to the library's terms of service and
              privacy policy.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  icon: Icon,
  value,
  onChange,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"
      >
        {label}
      </label>

      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={name === "email" ? "email" : "current-password"}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>
    </div>
  );
}

function Feature({ value, label }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
      <p className="text-sm font-bold text-white">{value}</p>

      <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>
    </div>
  );
}
