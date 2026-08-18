import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BookMarked,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Library,
  Users,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getToken = () =>
  localStorage.getItem("libro_token") || sessionStorage.getItem("libro_token");

export function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(`${API_URL}/api/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load analytics.");
      }

      setAnalytics(data.analytics);
    } catch (err) {
      console.error("Fetch analytics error:", err);

      setError(err.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const monthlyData = analytics?.monthlyData || [];

  const popularBooks = analytics?.popularBooks || [];

  const categoryData = analytics?.categoryData || [];

  const maxLoans = useMemo(() => {
    return Math.max(...monthlyData.map((item) => item.loans), 1);
  }, [monthlyData]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-w-0 pb-8">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 pb-8">
      {/* Header */}
      <section className="mb-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <BarChart3 className="h-4 w-4" />
              </span>

              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
                Library intelligence
              </p>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              Analytics
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Track circulation activity, collection performance, member
              engagement, and library trends.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[9px] font-semibold text-slate-600 shadow-sm">
              <CalendarDays className="h-3.5 w-3.5" />
              Last 6 months
            </div>

            <button
              type="button"
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[9px] font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BarChart3
                className={[
                  "h-3.5 w-3.5",
                  refreshing ? "animate-pulse" : "",
                ].join(" ")}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total loans"
          value={analytics.totalLoans.toLocaleString()}
          change={`${analytics.totalReturns.toLocaleString()} returns`}
          positive
          icon={BookMarked}
          tone="indigo"
        />

        <MetricCard
          title="Active members"
          value={analytics.activeMembers.toLocaleString()}
          change={`${analytics.memberEngagement}% engaged`}
          positive
          icon={Users}
          tone="violet"
        />

        <MetricCard
          title="Books available"
          value={analytics.availableCopies.toLocaleString()}
          change={`${analytics.collectionUsage}% in use`}
          positive
          icon={BookOpen}
          tone="emerald"
        />

        <MetricCard
          title="Outstanding fines"
          value={`₹${analytics.outstandingFines.toLocaleString()}`}
          change={`${analytics.overdueLoans} overdue loans`}
          positive={analytics.overdueLoans === 0}
          icon={CircleDollarSign}
          tone="amber"
        />
      </section>

      {/* Main analytics */}
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        {/* Circulation chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                Circulation
              </p>

              <h2 className="mt-1 text-sm font-bold text-slate-950">
                Loans & returns
              </h2>

              <p className="mt-1 text-[8px] text-slate-400">
                Monthly circulation activity across the library.
              </p>
            </div>

            <div className="flex items-center gap-4 text-[8px] font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Loans
              </span>

              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                Returns
              </span>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex h-56 items-end gap-2 sm:gap-4">
              {monthlyData.map((item) => {
                const loanHeight = (item.loans / maxLoans) * 100;

                const returnHeight = (item.returns / maxLoans) * 100;

                return (
                  <div
                    key={item.month}
                    className="flex h-full flex-1 items-end justify-center gap-1.5"
                  >
                    <div
                      className="w-full max-w-5 rounded-t-md bg-indigo-500 transition-all hover:bg-indigo-600"
                      style={{
                        height: `${loanHeight}%`,
                      }}
                      title={`${item.loans} loans`}
                    />

                    <div
                      className="w-full max-w-5 rounded-t-md bg-slate-200 transition-all hover:bg-slate-300"
                      style={{
                        height: `${returnHeight}%`,
                      }}
                      title={`${item.returns} returns`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2 sm:gap-4">
              {monthlyData.map((item) => (
                <div
                  key={item.month}
                  className="flex-1 text-center text-[8px] font-medium text-slate-400"
                >
                  {item.month}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category distribution */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
              Collection
            </p>

            <h2 className="mt-1 text-sm font-bold text-slate-950">
              Category distribution
            </h2>

            <p className="mt-1 text-[8px] text-slate-400">
              Current borrowing distribution by category.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background: (() => {
                  if (categoryData.length === 0) {
                    return "#f1f5f9";
                  }

                  const colors = [
                    "#6366f1",
                    "#818cf8",
                    "#a5b4fc",
                    "#c7d2fe",
                    "#e2e8f0",
                  ];

                  let currentDegree = 0;

                  const segments = categoryData.map((category, index) => {
                    const start = currentDegree;

                    const end = currentDegree + (category.value / 100) * 360;

                    currentDegree = end;

                    return `${colors[index % colors.length]} ${start}deg ${end}deg`;
                  });

                  return `conic-gradient(${segments.join(", ")})`;
                })(),
              }}
            >
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-xl font-bold tracking-[-0.04em] text-slate-950">
                  {categoryData.length > 0
                    ? `${categoryData.reduce(
                        (total, category) => total + category.value,
                        0,
                      )}%`
                    : "0%"}
                </span>

                <span className="text-[7px] text-slate-400">distribution</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {categoryData.map((category, index) => (
              <div key={category.label} className="flex items-center gap-2">
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    index === 0
                      ? "bg-indigo-500"
                      : index === 1
                        ? "bg-indigo-400"
                        : index === 2
                          ? "bg-indigo-300"
                          : index === 3
                            ? "bg-indigo-200"
                            : "bg-slate-200",
                  ].join(" ")}
                />

                <span className="flex-1 text-[8px] font-medium text-slate-500">
                  {category.label}
                </span>

                <span className="text-[8px] font-bold text-slate-700">
                  {category.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary metrics */}
      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <InsightCard
          icon={Clock3}
          eyebrow="Average return"
          title={`${analytics.averageReturn} days`}
          description="Average time taken by members to return borrowed books."
          value={`${analytics.totalReturns} returns`}
          tone="amber"
        />

        <InsightCard
          icon={Library}
          eyebrow="Collection usage"
          title={`${analytics.collectionUsage}%`}
          description="Percentage of the available collection currently in circulation."
          value={`${analytics.activeLoans} active loans`}
          tone="indigo"
        />

        <InsightCard
          icon={Users}
          eyebrow="Member engagement"
          title={`${analytics.memberEngagement}%`}
          description="Percentage of active members who borrowed at least one book."
          value={`${analytics.activeMembers} active members`}
          tone="emerald"
        />
      </section>

      {/* Popular books */}
      <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
              Most borrowed
            </p>

            <h2 className="mt-1 text-sm font-bold text-slate-950">
              Popular books
            </h2>

            <p className="mt-1 text-[8px] text-slate-400">
              Books with the highest circulation during the selected period.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-8 w-fit items-center rounded-lg border border-slate-200 px-3 text-[8px] font-semibold text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            View catalogue
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {popularBooks.length > 0 ? (
            popularBooks.map((book, index) => (
              <div
                key={`${book.title}-${index}`}
                className="flex items-center gap-3 p-4 sm:px-6"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[9px] font-bold text-slate-400">
                  #{index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-bold text-slate-800">
                    {book.title}
                  </p>

                  <p className="mt-0.5 truncate text-[8px] text-slate-400">
                    {book.author} · {book.category}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-800">
                    {book.loans}
                  </p>

                  <p className="text-[7px] text-slate-400">loans</p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No circulation data yet
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Popular books will appear after books are issued.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Bottom insight */}
      <section className="mt-5 overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_12px_35px_rgba(15,23,42,0.12)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
              <BarChart3 className="h-4 w-4" />
            </span>

            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-indigo-300">
                Key insight
              </p>

              <h2 className="mt-1 text-sm font-bold">
                {analytics.totalLoans > analytics.totalReturns
                  ? "More books are currently being borrowed than returned."
                  : "Returns are keeping pace with circulation."}
              </h2>

              <p className="mt-1 max-w-2xl text-[8px] leading-5 text-slate-400">
                The current library activity is based on real circulation,
                collection, member, reservation, and fine records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <BookMarked className="h-3.5 w-3.5 text-indigo-300" />

            <span className="text-[9px] font-bold text-indigo-300">
              {analytics.totalLoans} total loans
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, change, positive, icon: Icon, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[8px] font-medium text-slate-400">{title}</p>

          <p className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-950">
            {value}
          </p>

          <div className="mt-2 flex items-center gap-1">
            {positive ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-rose-500" />
            )}

            <span
              className={[
                "text-[8px] font-bold",
                positive ? "text-emerald-600" : "text-rose-600",
              ].join(" ")}
            >
              {change}
            </span>

            <span className="text-[7px] text-slate-400">current data</span>
          </div>
        </div>

        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            tones[tone],
          ].join(" ")}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, eyebrow, title, description, value, tone }) {
  const tones = {
    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      value: "text-indigo-600",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
      value: "text-amber-600",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            tones[tone].icon,
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-lg font-bold tracking-[-0.03em] text-slate-950">
            {title}
          </h2>
        </div>
      </div>

      <p className="mt-4 text-[8px] leading-5 text-slate-400">{description}</p>

      <div
        className={["mt-4 text-[8px] font-bold", tones[tone].value].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
