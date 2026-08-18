import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CircleDollarSign,
  Mail,
  Search,
  UserRound,
  Users,
  X,
  Clock3,
  AlertCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("libro_token") ||
          sessionStorage.getItem("libro_token");

        if (!token) {
          throw new Error("Please login to continue.");
        }

        const response = await fetch(`${API_URL}/api/users/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load students.");
        }

        setStudents(data.students || []);
      } catch (err) {
        console.error("Fetch students error:", err);

        setError(err.message || "Unable to load students.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesQuery =
        !query.trim() ||
        `${student.name} ${student.studentId || ""} ${student.email}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        (filter === "Fine due" && student.outstandingFines > 0);

      return matchesQuery && matchesFilter;
    });
  }, [students, query, filter]);

  const studentsWithFines = students.filter(
    (student) => student.outstandingFines > 0,
  ).length;

  const totalBorrowed = students.reduce(
    (sum, student) => sum + student.borrowed,
    0,
  );

  const fetchStudentDetails = async (student) => {
    try {
      setDetailsLoading(true);
      setDetailsError("");
      setSelectedStudent(null);

      const token =
        localStorage.getItem("libro_token") ||
        sessionStorage.getItem("libro_token");

      if (!token) {
        throw new Error("Please login to continue.");
      }

      const response = await fetch(
        `${API_URL}/api/users/students/${student._id}/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load student details.");
      }

      setSelectedStudent(data);
    } catch (err) {
      console.error("Fetch student details error:", err);
      setDetailsError(err.message || "Unable to load student details.");
    } finally {
      setDetailsLoading(false);
    }
  };
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
            Loading student directory...
          </p>
        </div>
      )}
      {/* Header */}
      <section className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          People & accounts
        </p>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              Student directory
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Search students and review their borrowing, reservation, and fine
              activity.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-semibold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:bg-slate-50"
          >
            <Users className="h-3.5 w-3.5" />
            Export directory
          </button>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Summary
          label="Total students"
          value={students.length}
          icon={Users}
          tone="indigo"
        />

        <Summary
          label="Books borrowed"
          value={totalBorrowed}
          icon={BookOpen}
          tone="violet"
        />

        <Summary
          label="Students with fines"
          value={studentsWithFines}
          icon={CircleDollarSign}
          tone="amber"
        />
      </section>

      {/* Search */}
      <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student name, ID, email, or department..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1">
            {["All", "Fine due"].map((item) => (
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

      {/* Directory */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
              Registered students
            </p>

            <h2 className="mt-1.5 text-base font-bold tracking-[-0.02em] text-slate-950">
              Directory
            </h2>

            <p className="mt-1 text-[9px] text-slate-400">
              {filteredStudents.length} students shown.
            </p>
          </div>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student._id}
              student={student}
              onViewStudent={fetchStudentDetails}
            />
          ))}

          {filteredStudents.length === 0 && <EmptyState />}
        </div>

        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <TableHead>Student</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Borrowed</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead align="right">Actions</TableHead>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <StudentRow
                  key={student._id}
                  student={student}
                  onViewStudent={fetchStudentDetails}
                />
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && <EmptyState />}
        </div>
      </section>
      {selectedStudent && (
        <StudentDetailsModal
          data={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {detailsLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="rounded-2xl bg-white px-6 py-5 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm font-semibold text-slate-700">
                Loading student details...
              </p>
            </div>
          </div>
        </div>
      )}

      {detailsError && !detailsLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-rose-500" />

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Unable to load student
                </h3>

                <p className="mt-1 text-xs text-slate-500">{detailsError}</p>
              </div>

              <button
                type="button"
                onClick={() => setDetailsError("")}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Users className="h-4 w-4" />
          </span>

          <div>
            <p className="text-[10px] font-bold text-indigo-900">
              Student records are up to date
            </p>

            <p className="mt-0.5 text-[8px] text-indigo-700/60">
              Account activity is synchronized with circulation records.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 text-[8px] font-semibold text-indigo-700"
        >
          View account report
          <ArrowRight className="h-3 w-3" />
        </button>
      </section>
    </div>
  );
}

function Summary({ label, value, icon: Icon, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
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

function StudentRow({ student, onViewStudent }) {
  return (
    <tr className="transition-colors hover:bg-slate-50/50">
      <td className="px-4 py-4">
        <div className="flex min-w-[250px] items-center gap-3">
          <Avatar name={student.name} />

          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold text-slate-800">
              {student.name}
            </p>

            <p className="mt-0.5 truncate text-[8px] text-slate-400">
              {student.studentId || "No student ID"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <p className="text-[9px] font-semibold text-slate-700">
          {student.email}
        </p>

        <p className="mt-0.5 text-[8px] text-slate-400">Student account</p>
      </td>

      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-slate-700">
          <BookOpen className="h-3 w-3 text-indigo-500" />
          {student.borrowed}
        </span>
      </td>

      <td className="px-4 py-4">
        {student.outstandingFines > 0 ? (
          <span className="text-[9px] font-bold text-amber-600">
            ₹{student.outstandingFines}
          </span>
        ) : (
          <span className="text-[9px] font-semibold text-emerald-600">
            Clear
          </span>
        )}
      </td>

      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={() => onViewStudent(student)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[8px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          View
          <ArrowRight className="h-2.5 w-2.5" />
        </button>
      </td>
    </tr>
  );
}

function StudentCard({ student, onViewStudent }) {
  return (
    <article className="p-4">
      <div className="flex gap-3">
        <Avatar name={student.name} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-[10px] font-bold text-slate-800">
                {student.name}
              </h2>

              <p className="mt-0.5 truncate text-[8px] text-slate-400">
                {student.studentId || "No student ID"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-[7px] font-semibold text-indigo-700">
              {student.studentId || "No student ID"}
            </span>

            <span className="rounded-full bg-slate-100 px-2 py-1 text-[7px] font-semibold text-slate-500">
              Student
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Borrowed
              </p>

              <p className="mt-1 text-[9px] font-bold text-slate-700">
                {student.borrowed} books
              </p>
            </div>

            <div>
              <p className="text-[7px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Outstanding
              </p>

              <p
                className={[
                  "mt-1 text-[9px] font-bold",
                  student.outstandingFines > 0
                    ? "text-amber-600"
                    : "text-emerald-600",
                ].join(" ")}
              >
                {student.outstandingFines > 0
                  ? `₹${student.outstandingFines}`
                  : "Clear"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onViewStudent(student)}
              className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-[8px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <UserRound className="h-2.5 w-2.5" />
              View profile
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1 text-[7px] text-slate-400">
              <Mail className="h-2.5 w-2.5" />
              {student.email}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function Avatar({ name }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-bold text-white shadow-sm">
      {initials}
    </div>
  );
}

function TableHead({ children, align = "left" }) {
  return (
    <th
      className={[
        "px-4 py-3 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Users className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-sm font-bold text-slate-900">
        No students found
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Try another name, student ID, or fine filter.
      </p>
    </div>
  );
}

function StudentDetailsModal({ data, onClose }) {
  const student = data.student;
  const loans = data.activeLoans || [];
  const reservations = data.reservations || [];
  const fines = data.fines || [];
  const history = data.circulationHistory || [];

  const formatDate = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar name={student.name} />

              <div>
                <h2 className="text-lg font-bold tracking-[-0.03em] text-slate-950">
                  {student.name}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {student.studentId || "No student ID"} · {student.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close student details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-5 sm:grid-cols-4 sm:p-6">
            <DetailStat
              label="Active loans"
              value={student.summary?.activeLoans ?? loans.length}
              icon={BookOpen}
            />

            <DetailStat
              label="Reservations"
              value={student.summary?.reservations ?? 0}
              icon={Clock3}
            />

            <DetailStat
              label="Outstanding fines"
              value={`₹${student.summary?.outstandingFines ?? 0}`}
              icon={CircleDollarSign}
            />

            <DetailStat
              label="Total fines"
              value={student.summary?.totalFines ?? fines.length}
              icon={AlertCircle}
            />
          </div>

          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
            {/* Active Loans */}
            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  Current borrowing
                </p>

                <h3 className="mt-1 text-sm font-bold text-slate-900">
                  Active loans
                </h3>
              </div>

              {loans.length === 0 ? (
                <EmptyDetail text="No active loans." />
              ) : (
                <div className="space-y-3">
                  {loans.map((loan) => (
                    <div key={loan._id} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold text-slate-800">
                        {loan.book?.title || "Unknown book"}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {loan.book?.author || "Unknown author"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-3 text-[9px] text-slate-500">
                        <span>Issued: {formatDate(loan.issuedAt)}</span>

                        <span>Due: {formatDate(loan.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reservations */}
            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  Book requests
                </p>

                <h3 className="mt-1 text-sm font-bold text-slate-900">
                  Reservations
                </h3>
              </div>

              {reservations.length === 0 ? (
                <EmptyDetail text="No reservations." />
              ) : (
                <div className="space-y-3">
                  {reservations.slice(0, 5).map((reservation) => (
                    <div
                      key={reservation._id}
                      className="rounded-xl bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {reservation.book?.title || "Unknown book"}
                          </p>

                          <p className="mt-1 text-[9px] text-slate-400">
                            Reserved:{" "}
                            {formatDate(
                              reservation.reservedAt || reservation.createdAt,
                            )}
                          </p>
                        </div>

                        <span className="rounded-full bg-indigo-50 px-2 py-1 text-[8px] font-bold capitalize text-indigo-700">
                          {reservation.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Fines */}
            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  Account charges
                </p>

                <h3 className="mt-1 text-sm font-bold text-slate-900">Fines</h3>
              </div>

              {fines.length === 0 ? (
                <EmptyDetail text="No fines recorded." />
              ) : (
                <div className="space-y-3">
                  {fines.slice(0, 5).map((fine) => (
                    <div
                      key={fine._id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          ₹{fine.amount || 0}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-400">
                          {fine.reason || "Library fine"}
                        </p>
                      </div>

                      <span
                        className={[
                          "rounded-full px-2 py-1 text-[8px] font-bold",
                          fine.status === "Pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700",
                        ].join(" ")}
                      >
                        {fine.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* History */}
            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  Library activity
                </p>

                <h3 className="mt-1 text-sm font-bold text-slate-900">
                  Circulation history
                </h3>
              </div>

              {history.length === 0 ? (
                <EmptyDetail text="No circulation history." />
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {history.slice(0, 10).map((transaction) => (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-800">
                          {transaction.book?.title || "Unknown book"}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-400">
                          {formatDate(
                            transaction.createdAt ||
                              transaction.issuedAt ||
                              transaction.returnedAt,
                          )}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-[8px] font-bold text-slate-600">
                        {transaction.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-950 px-4 py-2 text-[10px] font-semibold text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>

        <Icon className="h-3.5 w-3.5 text-indigo-500" />
      </div>

      <p className="mt-2 text-lg font-bold tracking-[-0.03em] text-slate-900">
        {value}
      </p>
    </div>
  );
}

function EmptyDetail({ text }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-6 text-center">
      <p className="text-[10px] font-medium text-slate-400">{text}</p>
    </div>
  );
}
