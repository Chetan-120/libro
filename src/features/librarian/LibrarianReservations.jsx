import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FILTERS = [
  "All",
  "Pending",
  "Ready",
  "Collected",
  "Cancelled",
  "Expired",
];

const statusStyles = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ready: {
    label: "Ready",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  collected: {
    label: "Collected",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
  expired: {
    label: "Expired",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

function getToken() {
  return (
    localStorage.getItem("libro_token") || sessionStorage.getItem("libro_token")
  );
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }) {
  const config = statusStyles[status] || statusStyles.pending;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1",
        "text-[8px] font-bold uppercase tracking-[0.08em]",
        config.className,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}

function ReservationActions({ reservation, updatingId, onUpdateStatus }) {
  const isUpdating = updatingId === reservation._id;

  if (["collected", "cancelled", "expired"].includes(reservation.status)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {reservation.status === "pending" && (
        <>
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[8px] font-bold text-amber-700">
            <Clock3 className="h-3 w-3" />
            Waiting for student claim
          </span>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(reservation, "cancelled")}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[8px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
            Cancel
          </button>
        </>
      )}

      {reservation.status === "ready" && (
        <>
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[8px] font-bold text-emerald-700">
            <Check className="h-3 w-3" />
            Ready for pickup
          </span>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(reservation, "cancelled")}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[8px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUpdating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
            Cancel
          </button>
        </>
      )}
    </div>
  );
}

export function LibrarianReservations() {
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(`${API_URL}/api/reservations/librarian`, {
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
      console.error("Fetch librarian reservations error:", err);

      setError(err.message || "Unable to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const updateStatus = async (reservation, status) => {
    try {
      setUpdatingId(reservation._id);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(
        `${API_URL}/api/reservations/${reservation._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Reservation update API returned an unexpected response (${response.status}).`,
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update reservation.");
      }

      setReservations((current) =>
        current.map((item) =>
          item._id === reservation._id ? data.reservation : item,
        ),
      );
    } catch (err) {
      console.error("Update reservation status error:", err);

      setError(err.message || "Unable to update reservation.");
    } finally {
      setUpdatingId(null);
    }
  };

  const reservationsWithQueue = useMemo(() => {
    const queues = new Map();

    reservations
      .filter((reservation) => reservation.status === "pending")
      .sort((a, b) => {
        const aDate = new Date(a.reservedAt || a.createdAt).getTime();

        const bDate = new Date(b.reservedAt || b.createdAt).getTime();

        if (aDate !== bDate) {
          return aDate - bDate;
        }

        return String(a._id).localeCompare(String(b._id));
      })
      .forEach((reservation) => {
        const bookId =
          reservation.book?._id?.toString() || reservation.book?.toString();

        if (!bookId) {
          return;
        }

        if (!queues.has(bookId)) {
          queues.set(bookId, []);
        }

        queues.get(bookId).push(reservation._id.toString());
      });

    return reservations.map((reservation) => {
      const bookId =
        reservation.book?._id?.toString() || reservation.book?.toString();

      const queue = queues.get(bookId) || [];

      const position = queue.indexOf(reservation._id.toString()) + 1;

      return {
        ...reservation,
        queuePosition:
          reservation.status === "pending" && position > 0 ? position : null,
        priority:
          reservation.status === "pending" && position > 0 ? position : null,
      };
    });
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reservationsWithQueue.filter((reservation) => {
      const matchesFilter =
        filter === "All" || reservation.status === filter.toLowerCase();

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const student = reservation.student || {};

      const book = reservation.book || {};

      const searchableText = [
        student.name,
        student.email,
        student.studentId,
        book.title,
        book.author,
        book.isbn,
        reservation.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [reservationsWithQueue, filter, query]);

  const counts = useMemo(() => {
    return {
      all: reservations.length,
      pending: reservations.filter((item) => item.status === "pending").length,
      ready: reservations.filter((item) => item.status === "ready").length,
      collected: reservations.filter((item) => item.status === "collected")
        .length,
      cancelled: reservations.filter((item) => item.status === "cancelled")
        .length,
      expired: reservations.filter((item) => item.status === "expired").length,
    };
  }, [reservations]);

  return (
    <div className="min-w-0 pb-8">
      {error && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700">{error}</p>

            {error.toLowerCase().includes("queue") && (
              <p className="mt-1 text-xs text-rose-600">
                Reservations must be processed in queue order. The student with
                Queue #1 has priority.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-rose-500 transition hover:text-rose-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-500">
            Library operations
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">
            Reservations
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage student book reservations and collection status from one
            place.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReservations}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={["h-3.5 w-3.5", loading ? "animate-spin" : ""].join(" ")}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Total reservations
          </p>

          <p className="mt-2 text-2xl font-bold tracking-[-0.05em] text-slate-950">
            {counts.all}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-amber-600">
            Pending
          </p>

          <p className="mt-2 text-2xl font-bold tracking-[-0.05em] text-amber-700">
            {counts.pending}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-indigo-600">
            Ready
          </p>

          <p className="mt-2 text-2xl font-bold tracking-[-0.05em] text-indigo-700">
            {counts.ready}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-emerald-600">
            Collected
          </p>

          <p className="mt-2 text-2xl font-bold tracking-[-0.05em] text-emerald-700">
            {counts.collected}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search student, book, ID or ISBN..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((item) => {
                const count =
                  item === "All" ? counts.all : counts[item.toLowerCase()];

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={[
                      "rounded-lg px-3 py-2 text-[8px] font-bold uppercase tracking-[0.06em] transition",
                      filter === item
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    {item} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              Loading reservations...
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <BookOpen className="h-5 w-5 text-slate-400" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-800">
              No reservations found
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              There are no reservations matching the current search or status
              filter.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Priority
                    </th>

                    <th className="px-5 py-3 text-left text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Queue Position
                    </th>

                    <th className="px-5 py-3 text-left text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Student
                    </th>

                    <th className="px-5 py-3 text-left text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Book
                    </th>

                    <th className="px-5 py-3 text-left text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Reserved
                    </th>

                    <th className="px-5 py-3 text-left text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReservations.map((reservation) => {
                    const student = reservation.student || {};
                    const book = reservation.book || {};

                    return (
                      <tr
                        key={reservation._id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          {reservation.priority ? (
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={[
                                  "inline-flex h-7 min-w-7 items-center justify-center rounded-lg",
                                  reservation.priority === 1
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-slate-100 text-slate-600",
                                  "text-[9px] font-bold",
                                ].join(" ")}
                              >
                                {reservation.priority}
                              </span>

                              {reservation.priority === 1 && (
                                <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-indigo-600">
                                  Next priority
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {reservation.queuePosition ? (
                            <span className="inline-flex items-center rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-[9px] font-bold text-indigo-700">
                              #{reservation.queuePosition}
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                              <UserRound className="h-3.5 w-3.5 text-indigo-600" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-[10px] font-bold text-slate-800">
                                {student.name || "Unknown student"}
                              </p>

                              <p className="mt-0.5 truncate text-[8px] text-slate-400">
                                {student.studentId || student.email || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="max-w-[240px] truncate text-[10px] font-bold text-slate-800">
                            {book.title || "Unknown book"}
                          </p>

                          <p className="mt-0.5 max-w-[240px] truncate text-[8px] text-slate-400">
                            {book.author || "Unknown author"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-600">
                            <Clock3 className="h-3 w-3 text-slate-400" />
                            {formatDate(reservation.createdAt)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={reservation.status} />
                        </td>

                        <td className="px-5 py-4">
                          <ReservationActions
                            reservation={reservation}
                            updatingId={updatingId}
                            onUpdateStatus={updateStatus}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredReservations.map((reservation) => {
                const student = reservation.student || {};
                const book = reservation.book || {};

                return (
                  <div key={reservation._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {reservation.queuePosition ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Priority
                            </span>

                            <span className="mt-1 flex h-7 min-w-7 items-center justify-center rounded-lg bg-indigo-100 px-2 text-[9px] font-bold text-indigo-700">
                              {reservation.priority}
                            </span>
                          </div>
                        ) : null}

                        {reservation.queuePosition ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              Queue
                            </span>

                            <span className="mt-1 rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-1.5 text-[9px] font-bold text-indigo-700">
                              #{reservation.queuePosition}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                          <UserRound className="h-4 w-4 text-indigo-600" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-bold text-slate-800">
                            {student.name || "Unknown student"}
                          </p>

                          <p className="mt-0.5 truncate text-[8px] text-slate-400">
                            {student.studentId || student.email || "—"}
                          </p>
                        </div>
                      </div>

                      <StatusBadge status={reservation.status} />
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <div className="flex items-start gap-2.5">
                        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-bold text-slate-700">
                            {book.title || "Unknown book"}
                          </p>

                          <p className="mt-0.5 truncate text-[8px] text-slate-400">
                            {book.author || "Unknown author"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 text-[8px] font-semibold text-slate-400">
                        <Clock3 className="h-3 w-3" />
                        Reserved {formatDate(reservation.createdAt)}
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <ReservationActions
                        reservation={reservation}
                        updatingId={updatingId}
                        onUpdateStatus={updateStatus}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
