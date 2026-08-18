import React, { useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  Globe2,
  LockKeyhole,
  Moon,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sun,
} from "lucide-react";

export function Settings() {
  const [notifications, setNotifications] = useState({
    email: true,
    dueReminders: true,
    reservations: true,
    announcements: true,
  });

  const [appearance, setAppearance] = useState("Light");

  const toggleNotification = (key) => {
    setNotifications((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <div className="min-w-0 pb-8">
      {/* Header */}
      <section className="mb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Preferences
        </p>

        <div className="mt-2">
          <h1 className="text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
            Settings
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Manage your library preferences, notifications, appearance, and
            account security.
          </p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main settings */}
        <div className="space-y-5">
          {/* Notifications */}
          <SettingsCard
            icon={Bell}
            eyebrow="Notifications"
            title="Notification preferences"
            description="Choose which library updates you want to receive."
          >
            <SettingToggle
              title="Email notifications"
              description="Receive important library updates through email."
              enabled={notifications.email}
              onChange={() => toggleNotification("email")}
            />

            <SettingToggle
              title="Due date reminders"
              description="Get notified when borrowed books are approaching their due date."
              enabled={notifications.dueReminders}
              onChange={() => toggleNotification("dueReminders")}
            />

            <SettingToggle
              title="Reservation updates"
              description="Receive updates when reserved books become available."
              enabled={notifications.reservations}
              onChange={() => toggleNotification("reservations")}
            />

            <SettingToggle
              title="Library announcements"
              description="Stay informed about closures, events, and important notices."
              enabled={notifications.announcements}
              onChange={() => toggleNotification("announcements")}
              last
            />
          </SettingsCard>

          {/* Appearance */}
          <SettingsCard
            icon={Palette}
            eyebrow="Appearance"
            title="Display preferences"
            description="Customize how the library dashboard looks."
          >
            <div>
              <p className="text-[10px] font-bold text-slate-800">
                Theme
              </p>

              <p className="mt-1 text-[8px] leading-4 text-slate-400">
                Choose your preferred interface appearance.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <ThemeOption
                  active={appearance === "Light"}
                  icon={Sun}
                  title="Light"
                  onClick={() => setAppearance("Light")}
                />

                <ThemeOption
                  active={appearance === "Dark"}
                  icon={Moon}
                  title="Dark"
                  onClick={() => setAppearance("Dark")}
                />
              </div>
            </div>
          </SettingsCard>

          {/* Language */}
          <SettingsCard
            icon={Globe2}
            eyebrow="Regional"
            title="Language & region"
            description="Set your preferred language and regional format."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectBox
                label="Language"
                value="English"
                options={["English", "Kannada", "Hindi"]}
              />

              <SelectBox
                label="Region"
                value="India"
                options={["India", "United States", "United Kingdom"]}
              />
            </div>
          </SettingsCard>

          {/* Security */}
          <SettingsCard
            icon={ShieldCheck}
            eyebrow="Security"
            title="Account security"
            description="Manage your sign-in and account protection settings."
          >
            <SecurityRow
              icon={LockKeyhole}
              title="Password"
              description="Last changed recently"
              action="Change"
            />

            <SecurityRow
              icon={Smartphone}
              title="Two-factor authentication"
              description="Add an extra layer of protection"
              action="Set up"
              last
            />
          </SettingsCard>
        </div>

        {/* Side panel */}
        <aside className="space-y-5">
          {/* Account status */}
          <div className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_12px_35px_rgba(15,23,42,0.12)]">
            <div className="absolute" />

            <div className="relative">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
              </span>

              <p className="mt-5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Account status
              </p>

              <h2 className="mt-2 text-lg font-bold tracking-[-0.03em]">
                Everything looks good.
              </h2>

              <p className="mt-2 text-[8px] leading-5 text-slate-500">
                Your library account is active and your preferences are
                synchronized.
              </p>

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-[8px] font-semibold text-emerald-300">
                  Account secure
                </span>
              </div>
            </div>
          </div>

          {/* Quick settings */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <SlidersHorizontal className="h-4 w-4" />
              </span>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  Quick settings
                </p>

                <h2 className="mt-1 text-sm font-bold text-slate-950">
                  Useful actions
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-1">
              <QuickAction
                title="Manage profile"
                description="Update your personal information"
              />

              <QuickAction
                title="Borrowing policy"
                description="Review library borrowing rules"
              />

              <QuickAction
                title="Privacy policy"
                description="View account and data policies"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon className="h-4 w-4" />
        </span>

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-sm font-bold tracking-[-0.01em] text-slate-950">
            {title}
          </h2>

          <p className="mt-1 text-[8px] leading-4 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function SettingToggle({
  title,
  description,
  enabled,
  onChange,
  last = false,
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-4 py-4",
        !last ? "border-b border-slate-100" : "",
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-1 max-w-lg text-[8px] leading-4 text-slate-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onChange}
        aria-pressed={enabled}
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          enabled ? "bg-indigo-600" : "bg-slate-200",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            enabled ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function ThemeOption({
  active,
  icon: Icon,
  title,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
        active
          ? "border-indigo-300 bg-indigo-50/70 ring-2 ring-indigo-500/10"
          : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-8 w-8 items-center justify-center rounded-lg",
          active
            ? "bg-indigo-100 text-indigo-600"
            : "bg-slate-100 text-slate-500",
        ].join(" ")}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>

      <span className="flex-1 text-[9px] font-semibold text-slate-700">
        {title}
      </span>

      {active && (
        <Check className="h-3.5 w-3.5 text-indigo-600" />
      )}
    </button>
  );
}

function SelectBox({
  label,
  value,
  options,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </span>

      <select
        defaultValue={value}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-[9px] font-medium text-slate-700 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SecurityRow({
  icon: Icon,
  title,
  description,
  action,
  last = false,
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 py-4",
        !last ? "border-b border-slate-100" : "",
      ].join(" ")}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-[8px] text-slate-400">
          {description}
        </p>
      </div>

      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-1 text-[8px] font-semibold text-indigo-600 hover:text-indigo-700"
      >
        {action}
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

function QuickAction({
  title,
  description,
}) {
  return (
    <button
      type="button"
      className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold text-slate-700">
          {title}
        </p>

        <p className="mt-0.5 text-[8px] text-slate-400">
          {description}
        </p>
      </div>

      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
    </button>
  );
}