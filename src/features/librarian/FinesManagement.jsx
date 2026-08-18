import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  ReceiptText,
  Search,
  WalletCards,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getToken = () =>
  localStorage.getItem("libro_token") || sessionStorage.getItem("libro_token");

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function FinesManagement() {
  const [fines, setFines] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const loadFines = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(`${API_URL}/api/fines`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load fines.");
      }

      setFines(data.fines || []);
    } catch (err) {
      console.error("Load fines error:", err);

      setError(err.message || "Unable to load fines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFines();
  }, []);

  const filteredFines = useMemo(() => {
    return fines.filter((fine) => {
      const student = fine.student || {};
      const book = fine.book || {};

      const searchableText = [
        student.name,
        student.studentId,
        student.email,
        book.title,
        book.author,
        fine._id,
        fine.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !query.trim() || searchableText.includes(query.trim().toLowerCase());

      const matchesFilter = filter === "All" || fine.status === filter;

      return matchesQuery && matchesFilter;
    });
  }, [fines, query, filter]);

  const pendingFines = fines.filter((fine) => fine.status === "Pending");

  const paidFines = fines.filter((fine) => fine.status === "Paid");
  const syncFineRecords = async () => {
    try {
      setSyncing(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(`${API_URL}/api/fines/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to synchronize fines.");
      }

      await loadFines();
    } catch (err) {
      console.error("Sync fines error:", err);

      setError(err.message || "Unable to synchronize fines.");
    } finally {
      setSyncing(false);
    }
  };

  const pendingAmount = pendingFines.reduce(
    (sum, fine) => sum + fine.amount,
    0,
  );

  const collectedAmount = paidFines.reduce((sum, fine) => sum + fine.amount, 0);

  const markAsPaid = async (id) => {
    try {
      setPayingId(id);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(`${API_URL}/api/fines/${id}/pay`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to mark fine as paid.");
      }

      setFines((current) =>
        current.map((fine) => (fine._id === id ? data.fine : fine)),
      );
    } catch (err) {
      console.error("Mark fine as paid error:", err);

      setError(err.message || "Unable to update fine payment.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="min-w-0 space-y-5 pb-8">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
          <p className="text-sm font-semibold text-indigo-700">
            Loading fine records...
          </p>
        </div>
      )}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Finance & penalties
        </p>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              Fines management
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Track outstanding fines, payment status, and collected penalties.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <ReceiptText className="h-3.5 w-3.5" />
            Export report
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary
          label="Pending fines"
          value={`₹${pendingAmount}`}
          icon={Clock3}
          tone="amber"
        />

        <Summary
          label="Collected"
          value={`₹${collectedAmount}`}
          icon={CheckCircle2}
          tone="emerald"
        />

        <Summary
          label="Pending records"
          value={pendingFines.length}
          icon={ReceiptText}
          tone="rose"
        />

        <Summary
          label="Total records"
          value={fines.length}
          icon={CreditCard}
          tone="indigo"
        />
      </section>

      {pendingAmount > 0 && (
        <section className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_12px_35px_rgba(15,23,42,0.12)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                <WalletCards className="h-4 w-4" />
              </span>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                  Outstanding balance
                </p>

                <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">
                  ₹{pendingAmount}
                </p>

                <p className="mt-1 text-[8px] text-slate-500">
                  Across {pendingFines.length} pending record
                  {pendingFines.length !== 1 ? "s" : ""}.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:w-64">
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-slate-500">
                  Collection progress
                </span>

                <span className="text-[9px] font-bold text-emerald-300">
                  {collectedAmount + pendingAmount > 0
                    ? Math.round(
                        (collectedAmount / (collectedAmount + pendingAmount)) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${
                      collectedAmount + pendingAmount > 0
                        ? (collectedAmount /
                            (collectedAmount + pendingAmount)) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student, book, or fine ID..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1">
            {["All", "Pending", "Paid"].map((item) => (
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
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
            Fine records
          </p>

          <div className="mt-1.5 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold tracking-[-0.02em] text-slate-950">
              Payment history
            </h2>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-semibold text-slate-500">
              {filteredFines.length} records
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {filteredFines.map((fine) => (
            <FineCard
              key={fine._id}
              fine={fine}
              onPay={markAsPaid}
              payingId={payingId}
            />
          ))}

          {filteredFines.length === 0 && <EmptyState />}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <TableHead>Fine</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Action</TableHead>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredFines.map((fine) => (
                <FineRow
                  key={fine._id}
                  fine={fine}
                  onPay={markAsPaid}
                  payingId={payingId}
                />
              ))}
            </tbody>
          </table>

          {filteredFines.length === 0 && <EmptyState />}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Policy
          icon={IndianRupee}
          title="Late fee"
          value="₹10 / day"
          description="Standard overdue charge applied to borrowed books."
        />

        <Policy
          icon={Clock3}
          title="Payment status"
          value="Track instantly"
          description="Update the record immediately after payment is collected."
        />

        <Policy
          icon={ReceiptText}
          title="Audit trail"
          value="Linked records"
          description="Each fine remains connected to the student and book."
        />
      </section>
    </div>
  );
}

function Summary({ label, value, icon: Icon, tone }) {
  const tones = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
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
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  );
}

function FineRow({ fine, onPay, payingId }) {
  const pending = fine.status === "Pending";
  const student = fine.student || {};
  const book = fine.book || {};

  return (
    <tr className="transition-colors hover:bg-slate-50/60">
      <td className="px-4 py-4">
        <span className="text-[9px] font-bold text-slate-700">{fine._id}</span>
      </td>

      <td className="px-4 py-4">
        <div className="min-w-[170px]">
          <p className="text-[10px] font-bold text-slate-800">
            {student.name || "Unknown student"}
          </p>

          <p className="mt-0.5 text-[8px] text-slate-400">
            {student.studentId || student.email || "—"}
          </p>
        </div>
      </td>

      <td className="max-w-[220px] px-4 py-4">
        <p className="truncate text-[10px] font-semibold text-slate-700">
          {book.title || "Unknown book"}
        </p>
      </td>

      <td className="px-4 py-4">
        <span className="rounded-full bg-amber-50 px-2 py-1 text-[8px] font-semibold text-amber-700">
          {fine.reason}
        </span>
      </td>

      <td className="px-4 py-4">
        <span className="text-[10px] font-bold text-slate-800">
          ₹{fine.amount}
        </span>
      </td>

      <td className="px-4 py-4">
        <span className="text-[8px] font-medium text-slate-500">
          {formatDate(fine.createdAt)}
        </span>
      </td>

      <td className="px-4 py-4">
        <Status status={fine.status} />
      </td>

      <td className="px-4 py-4 text-right">
        {pending ? (
          <button
            type="button"
            onClick={() => onPay(fine._id)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 text-[8px] font-semibold text-white transition hover:bg-indigo-600"
          >
            <CheckCircle2 className="h-2.5 w-2.5" />
            Mark paid
          </button>
        ) : (
          <span className="text-[8px] font-semibold text-emerald-600">
            Completed
          </span>
        )}
      </td>
    </tr>
  );
}

function FineCard({ fine, onPay, payingId }) {
  const pending = fine.status === "Pending";
  const student = fine.student || {};
  const book = fine.book || {};

  return (
    <article className="p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <IndianRupee className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold text-slate-800">
                {student.name || "Unknown student"}
              </p>

              <p className="mt-0.5 text-[8px] text-slate-400">
                {student.studentId || student.email || "—"} · {fine._id}
              </p>
            </div>

            <Status status={fine.status} />
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-700">
              {book.title || "Unknown book"}
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              {fine.reason} · {formatDate(fine.createdAt)}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Amount
              </p>

              <p className="mt-1 text-sm font-bold tracking-[-0.03em] text-slate-900">
                ₹{fine.amount}
              </p>
            </div>

            {pending ? (
              <button
                type="button"
                onClick={() => onPay(fine.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-[8px] font-semibold text-white transition hover:bg-indigo-600"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                Mark paid
              </button>
            ) : (
              <span className="text-[8px] font-semibold text-emerald-600">
                Payment completed
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Status({ status }) {
  const pending = status === "Pending";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[7px] font-semibold ${
        pending
          ? "bg-amber-50 text-amber-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          pending ? "bg-amber-500" : "bg-emerald-500"
        }`}
      />

      {status}
    </span>
  );
}

function Policy({ icon: Icon, title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div>
          <p className="text-[9px] font-bold text-slate-800">{title}</p>

          <p className="mt-1 text-[8px] font-semibold text-indigo-600">
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

function TableHead({ children, align = "left" }) {
  return (
    <th
      className={`px-4 py-3 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <ReceiptText className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-sm font-bold text-slate-900">
        No fine records found
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Try another student, book, or payment status.
      </p>
    </div>
  );
}
