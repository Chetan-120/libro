import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  TriangleAlert,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function MyLoans() {
  const [loans, setLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [filter, setFilter] = useState("Active");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyLoans = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("libro_token") ||
        sessionStorage.getItem("libro_token");

      if (!token) {
        throw new Error("Please login to view your loans.");
      }

      const [loansResponse, finesResponse] = await Promise.all([
        fetch(`${API_URL}/api/circulation/my-loans`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${API_URL}/api/fines/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const loansContentType = loansResponse.headers.get("content-type") || "";

      const finesContentType = finesResponse.headers.get("content-type") || "";

      if (!loansContentType.includes("application/json")) {
        throw new Error(
          `Loans API returned an unexpected response (${loansResponse.status}).`,
        );
      }

      if (!finesContentType.includes("application/json")) {
        throw new Error(
          `Fines API returned an unexpected response (${finesResponse.status}).`,
        );
      }

      const loansData = await loansResponse.json();
      const finesData = await finesResponse.json();

      if (!loansResponse.ok || !loansData.success) {
        throw new Error(loansData.message || "Unable to load your loans.");
      }

      if (!finesResponse.ok || !finesData.success) {
        throw new Error(finesData.message || "Unable to load your fines.");
      }

      setLoans(loansData.transactions || []);
      setFines(finesData.fines || []);
    } catch (err) {
      console.error("Fetch my loans error:", err);

      setError(err.message || "Unable to load your loans.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMyLoans();
  }, []);

  const now = new Date();

  const getLoanStatus = (loan) => {
    if (loan.returnedAt) {
      return "Returned";
    }

    if (loan.dueDate) {
      const dueDate = new Date(loan.dueDate);

      const daysUntilDue =
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (dueDate.getTime() < now.getTime()) {
        return "Overdue";
      }

      if (daysUntilDue <= 3) {
        return "Due soon";
      }
    }

    return "On track";
  };

  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const matchesQuery =
        !query.trim() ||
        `${loan.book?.title || ""} ${loan.book?.author || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());

      const status = getLoanStatus(loan);

      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && status !== "Returned") ||
        status === filter;

      return matchesQuery && matchesFilter;
    });
  }, [loans, filter, query]);

  const activeLoans = loans.filter(
    (loan) => getLoanStatus(loan) !== "Returned",
  ).length;

  const dueSoon = loans.filter(
    (loan) => getLoanStatus(loan) === "Due soon",
  ).length;

  const overdue = loans.filter(
    (loan) => getLoanStatus(loan) === "Overdue",
  ).length;

  const pendingFines = fines.filter((fine) => fine.status === "Pending");

  const pendingFineAmount = pendingFines.reduce(
    (total, fine) => total + Number(fine.amount || 0),
    0,
  );

  return (
    <div className="min-w-0 pb-8">
      {/* Header */}
      <section className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Your reading activity
        </p>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              My loans
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Keep track of books you have borrowed, due dates, and return
              requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/student/catalog";
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-[10px] font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Browse catalogue
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Summary
          label="Active loans"
          value={activeLoans}
          icon={BookOpen}
          tone="indigo"
        />

        <Summary label="Due soon" value={dueSoon} icon={Clock3} tone="amber" />

        <Summary
          label="Overdue"
          value={overdue}
          icon={TriangleAlert}
          tone="rose"
        />

        <Summary
          label="Borrowing limit"
          value={`${activeLoans}/5`}
          icon={CalendarDays}
          tone="emerald"
        />
        <Summary
          label="Pending fines"
          value={`₹${pendingFineAmount}`}
          icon={TriangleAlert}
          tone="rose"
        />
      </section>

      {/* Warning */}
      {overdue > 0 && (
        <section className="mt-5 flex gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <TriangleAlert className="h-4 w-4" />
          </span>

          <div>
            <p className="text-[10px] font-bold text-rose-900">
              You have {overdue} overdue book
              {overdue > 1 ? "s" : ""}
            </p>

            <p className="mt-0.5 text-[8px] leading-4 text-rose-800/70">
              Please return overdue books to avoid additional late fees.
            </p>
          </div>
        </section>
      )}

      {/* Loans */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="border-b border-slate-100 p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your borrowed books..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1">
              {["Active", "Due soon", "Overdue", "Returned", "All"].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={[
                      "shrink-0 rounded-lg px-3 py-2 text-[9px] font-semibold transition-colors",
                      filter === item
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {filteredLoans.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredLoans.map((loan) => (
              <LoanItem key={loan._id} loan={loan} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      {/* Fines */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-rose-600">
                Account charges
              </p>

              <h2 className="mt-1 text-sm font-bold text-slate-900">Fines</h2>

              <p className="mt-1 text-[8px] text-slate-400">
                Late-return fines associated with your loans.
              </p>
            </div>

            <div className="rounded-xl bg-rose-50 px-3 py-2 text-right">
              <p className="text-[8px] text-rose-500">Pending</p>

              <p className="mt-0.5 text-sm font-bold text-rose-700">
                ₹{pendingFineAmount}
              </p>
            </div>
          </div>
        </div>

        {fines.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {fines.map((fine) => (
              <FineItem key={fine._id} fine={fine} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />

            <p className="mt-3 text-sm font-bold text-slate-900">No fines</p>

            <p className="mt-1 text-xs text-slate-400">
              You currently have no recorded late-return fines.
            </p>
          </div>
        )}
      </section>

      {/* Policy */}
      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <Policy
          icon={BookOpen}
          title="Borrowing limit"
          value="5 books"
          description="You can keep up to five active loans."
        />

        <Policy
          icon={Clock3}
          title="Loan period"
          value="14 days"
          description="Each book can be borrowed for fourteen days."
        />

        <Policy
          icon={Clock3}
          title="Renewals"
          value="Librarian only"
          description="Visit the librarian if you want to renew a borrowed book."
        />
      </section>
    </div>
  );
}

function Summary({ label, value, icon: Icon, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-medium text-slate-400">{label}</p>

          <p className="mt-2 text-xl font-bold tracking-[-0.04em] text-slate-950">
            {value}
          </p>
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

function LoanItem({ loan }) {
  const now = new Date();

  const returned = Boolean(loan.returnedAt);

  const dueDate = loan.dueDate ? new Date(loan.dueDate) : null;

  const daysUntilDue = dueDate
    ? (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    : null;

  const overdue = !returned && dueDate && dueDate.getTime() < now.getTime();

  const dueSoon =
    !returned &&
    dueDate &&
    dueDate.getTime() >= now.getTime() &&
    daysUntilDue <= 3;

  const status = returned
    ? "Returned"
    : overdue
      ? "Overdue"
      : dueSoon
        ? "Due soon"
        : "On track";

  const title = loan.book?.title || "Unknown book";
  const author = loan.book?.author || "Unknown author";

  const borrowed = loan.issuedAt
    ? new Date(loan.issuedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const due = loan.dueDate
    ? new Date(loan.dueDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const progress = returned
    ? 100
    : dueDate && loan.issuedAt
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((now.getTime() - new Date(loan.issuedAt).getTime()) /
                (dueDate.getTime() - new Date(loan.issuedAt).getTime())) *
                100,
            ),
          ),
        )
      : 0;

  return (
    <article
      className={["p-4 sm:p-5", overdue ? "bg-rose-50/[0.25]" : ""].join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Book */}
        <div className="flex gap-3">
          <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
            {loan.book?.coverImage ? (
              <img
                src={
                  loan.book.coverImage.startsWith("http")
                    ? loan.book.coverImage
                    : `${API_URL}${
                        loan.book.coverImage.startsWith("/") ? "" : "/"
                      }${loan.book.coverImage}`
                }
                alt={loan.book.title}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <BookOpen className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 sm:hidden">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[11px] font-bold text-slate-900">
                {title}
              </h2>

              <Status status={status} />
            </div>

            <p className="mt-1 text-[8px] text-slate-400">{author}</p>
          </div>
        </div>

        {/* Desktop title */}
        <div className="hidden min-w-0 flex-1 sm:block">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[11px] font-bold text-slate-900">{title}</h2>

            <Status status={status} />
          </div>

          <p className="mt-1 text-[8px] text-slate-400">{author}</p>

          <div className="mt-4 max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-slate-400">
                Reading progress
              </span>

              <span className="text-[8px] font-semibold text-slate-500">
                {progress}%
              </span>
            </div>

            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={[
                  "h-full rounded-full",
                  overdue ? "bg-rose-500" : "bg-indigo-500",
                ].join(" ")}
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 sm:w-40 sm:shrink-0 sm:grid-cols-1 sm:gap-2">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Borrowed
            </p>

            <p className="mt-1 text-[9px] font-semibold text-slate-600">
              {borrowed}
            </p>
          </div>

          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Due date
            </p>

            <p
              className={[
                "mt-1 text-[9px] font-semibold",
                overdue
                  ? "text-rose-600"
                  : dueSoon
                    ? "text-amber-600"
                    : "text-slate-600",
              ].join(" ")}
            >
              {due}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch sm:justify-center">
          {!returned && (
            <span className="inline-flex h-8 items-center justify-center rounded-lg bg-slate-50 px-3 text-[8px] font-semibold text-slate-500">
              Return at library
            </span>
          )}

          {returned && (
            <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-[8px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Returned
            </span>
          )}
        </div>
      </div>

      {/* Mobile progress */}
      <div className="mt-4 sm:hidden">
        <div className="flex items-center justify-between">
          <span className="text-[8px] text-slate-400">Reading progress</span>

          <span className="text-[8px] font-semibold text-slate-500">
            {progress}%
          </span>
        </div>

        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={[
              "h-full rounded-full",
              overdue ? "bg-rose-500" : "bg-indigo-500",
            ].join(" ")}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </article>
  );
}
function FineItem({ fine }) {
  const bookTitle = fine.book?.title || "Unknown book";

  const dueDate = fine.dueDate
    ? new Date(fine.dueDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const returnedAt = fine.returnedAt
    ? new Date(fine.returnedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not returned";

  const paid = fine.status === "Paid";

  return (
    <article className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-[10px] font-bold text-slate-900">
            {bookTitle}
          </h3>

          <span
            className={[
              "rounded-full px-2 py-1 text-[7px] font-semibold",
              paid
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700",
            ].join(" ")}
          >
            {fine.status}
          </span>
        </div>

        <p className="mt-1 text-[8px] text-slate-400">
          {fine.overdueDays} overdue day
          {fine.overdueDays !== 1 ? "s" : ""}
          {" · "}
          Due {dueDate}
          {" · "}
          {returnedAt !== "Not returned"
            ? `Returned ${returnedAt}`
            : "Not returned"}
        </p>
      </div>

      <div className="shrink-0 text-left sm:text-right">
        <p className="text-sm font-bold text-slate-900">
          ₹{Number(fine.amount || 0)}
        </p>

        <p className="mt-0.5 text-[7px] text-slate-400">Late return</p>
      </div>
    </article>
  );
}

function Status({ status }) {
  const styles = {
    "Due soon": "bg-amber-50 text-amber-700",
    "On track": "bg-emerald-50 text-emerald-700",
    Overdue: "bg-rose-50 text-rose-700",
    Returned: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={[
        "shrink-0 rounded-full px-2 py-1 text-[7px] font-semibold",
        styles[status] || styles["On track"],
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function Policy({ icon: Icon, title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div>
          <p className="text-[9px] font-bold text-slate-800">{title}</p>

          <p className="mt-0.5 text-[8px] font-semibold text-indigo-600">
            {value}
          </p>

          <p className="mt-2 text-[8px] leading-4 text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <BookOpen className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-sm font-bold text-slate-900">No loans found</h2>

      <p className="mt-1 text-xs text-slate-400">
        There are no books matching your current filter.
      </p>
    </div>
  );
}
