import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(99,102,241,0.3),transparent_35%),radial-gradient(circle_at_85%_85%,rgba(124,58,237,0.2),transparent_38%)]" />

          <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-bold tracking-tight text-white">
                  Library
                </p>

                <p className="text-[9px] text-slate-500">
                  Digital library system
                </p>
              </div>
            </div>

            <div className="max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
                Join the library
              </p>

              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.055em] text-white xl:text-5xl">
                Your next
                <span className="block text-indigo-300">
                  chapter starts here.
                </span>
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                Create your student account and get a simpler way to discover,
                borrow, reserve, and manage your books.
              </p>

              <div className="mt-8 space-y-3">
                <Benefit text="Browse the complete library collection" />
                <Benefit text="Reserve books before they are gone" />
                <Benefit text="Track loans and due dates in one place" />
                <Benefit text="Receive important library updates" />
              </div>
            </div>

            <p className="text-[9px] text-slate-600">
              © 2026 Library Management System
            </p>
          </div>
        </section>

        {/* Registration */}
        <main className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-bold tracking-tight text-slate-950">
                  Library
                </p>

                <p className="text-[9px] text-slate-400">
                  Digital library system
                </p>
              </div>
            </div>

            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                Get started
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
                Create your account
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Set up your student profile to start using the library.
              </p>
            </div>

            <form
              onSubmit={(event) => event.preventDefault()}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="first-name"
                  label="First name"
                  placeholder="Alex"
                  icon={UserRound}
                />

                <Field
                  id="last-name"
                  label="Last name"
                  placeholder="Johnson"
                  icon={UserRound}
                />
              </div>

              <Field
                id="email"
                label="University email"
                type="email"
                placeholder="you@university.edu"
                icon={Mail}
              />

              <Field
                id="student-id"
                label="Student ID"
                placeholder="STU-2026-001"
                icon={BookOpen}
              />

              <PasswordField
                id="password"
                label="Password"
                placeholder="Create a strong password"
                visible={showPassword}
                onToggle={() =>
                  setShowPassword((value) => !value)
                }
              />

              <PasswordField
                id="confirm-password"
                label="Confirm password"
                placeholder="Re-enter your password"
                visible={showConfirm}
                onToggle={() =>
                  setShowConfirm((value) => !value)
                }
              />

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Password requirements
                </p>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Requirement text="8+ characters" />
                  <Requirement text="One uppercase letter" />
                  <Requirement text="One number" />
                  <Requirement text="One special character" />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 py-1">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(event) =>
                    setAgree(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />

                <span className="text-[9px] leading-5 text-slate-500">
                  I agree to the library's{' '}
                  <button
                    type="button"
                    className="font-semibold text-indigo-600"
                  >
                    terms of service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    className="font-semibold text-indigo-600"
                  >
                    privacy policy
                  </button>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={!agree}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-[0_8px_20px_rgba(79,70,229,0.16)] transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Create account

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

              <p className="text-[9px] leading-5 text-emerald-700">
                Your account information is handled securely and is only used
                for library services.
              </p>
            </div>

            <p className="mt-6 text-center text-[10px] text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Sign in
              </button>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  type = 'text',
  placeholder,
  icon: Icon,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"
      >
        {label}
      </label>

      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
        />
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  visible,
  onToggle,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"
      >
        {label}
      </label>

      <div className="relative">
        <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          aria-label={
            visible ? 'Hide password' : 'Show password'
          }
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function Requirement({ text }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check className="h-2.5 w-2.5" />
      </span>

      <span className="text-[9px] text-slate-500">
        {text}
      </span>
    </div>
  );
}

function Benefit({ text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-indigo-300">
        <Check className="h-3 w-3" />
      </span>

      <span className="text-[10px] font-medium text-slate-400">
        {text}
      </span>
    </div>
  );
}