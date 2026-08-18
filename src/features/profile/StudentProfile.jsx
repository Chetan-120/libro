import React, { useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Edit3,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

export function StudentProfile() {
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    firstName: 'Chetan',
    lastName: 'Waddamani',
    email: 'chetan@university.edu',
    phone: '+91 98765 43210',
    department: 'Master of Computer Applications',
    year: '2nd Year',
    studentId: 'STU-2026-014',
    location: 'Bengaluru, Karnataka',
  });

  const [draft, setDraft] = useState(profile);

  const handleSave = (event) => {
    event.preventDefault();
    setProfile(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  return (
    <div className="min-w-0 pb-8">
      {/* Header */}
      <section className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Account
        </p>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              My profile
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Manage your personal information and library account details.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setDraft(profile);
                setEditing(true);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-[10px] font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit profile
            </button>
          )}
        </div>
      </section>

      {/* Profile hero */}
      <section className="overflow-hidden rounded-2xl bg-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.1)]">
        <div className="relative p-5 sm:p-7">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-lg shadow-indigo-950/30">
              {getInitials(profile.firstName, profile.lastName)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-[-0.04em] text-white">
                  {profile.firstName} {profile.lastName}
                </h2>

                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[8px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Active
                </span>
              </div>

              <p className="mt-1 text-[10px] text-slate-400">
                {profile.studentId}
              </p>

              <p className="mt-2 text-[9px] leading-5 text-slate-500">
                {profile.department} · {profile.year}
              </p>
            </div>

            <div className="sm:ml-auto">
              <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Library status
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />

                  <span className="text-[10px] font-semibold text-white">
                    Good standing
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {editing ? (
        <EditProfile
          draft={draft}
          setDraft={setDraft}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <>
          {/* Account stats */}
          <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Books borrowed"
              value="3"
              icon={BookOpen}
              tone="indigo"
            />

            <StatCard
              label="Books returned"
              value="18"
              icon={CheckCircle2}
              tone="emerald"
            />

            <StatCard
              label="Reservations"
              value="2"
              icon={CalendarDays}
              tone="violet"
            />

            <StatCard
              label="Outstanding fines"
              value="₹0"
              icon={ShieldCheck}
              tone="amber"
            />
          </section>

          {/* Details */}
          <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  Personal information
                </p>

                <h2 className="mt-1.5 text-base font-bold tracking-[-0.02em] text-slate-950">
                  Your details
                </h2>
              </div>

              <div className="grid gap-x-6 sm:grid-cols-2">
                <InfoItem
                  icon={UserRound}
                  label="Full name"
                  value={`${profile.firstName} ${profile.lastName}`}
                />

                <InfoItem
                  icon={Mail}
                  label="Email address"
                  value={profile.email}
                />

                <InfoItem
                  icon={Phone}
                  label="Phone number"
                  value={profile.phone}
                />

                <InfoItem
                  icon={MapPin}
                  label="Location"
                  value={profile.location}
                />

                <InfoItem
                  icon={GraduationCap}
                  label="Department"
                  value={profile.department}
                />

                <InfoItem
                  icon={CalendarDays}
                  label="Academic year"
                  value={profile.year}
                />
              </div>
            </div>

            {/* Account card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="h-4 w-4" />
                </span>

                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Account information
                  </h2>

                  <p className="mt-0.5 text-[8px] text-slate-400">
                    Library membership details.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <AccountRow
                  label="Student ID"
                  value={profile.studentId}
                />

                <AccountRow
                  label="Membership"
                  value="Active"
                  status
                />

                <AccountRow
                  label="Member since"
                  value="August 2025"
                />

                <AccountRow
                  label="Borrowing limit"
                  value="5 books"
                />
              </div>

              <button
                type="button"
                className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-[9px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                View borrowing policy
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </section>

          {/* Security */}
          <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <ShieldCheck className="h-4 w-4" />
                </span>

                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Password & security
                  </h2>

                  <p className="mt-1 max-w-lg text-[9px] leading-5 text-slate-400">
                    Keep your account secure by using a strong password and
                    reviewing your sign-in settings.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-[9px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Change password
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function EditProfile({
  draft,
  setDraft,
  onSave,
  onCancel,
}) {
  const update = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <form
      onSubmit={onSave}
      className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
    >
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
          Profile settings
        </p>

        <h2 className="mt-1.5 text-base font-bold tracking-[-0.02em] text-slate-950">
          Edit your information
        </h2>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <Field
          label="First name"
          value={draft.firstName}
          onChange={(value) => update('firstName', value)}
        />

        <Field
          label="Last name"
          value={draft.lastName}
          onChange={(value) => update('lastName', value)}
        />

        <Field
          label="Email address"
          type="email"
          value={draft.email}
          onChange={(value) => update('email', value)}
        />

        <Field
          label="Phone number"
          value={draft.phone}
          onChange={(value) => update('phone', value)}
        />

        <Field
          label="Department"
          value={draft.department}
          onChange={(value) => update('department', value)}
        />

        <Field
          label="Academic year"
          value={draft.year}
          onChange={(value) => update('year', value)}
        />

        <div className="sm:col-span-2">
          <Field
            label="Location"
            value={draft.location}
            onChange={(value) => update('location', value)}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end sm:p-6">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-slate-200 px-5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="h-10 rounded-xl bg-indigo-600 px-5 text-[10px] font-semibold text-white hover:bg-indigo-700"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-[10px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-950">
            {value}
          </p>
        </div>

        <span
          className={[
            'flex h-8 w-8 items-center justify-center rounded-lg',
            tones[tone],
          ].join(' ')}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 p-4 sm:p-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0">
        <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-[10px] font-semibold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

function AccountRow({
  label,
  value,
  status = false,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-[9px] text-slate-400">
        {label}
      </span>

      {status ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {value}
        </span>
      ) : (
        <span className="text-right text-[9px] font-semibold text-slate-700">
          {value}
        </span>
      )}
    </div>
  );
}

function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}