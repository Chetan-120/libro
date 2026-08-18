import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MoreHorizontal,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY_DASHBOARD = {
  totalBooks: 0,
  totalCopies: 0,
  availableCopies: 0,
  activeStudents: 0,
  activeLoans: 0,
  overdueLoans: 0,
  todayIssues: 0,
  todayReturns: 0,
  activeReservations: 0,
  transactionsThisWeek: 0,
  activity: [],
  dueSoon: [],
};

export function LibrarianDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("libro_token") ||
          sessionStorage.getItem("libro_token");

        if (!token) {
          throw new Error("Please login to continue.");
        }

        const response = await fetch(`${API_URL}/api/circulation/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            `Dashboard API returned an unexpected response (${response.status}).`,
          );
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load dashboard data.");
        }

        setDashboard({
          ...EMPTY_DASHBOARD,
          ...(data.dashboard || {}),
        });
      } catch (err) {
        console.error("Fetch librarian dashboard error:", err);
        setError(err.message || "Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("libro_token") ||
          sessionStorage.getItem("libro_token");

        if (!token) {
          throw new Error("Please login to continue.");
        }

        const response = await fetch(`${API_URL}/api/reservations/librarian`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load reservation data.");
        }

        setReservations(data.reservations || []);
      } catch (err) {
        console.error("Fetch librarian reservations error:", err);
      } finally {
        setLoadingReservations(false);
      }
    };

    fetchDashboard();
    fetchReservations();
  }, []);

  const {
    totalBooks,
    activeStudents,
    activeLoans,
    overdueLoans,
    todayIssues,
    todayReturns,
    transactionsThisWeek,
  } = dashboard;

  const activity = dashboard.activity || [];
  const dueSoon = dashboard.dueSoon || [];
  const weeklyChart = dashboard.weeklyChart || [];

  const readyReservations = reservations.filter(
    (reservation) => reservation.status === "ready",
  );

  const waitingReservations = reservations
    .filter((reservation) => reservation.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.reservedAt || a.createdAt).getTime() -
        new Date(b.reservedAt || b.createdAt).getTime(),
    );

  return (
    <div className="min-w-0 pb-8">
      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />

          <p className="text-sm font-semibold text-indigo-700">
            Loading dashboard data...
          </p>
        </div>
      )}
      {/* Header */}
      <section className="mb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              Library overview
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              Good morning, Librarian.
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Here's what's happening across your library today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[10px] font-semibold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:bg-slate-50"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </button>

            <button
              type="button"
              onClick={() => navigate("/librarian/inventory")}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add book
            </button>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Total books"
          value={totalBooks}
          change={`${dashboard.totalCopies} copies`}
          icon={BookOpen}
          tone="indigo"
        />

        <Metric
          label="Active students"
          value={activeStudents}
          change="Currently active"
          icon={Users}
          tone="violet"
        />

        <Metric
          label="Active loans"
          value={activeLoans}
          change={`${todayIssues} issued today`}
          icon={ArrowUpRight}
          tone="emerald"
        />

        <Metric
          label="Overdue loans"
          value={overdueLoans}
          change={`${todayReturns} returned today`}
          icon={Clock3}
          tone="amber"
        />
      </section>

      {/* Smart library actions */}
      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SmartStatus
          label="Ready for pickup"
          value={readyReservations.length}
          description="Students can collect"
          tone="emerald"
          onClick={() => navigate("/librarian/reservations")}
        />

        <SmartStatus
          label="Waiting queue"
          value={waitingReservations.length}
          description="Students waiting"
          tone="indigo"
          onClick={() => navigate("/librarian/reservations")}
        />

        <SmartStatus
          label="Overdue"
          value={overdueLoans}
          description="Needs attention"
          tone="amber"
          onClick={() => navigate("/librarian/circulation")}
        />

        <SmartStatus
          label="Due soon"
          value={dueSoon.length}
          description="Approaching deadline"
          tone="violet"
          onClick={() => navigate("/librarian/circulation")}
        />
      </section>

      {/* Main grid */}
      <section className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        {/* Circulation overview */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                Circulation
              </p>

              <h2 className="mt-1.5 text-base font-bold tracking-[-0.02em] text-slate-950">
                Library activity
              </h2>

              <p className="mt-1 text-[9px] text-slate-400">
                Issues and returns over the last 7 days.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/librarian/circulation")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Open circulation"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-7 flex items-end gap-2">
            <p className="text-3xl font-bold tracking-[-0.06em] text-slate-950">
              {transactionsThisWeek}
            </p>

            <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-700">
              <TrendingUp className="h-2.5 w-2.5" />
              {todayIssues + todayReturns} today
            </span>
          </div>

          <p className="mt-1 text-[9px] text-slate-400">
            total transactions this week
          </p>

          <div className="mt-7">
            <div className="flex h-36 items-end gap-2 sm:h-44 sm:gap-3">
              {weeklyChart.map((item) => {
                const maxValue = Math.max(
                  ...weeklyChart.map((chartItem) =>
                    Math.max(chartItem.issue || 0, chartItem.returnValue || 0),
                  ),
                  1,
                );

                return (
                  <ChartBar
                    key={item.day}
                    day={item.day}
                    issue={item.issue || 0}
                    returnValue={item.returnValue || 0}
                    maxValue={maxValue}
                  />
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4">
              <Legend label="Issues" tone="bg-indigo-500" />
              <Legend label="Returns" tone="bg-emerald-500" />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-[0_10px_30px_rgba(15,23,42,0.1)] sm:p-6">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-300">
            Quick actions
          </p>

          <h2 className="mt-2 text-base font-bold tracking-[-0.02em]">
            What would you like to manage?
          </h2>

          <p className="mt-1 text-[9px] leading-5 text-slate-500">
            Jump directly into the most common library tasks.
          </p>

          <div className="mt-6 space-y-2">
            <Action
              icon={ArrowUpRight}
              title="Issue a book"
              description="Create a circulation record"
              onClick={() => navigate("/librarian/circulation")}
            />

            <Action
              icon={ArrowDownLeft}
              title="Process a return"
              description="Complete a book return"
              onClick={() => navigate("/librarian/circulation")}
            />

            <Action
              icon={BookOpen}
              title="Manage inventory"
              description="Update the catalogue"
              onClick={() => navigate("/librarian/inventory")}
            />

            <Action
              icon={Users}
              title="Student directory"
              description="View student accounts"
              onClick={() => navigate("/librarian/students")}
            />

            <Action
              icon={CircleDollarSign}
              title="Manage fines"
              description="Review outstanding fines"
              onClick={() => navigate("/librarian/fines")}
            />

            <Action
              icon={TrendingUp}
              title="View analytics"
              description="Review library performance"
              onClick={() => navigate("/librarian/analytics")}
            />
          </div>
        </div>
      </section>

      {/* Reservation attention */}
      {(readyReservations.length > 0 || waitingReservations.length > 0) && (
        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          {/* Ready for pickup */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                  Pickup
                </p>

                <h2 className="mt-1.5 text-sm font-bold text-slate-950">
                  Ready for pickup
                </h2>

                <p className="mt-1 text-[9px] text-slate-400">
                  Students who have been assigned a returned copy.
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-bold text-emerald-700">
                {readyReservations.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {readyReservations.slice(0, 4).map((reservation) => (
                <ReservationRow
                  key={reservation._id}
                  reservation={reservation}
                  ready
                />
              ))}

              {readyReservations.length === 0 && (
                <p className="p-5 text-[9px] text-slate-400">
                  No books are currently waiting for pickup.
                </p>
              )}
            </div>
          </div>

          {/* Waiting queue */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  Queue
                </p>

                <h2 className="mt-1.5 text-sm font-bold text-slate-950">
                  Reservation queue
                </h2>

                <p className="mt-1 text-[9px] text-slate-400">
                  Students waiting for unavailable books.
                </p>
              </div>

              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[8px] font-bold text-indigo-700">
                {waitingReservations.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {waitingReservations.slice(0, 4).map((reservation, index) => (
                <ReservationRow
                  key={reservation._id}
                  reservation={reservation}
                  position={index + 1}
                />
              ))}

              {waitingReservations.length === 0 && (
                <p className="p-5 text-[9px] text-slate-400">
                  No students are currently waiting.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Bottom grid */}
      <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Recent activity */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h2 className="text-sm font-bold text-slate-950">
                Recent activity
              </h2>

              <p className="mt-1 text-[9px] text-slate-400">
                Latest circulation transactions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/librarian/circulation")}
              className="inline-flex items-center gap-1 text-[9px] font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activity.map((item, index) => (
              <ActivityRow key={`${item.student}-${index}`} item={item} />
            ))}
          </div>
        </div>

        {/* Due soon */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-950">Due soon</h2>

                <p className="mt-1 text-[9px] text-slate-400">
                  Books approaching their return date.
                </p>
              </div>

              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock3 className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {dueSoon.map((item, index) => (
              <DueItem key={`${item.title}-${index}`} item={item} />
            ))}
          </div>

          <div className="p-4">
            <button
              type="button"
              onClick={() => navigate("/librarian/circulation")}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-[9px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              View all due books
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* System status */}
      <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </span>

          <div>
            <p className="text-[10px] font-bold text-emerald-800">
              All systems operational
            </p>

            <p className="mt-0.5 text-[8px] text-emerald-700/70">
              Library services are running normally.
            </p>
          </div>
        </div>

        <span className="text-[8px] font-semibold text-emerald-700">
          {loading ? "Checking..." : "Last checked just now"}
        </span>
      </section>
    </div>
  );
}

function Metric({ label, value, change, icon: Icon, tone, positive = true }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[9px] font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-xl font-bold tracking-[-0.045em] text-slate-950 sm:text-2xl">
            {value}
          </p>
        </div>

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="mt-3">
        <span
          className={[
            "text-[8px] font-semibold",
            positive ? "text-emerald-600" : "text-rose-600",
          ].join(" ")}
        >
          {change}
        </span>
      </div>
    </div>
  );
}

function ChartBar({ day, issue, returnValue, maxValue }) {
  const issueHeight =
    maxValue > 0 ? Math.max((issue / maxValue) * 100, issue > 0 ? 8 : 0) : 0;

  const returnHeight =
    maxValue > 0
      ? Math.max((returnValue / maxValue) * 100, returnValue > 0 ? 8 : 0)
      : 0;

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
      <div className="flex h-full w-full max-w-10 items-end justify-center gap-1">
        <div
          className="w-1/2 rounded-t-md bg-indigo-500 transition-all hover:bg-indigo-600"
          style={{ height: `${issueHeight}%` }}
          title={`${issue} issues`}
        />

        <div
          className="w-1/2 rounded-t-md bg-emerald-500 transition-all hover:bg-emerald-600"
          style={{ height: `${returnHeight}%` }}
          title={`${returnValue} returns`}
        />
      </div>

      <span className="text-[8px] font-medium text-slate-400">{day}</span>
    </div>
  );
}

function Legend({ label, tone }) {
  return (
    <span className="flex items-center gap-1.5 text-[8px] font-medium text-slate-400">
      <span className={`h-1.5 w-1.5 rounded-full ${tone}`} />
      {label}
    </span>
  );
}

function Action({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-3 text-left transition-all hover:border-white/15 hover:bg-white/[0.09]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-300">
        <Icon className="h-3.5 w-3.5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold text-white">
          {title}
        </span>

        <span className="mt-0.5 block truncate text-[8px] text-slate-500">
          {description}
        </span>
      </span>

      <ArrowRight className="h-3 w-3 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300" />
    </button>
  );
}

function ActivityRow({ item }) {
  const issue = item.type === "Issue";

  return (
    <div className="flex items-center gap-3 p-4 sm:px-6">
      <span
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          issue
            ? "bg-indigo-50 text-indigo-600"
            : "bg-emerald-50 text-emerald-600",
        ].join(" ")}
      >
        {issue ? (
          <ArrowUpRight className="h-3.5 w-3.5" />
        ) : (
          <ArrowDownLeft className="h-3.5 w-3.5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold text-slate-800">
          {item.student}
        </p>

        <p className="mt-0.5 truncate text-[8px] text-slate-400">
          {item.type} · {item.book}
        </p>
      </div>

      <span className="shrink-0 text-[8px] text-slate-400">
        {item.createdAt
          ? new Date(item.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </span>
    </div>
  );
}

function DueItem({ item }) {
  const urgent = item.due === "Today";

  return (
    <div className="flex items-center gap-3 p-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <BookOpen className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold text-slate-800">
          {item.title}
        </p>

        <p className="mt-0.5 truncate text-[8px] text-slate-400">
          {item.student}
        </p>
      </div>

      <span
        className={[
          "shrink-0 rounded-full px-2 py-1 text-[8px] font-semibold",
          urgent ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700",
        ].join(" ")}
      >
        {item.due}
      </span>
    </div>
  );
}

function SmartStatus({ label, value, description, tone, onClick }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <span
        className={`inline-flex rounded-lg px-2 py-1 text-[8px] font-semibold ${tones[tone]}`}
      >
        {label}
      </span>

      <p className="mt-3 text-xl font-bold tracking-[-0.04em] text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-[8px] text-slate-400">{description}</p>
    </button>
  );
}

function ReservationRow({ reservation, ready = false, position }) {
  const studentName =
    reservation.student?.name || reservation.student?.email || "Student";

  const bookTitle = reservation.book?.title || "Book";

  return (
    <div className="flex items-center gap-3 p-4 sm:px-5">
      <span
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold",
          ready
            ? "bg-emerald-50 text-emerald-600"
            : "bg-indigo-50 text-indigo-600",
        ].join(" ")}
      >
        {ready ? "✓" : `#${position}`}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold text-slate-800">
          {bookTitle}
        </p>

        <p className="mt-0.5 truncate text-[8px] text-slate-400">
          {studentName}
        </p>
      </div>

      <span
        className={[
          "shrink-0 rounded-full px-2 py-1 text-[8px] font-semibold",
          ready
            ? "bg-emerald-50 text-emerald-700"
            : "bg-indigo-50 text-indigo-700",
        ].join(" ")}
      >
        {ready ? "Ready" : `#${position}`}
      </span>
    </div>
  );
}
