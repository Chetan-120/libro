import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Library,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getCoverImageUrl = (coverImage) => {
  if (!coverImage) {
    return null;
  }

  if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
    return coverImage;
  }

  if (coverImage.startsWith("/")) {
    return `${API_URL}${coverImage}`;
  }

  return `${API_URL}/${coverImage}`;
};

export function StudentDashboard() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [fines, setFines] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [books, setBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("libro_token") ||
        sessionStorage.getItem("libro_token");

      if (!token) {
        throw new Error("Please login to view your dashboard.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        loansResponse,
        reservationsResponse,
        finesResponse,
        notificationsResponse,
        booksResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/circulation/my-loans`, {
          headers,
        }),

        fetch(`${API_URL}/api/reservations/my`, {
          headers,
        }),

        fetch(`${API_URL}/api/fines/my`, {
          headers,
        }),

        fetch(`${API_URL}/api/notifications/my`, {
          headers,
        }),

        fetch(`${API_URL}/api/books`, {
          headers,
        }),
      ]);

      const loansData = await loansResponse.json();

      const reservationsData = await reservationsResponse.json();

      const finesData = await finesResponse.json();

      const notificationsData = await notificationsResponse.json();

      const booksData = await booksResponse.json();

      if (!loansResponse.ok || !loansData.success) {
        throw new Error(loansData.message || "Unable to load your loans.");
      }

      if (!reservationsResponse.ok || !reservationsData.success) {
        throw new Error(
          reservationsData.message || "Unable to load reservations.",
        );
      }

      if (!finesResponse.ok || !finesData.success) {
        throw new Error(finesData.message || "Unable to load fines.");
      }

      if (!notificationsResponse.ok || !notificationsData.success) {
        throw new Error(
          notificationsData.message || "Unable to load notifications.",
        );
      }

      if (!booksResponse.ok || !booksData.success) {
        throw new Error(booksData.message || "Unable to load books.");
      }

      setLoans(loansData.transactions || []);

      setReservations(reservationsData.reservations || []);

      setFines(finesData.fines || []);

      setNotifications(notificationsData.notifications || []);

      setBooks(booksData.books || []);
    } catch (err) {
      console.error("Student dashboard error:", err);

      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const now = new Date();

  const activeLoans = useMemo(
    () => loans.filter((loan) => !loan.returnedAt),
    [loans],
  );

  const activeReservations = useMemo(
    () =>
      reservations.filter((reservation) =>
        ["pending", "ready"].includes(reservation.status),
      ),
    [reservations],
  );

  const readyReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status === "ready"),
    [reservations],
  );

  const waitingReservations = useMemo(
    () =>
      reservations.filter((reservation) => reservation.status === "pending"),
    [reservations],
  );

  const dueThisWeek = useMemo(() => {
    const weekEnd = new Date(now);

    weekEnd.setDate(weekEnd.getDate() + 7);

    return activeLoans.filter((loan) => {
      if (!loan.dueDate) {
        return false;
      }

      const dueDate = new Date(loan.dueDate);

      return dueDate >= now && dueDate <= weekEnd;
    }).length;
  }, [activeLoans]);

  const pendingFineAmount = useMemo(
    () =>
      fines
        .filter((fine) => fine.status === "Pending")
        .reduce((total, fine) => total + Number(fine.amount || 0), 0),
    [fines],
  );

  const recentNotifications = useMemo(
    () =>
      [...notifications]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 3),
    [notifications],
  );

  const borrowedBookIds = new Set(
    activeLoans.map((loan) => loan.book?._id).filter(Boolean),
  );

  const recommendedBooks = useMemo(
    () => books.filter((book) => !borrowedBookIds.has(book._id)).slice(0, 3),
    [books, activeLoans],
  );

  const availableCopies = books.reduce(
    (total, book) => total + Number(book.availableCopies || 0),
    0,
  );

  const displayName = user?.name || "Student";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

          <div>
            <h2 className="text-sm font-bold text-rose-900">
              Unable to load dashboard
            </h2>

            <p className="mt-1 text-xs text-rose-700">{error}</p>

            <button
              type="button"
              onClick={fetchDashboard}
              className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 pb-8">
      {/* Header */}
      <section className="mb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              Student portal
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              Welcome back, {displayName}.
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Keep track of your books, reservations, and library activity.
            </p>
          </div>

          <div className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[10px] font-semibold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <CalendarDays className="h-3.5 w-3.5" />

            {now.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      </section>

      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_10px_30px_rgba(15,23,42,0.1)] sm:p-6">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
              </span>

              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-300">
                Your reading space
              </span>
            </div>

            <h2 className="mt-4 max-w-xl text-lg font-bold tracking-[-0.03em] sm:text-xl">
              {readyReservations.length > 0
                ? "You have a book ready for pickup."
                : dueThisWeek > 0
                  ? "You have books due this week."
                  : waitingReservations.length > 0
                    ? "Your reservation is in the queue."
                    : "Discover something worth reading today."}
            </h2>

            <p className="mt-2 max-w-lg text-[9px] leading-5 text-slate-400">
              {readyReservations.length > 0
                ? "Collect your reserved book from the library before the pickup deadline."
                : dueThisWeek > 0
                  ? "Check your active loans and return books on time."
                  : waitingReservations.length > 0
                    ? "Your queue position will update automatically as books become available."
                    : "Browse the collection, reserve a title, or check your current loans from your personal library dashboard."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/student/catalog")}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[10px] font-bold text-slate-950 transition hover:bg-indigo-50"
          >
            Browse catalogue
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Currently borrowed"
          value={activeLoans.length}
          icon={BookOpen}
          tone="indigo"
        />

        <StatCard
          label="Ready for pickup"
          value={readyReservations.length}
          icon={CheckCircle2}
          tone="emerald"
        />

        <StatCard
          label="Due this week"
          value={dueThisWeek}
          icon={Clock3}
          tone="amber"
        />

        <StatCard
          label="Outstanding fines"
          value={`₹${pendingFineAmount}`}
          icon={pendingFineAmount > 0 ? TriangleAlert : CheckCircle2}
          tone={pendingFineAmount > 0 ? "rose" : "emerald"}
        />
      </section>

      {/* Main content */}
      <section className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Borrowed books */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                My reading
              </p>

              <h2 className="mt-1.5 text-base font-bold tracking-[-0.02em] text-slate-950">
                Currently borrowed
              </h2>

              <p className="mt-1 text-[9px] text-slate-400">
                Books currently checked out to you.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/student/loans")}
              className="inline-flex items-center gap-1 text-[9px] font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {activeLoans.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {activeLoans.slice(0, 3).map((loan) => (
                <BorrowedBook
                  key={loan._id}
                  loan={loan}
                  onView={() => navigate("/student/loans")}
                />
              ))}
            </div>
          ) : (
            <EmptySection
              icon={BookOpen}
              title="No active loans"
              text="You currently have no books checked out."
              action="Browse catalogue"
              onClick={() => navigate("/student/catalog")}
            />
          )}
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  Recent updates
                </h2>

                <p className="mt-1 text-[9px] text-slate-400">
                  Important activity from your library.
                </p>
              </div>

              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Bell className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {recentNotifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentNotifications.map((notification) => (
                <UpdateItem
                  key={notification._id}
                  notification={notification}
                />
              ))}
            </div>
          ) : (
            <EmptySection
              icon={Bell}
              title="No recent updates"
              text="New library activity will appear here."
            />
          )}

          <div className="p-4">
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-[9px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              View notifications
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Reservation status */}
      {activeReservations.length > 0 && (
        <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                Reservation status
              </p>

              <h2 className="mt-1.5 text-base font-bold tracking-[-0.02em] text-slate-950">
                Books you are waiting for
              </h2>

              <p className="mt-1 text-[9px] text-slate-400">
                Your current reservation and pickup status.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/student/catalog")}
              className="inline-flex items-center gap-1 text-[9px] font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              View books
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activeReservations.slice(0, 4).map((reservation) => {
              const isReady = reservation.status === "ready";
              const position = reservation.position;

              return (
                <button
                  key={reservation._id}
                  type="button"
                  onClick={() =>
                    reservation.book?._id &&
                    navigate(`/student/catalog/${reservation.book._id}`)
                  }
                  className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 sm:p-5"
                >
                  <div
                    className={[
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      isReady
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-indigo-50 text-indigo-600",
                    ].join(" ")}
                  >
                    {isReady ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Library className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-bold text-slate-800">
                      {reservation.book?.title || "Reserved book"}
                    </p>

                    <p className="mt-1 text-[8px] text-slate-400">
                      {isReady
                        ? "Ready for pickup"
                        : position
                          ? `You are #${position} in the queue`
                          : "Waiting for the next available copy"}
                    </p>
                  </div>

                  <span
                    className={[
                      "shrink-0 rounded-full px-2.5 py-1 text-[8px] font-semibold",
                      isReady
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-indigo-50 text-indigo-700",
                    ].join(" ")}
                  >
                    {isReady ? "Ready" : `Queue #${position || "—"}`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Recommendations */}
      <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
              From the collection
            </p>

            <h2 className="mt-1.5 text-base font-bold tracking-[-0.02em] text-slate-950">
              Recommended books
            </h2>

            <p className="mt-1 text-[9px] text-slate-400">
              Books currently available in your library collection.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/student/catalog")}
            className="hidden items-center gap-1 text-[9px] font-semibold text-indigo-600 transition hover:text-indigo-700 sm:inline-flex"
          >
            Explore all
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {recommendedBooks.length > 0 ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            {recommendedBooks.map((book) => (
              <RecommendationCard
                key={book._id}
                book={book}
                onView={() => navigate(`/student/catalog/${book._id}`)}
              />
            ))}
          </div>
        ) : (
          <EmptySection
            icon={BookOpen}
            title="No recommendations available"
            text="Add books to the library collection to see recommendations."
            action="Browse catalogue"
            onClick={() => navigate("/student/catalog")}
          />
        )}
      </section>

      {/* Library status */}
      <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Library className="h-4 w-4" />
          </span>

          <div>
            <p className="text-[10px] font-bold text-indigo-900">
              Library collection
            </p>

            <p className="mt-0.5 text-[8px] text-indigo-700/60">
              Current available copies across the catalogue.
            </p>
          </div>
        </div>

        <span className="text-[8px] font-semibold text-indigo-700">
          {availableCopies} {availableCopies === 1 ? "copy" : "copies"}{" "}
          available
        </span>
      </section>
    </div>
  );
}

