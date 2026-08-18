import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function StudentReservations() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);

  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [cancellingId, setCancellingId] = useState(null);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("libro_token") ||
          sessionStorage.getItem("libro_token");

        if (!token) {
          setError("Please login to view your reservations.");
          return;
        }

        const response = await fetch(`${API_URL}/api/reservations/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            `Reservations API returned an unexpected response (${response.status}).`,
          );
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load reservations.");
        }

        setReservations(data.reservations || []);
      } catch (err) {
        console.error("Fetch reservations error:", err);

        setError(err.message || "Unable to load reservations.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const filteredReservations = reservations.filter((reservation) => {
    const searchText = [
      reservation.book?.title,
      reservation.book?.author,
      reservation.book?.category,
      reservation.book?.isbn,
      reservation.status,
      reservation._id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchText.includes(query.toLowerCase());
  });

  const activeReservations = reservations.filter((reservation) =>
    ["pending", "ready"].includes(reservation.status),
  ).length;

  const readyCount = reservations.filter(
    (reservation) => reservation.status === "ready",
  ).length;

  const waitingCount = reservations.filter(
    (reservation) => reservation.status === "pending",
  ).length;

  const cancelReservation = async (id) => {
    if (cancellingId) return;

    const token =
      localStorage.getItem("libro_token") ||
      sessionStorage.getItem("libro_token");

    if (!token) {
      setError("Please login to cancel a reservation.");
      return;
    }

    try {
      setCancellingId(id);
      setError("");

      const response = await fetch(`${API_URL}/api/reservations/${id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Cancel reservation API returned an unexpected response (${response.status}).`,
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to cancel reservation.");
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation._id === id
            ? {
                ...reservation,
                status: "cancelled",
              }
            : reservation,
        ),
      );
    } catch (err) {
      console.error("Cancel reservation error:", err);

      setError(err.message || "Unable to cancel reservation.");
    } finally {
      setCancellingId(null);
    }
  };
  const claimReservation = async (id) => {
    if (claimingId) return;

    const token =
      localStorage.getItem("libro_token") ||
      sessionStorage.getItem("libro_token");

    if (!token) {
      setError("Please login to claim your reservation.");
      return;
    }

    try {
      setClaimingId(id);
      setError("");

      const response = await fetch(`${API_URL}/api/reservation-claims/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reservationId: id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to claim the reservation.");
      }

      setReservations((current) =>
        current.map((reservation) =>
          reservation._id === id
            ? {
                ...reservation,
                status: "ready",
                expiresAt: data.reservation?.expiresAt || reservation.expiresAt,
              }
            : reservation,
        ),
      );
    } catch (err) {
      console.error("Claim reservation error:", err);

      setError(err.message || "Unable to claim the reservation.");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="min-w-0 pb-8">
      {/* Header */}
      <section className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Your reservations
        </p>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              My reservations
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Track your reserved books, check their current status, and manage
              your reservations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/student/catalog")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Browse catalogue
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Summary
          label="Active reservations"
          value={activeReservations}
          icon={BookOpen}
          tone="indigo"
        />

        <Summary label="Ready" value={readyCount} icon={Clock3} tone="amber" />

        <Summary
          label="Pending"
          value={waitingCount}
          icon={CalendarDays}
          tone="emerald"
        />
      </section>

      {/* Ready notice */}
      {readyCount > 0 && (
        <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:flex-row sm:items-center">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </span>

          <div>
            <p className="text-[10px] font-bold text-emerald-900">
              {readyCount === 1
                ? "Your reservation is ready for pickup"
                : `${readyCount} reservations are ready for pickup`}
            </p>

            <p className="mt-0.5 text-[8px] leading-4 text-emerald-800/70">
              Your reserved book is ready. Please collect it from the
              circulation desk.
            </p>
          </div>
        </section>
      )}

      {/* Search */}
      <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your reservations..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
      </section>

      {/* Reservations */}
      {error && (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
              Reservation queue
            </p>

            <h2 className="mt-1.5 text-base font-bold tracking-[-0.02em] text-slate-950">
              Your reserved books
            </h2>

            <p className="mt-1 text-[9px] text-slate-400">
              Track the current status of your reservations.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
              Loading reservations...
            </div>
          </div>
        ) : filteredReservations.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredReservations.map((reservation) => (
              <ReservationItem
                key={reservation._id}
                reservation={reservation}
                onCancel={cancelReservation}
                cancelling={cancellingId === reservation._id}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      {/* Policy */}
      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <Policy
          icon={Clock3}
          title="Queue position"
          description="Your position changes automatically when books are returned."
        />

        <Policy
          icon={CalendarDays}
          title="Collection window"
          description="Once available, reserved books should be collected within 7 days."
        />

        <Policy
          icon={MapPin}
          title="Collection point"
          description="Reserved books can be collected from the main circulation desk."
        />
      </section>
    </div>
  );
}

function Summary({ label, value, icon: Icon, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
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

function ReservationItem({ reservation, onCancel, cancelling }) {
  const book = reservation.book;

  const status = reservation.status || "pending";

  const statusLabel =
    status === "pending"
      ? "Pending"
      : status === "ready"
        ? "Ready for collection"
        : status === "collected"
          ? "Collected"
          : status === "cancelled"
            ? "Cancelled"
            : "Expired";

  const ready = status === "ready";

  const coverUrl = book?.coverImage
    ? book.coverImage.startsWith("http://") ||
      book.coverImage.startsWith("https://")
      ? book.coverImage
      : `${API_URL}${
          book.coverImage.startsWith("/") ? "" : "/"
        }${book.coverImage}`
    : "";

  const reservedDate = reservation.createdAt
    ? new Date(reservation.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <article
      className={[
        "p-4 transition-colors sm:p-5",
        ready ? "bg-emerald-50/[0.25]" : "hover:bg-slate-50/60",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Book cover */}
        <div className="flex gap-3">
          <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 shadow-sm">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={`${book?.title || "Book"} cover`}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <BookOpen className="h-5 w-5 text-indigo-500" />
            )}
          </div>

          {/* Mobile title */}
          <div className="min-w-0 sm:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold leading-5 text-slate-900">
                {book?.title || "Unknown book"}
              </h2>

              <Status status={statusLabel} />
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {book?.author || "Unknown author"}
            </p>
          </div>
        </div>

        {/* Book information */}
        <div className="min-w-0 flex-1">
          {/* Desktop title */}
          <div className="hidden sm:block">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold leading-5 text-slate-900">
                {book?.title || "Unknown book"}
              </h2>

              <Status status={statusLabel} />
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {book?.author || "Unknown author"}
            </p>
          </div>

          {/* Reservation details */}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-md">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Reserved on
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-600">
                {reservedDate}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Availability
              </p>

              <p
                className={[
                  "mt-1 text-xs font-semibold",
                  ready ? "text-emerald-600" : "text-slate-600",
                ].join(" ")}
              >
                {ready
                  ? "Ready for pickup"
                  : book?.availableCopies > 0
                    ? `${book.availableCopies} available`
                    : "Currently unavailable"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 sm:w-36 sm:shrink-0 sm:justify-end">
          <div className="text-left sm:text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Status
            </p>

            <p className="mt-1 text-xs font-bold text-slate-900">
              {statusLabel}
            </p>
          </div>

          {status === "pending" && reservation.claimBatchId && (
            <button
              type="button"
              onClick={() => claimReservation(reservation._id)}
              disabled={claimingId === reservation._id}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {claimingId === reservation._id ? (
                <>
                  <Clock3 className="h-3.5 w-3.5 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Claim now
                </>
              )}
            </button>
          )}

          {status === "ready" && (
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready for pickup
            </span>
          )}

          {(status === "pending" || status === "ready") && (
            <button
              type="button"
              onClick={() => onCancel(reservation._id)}
              disabled={cancelling || claimingId === reservation._id}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="h-3.5 w-3.5" />

              {cancelling ? "Cancelling..." : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Status({ status }) {
  const styles = {
    Pending: "border-amber-200 bg-amber-50 text-amber-700",

    "Ready for collection": "border-emerald-200 bg-emerald-50 text-emerald-700",

    Collected: "border-indigo-200 bg-indigo-50 text-indigo-700",

    Cancelled: "border-slate-200 bg-slate-50 text-slate-500",

    Expired: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em]",
        styles[status] || "border-slate-200 bg-slate-50 text-slate-500",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function Policy({ icon: Icon, title, description }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div>
          <p className="text-[9px] font-bold text-slate-800">{title}</p>

          <p className="mt-1 text-[8px] leading-4 text-slate-400">
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

      <h2 className="mt-4 text-base font-bold text-slate-900">
        No reservations found
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        You do not have any reservations matching your search. Browse the
        catalogue to find a book and reserve it.
      </p>
    </div>
  );
}