function getLoanStatus(loan) {
  if (loan.returnedAt) {
    return "Returned";
  }

  if (!loan.dueDate) {
    return "On track";
  }

  const now = new Date();
  const dueDate = new Date(loan.dueDate);

  const daysUntilDue =
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (dueDate.getTime() < now.getTime()) {
    return "Overdue";
  }

  if (daysUntilDue <= 3) {
    return "Due soon";
  }

  return "On track";
}

function calculateLoanProgress(loan) {
  if (!loan.issuedAt || !loan.dueDate) {
    return 0;
  }

  const start = new Date(loan.issuedAt).getTime();

  const due = new Date(loan.dueDate).getTime();

  const now = new Date().getTime();

  if (due <= start) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(((now - start) / (due - start)) * 100)),
  );
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ label, value, icon: Icon, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[9px] font-medium text-slate-400">
            {label}
          </p>

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

function BorrowedBook({ loan, onView }) {
  const status = getLoanStatus(loan);

  const progress = calculateLoanProgress(loan);

  const urgent = status === "Due soon";

  const overdue = status === "Overdue";

  const title = loan.book?.title || "Unknown book";

  const author = loan.book?.author || "Unknown author";

  return (
    <div className="flex gap-3 p-4 sm:p-5">
      <div className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
        {getCoverImageUrl(loan.book?.coverImage) ? (
          <img
            src={getCoverImageUrl(loan.book?.coverImage)}
            alt={title}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <BookOpen className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold text-slate-800">
              {title}
            </p>

            <p className="mt-0.5 text-[8px] text-slate-400">{author}</p>
          </div>

          <span
            className={[
              "w-fit rounded-full px-2 py-1 text-[8px] font-semibold",
              overdue
                ? "bg-rose-50 text-rose-700"
                : urgent
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700",
            ].join(" ")}
          >
            {status}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-slate-400">Loan period</span>

            <span className="text-[8px] font-semibold text-slate-500">
              {progress}%
            </span>
          </div>

          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={[
                "h-full rounded-full transition-all",
                overdue ? "bg-rose-500" : "bg-indigo-500",
              ].join(" ")}
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span
            className={[
              "flex items-center gap-1.5 text-[8px]",
              overdue ? "text-rose-600" : "text-slate-400",
            ].join(" ")}
          >
            <Clock3 className="h-2.5 w-2.5" />
            Due {formatDate(loan.dueDate)}
          </span>

          <button
            type="button"
            onClick={onView}
            className="text-[8px] font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            View details
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateItem({ notification }) {
  const category = notification.category || "announcement";

  const tone =
    category === "overdue" ? "rose" : category === "due" ? "amber" : "indigo";

  const tones = {
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="flex gap-3 p-4">
      <span
        className={[
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          tones[tone],
        ].join(" ")}
      >
        <Bell className="h-3 w-3" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[9px] font-bold text-slate-800">
            {notification.title}
          </p>

          <span className="shrink-0 text-[7px] text-slate-400">
            {notification.createdAt
              ? formatRelativeTime(notification.createdAt)
              : ""}
          </span>
        </div>

        <p className="mt-1 text-[8px] leading-4 text-slate-400">
          {notification.message}
        </p>
      </div>
    </div>
  );
}

function formatRelativeTime(date) {
  const created = new Date(date).getTime();

  const diff = Date.now() - created;

  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatDate(date);
}

function RecommendationCard({ book, onView }) {
  return (
    <article className="group rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white hover:shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-sm">
          {getCoverImageUrl(book.coverImage) ? (
            <img
              src={getCoverImageUrl(book.coverImage)}
              alt={book.title}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <BookOpen className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0">
          <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-indigo-500">
            {book.category || "Library"}
          </span>

          <h3 className="mt-1 truncate text-[10px] font-bold text-slate-800">
            {book.title}
          </h3>

          <p className="mt-0.5 truncate text-[8px] text-slate-400">
            {book.author || "Unknown author"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onView}
        className="mt-4 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[8px] font-semibold text-slate-600 transition-colors group-hover:border-indigo-200 group-hover:text-indigo-600"
      >
        View book
        <ArrowRight className="h-2.5 w-2.5" />
      </button>
    </article>
  );
}

function EmptySection({ icon: Icon, title, text, action, onClick }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon className="h-4 w-4" />
      </div>

      <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>

      <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">{text}</p>

      {action && onClick && (
        <button
          type="button"
          onClick={onClick}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[9px] font-semibold text-white hover:bg-indigo-700"
        >
          {action}

          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
