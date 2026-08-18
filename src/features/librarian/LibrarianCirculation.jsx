import React, { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  CreditCard,
  LogIn,
  LogOut,
  Search,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialTransactions = [];

export function LibrarianCirculation() {
  const [transactions, setTransactions] = useState(initialTransactions);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  const [issueForm, setIssueForm] = useState({
    studentId: "",
    bookId: "",
    dueDate: "",
    physicalCopyId: "",
    copyCode: "",
    scannerValue: "",
    scannerStep: "student",
    isExtraLoan: false,
    extraLoanReason: "",
  });

  const [issuing, setIssuing] = useState(false);

  const [issueError, setIssueError] = useState("");

  const [issueSuccess, setIssueSuccess] = useState("");

  const [students, setStudents] = useState([]);

  const [books, setBooks] = useState([]);

  const [reservations, setReservations] = useState([]);

  const [loadingStudents, setLoadingStudents] = useState(false);

  const [loadingBooks, setLoadingBooks] = useState(false);

  const [loadingReservations, setLoadingReservations] = useState(false);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const [returnTransactionId, setReturnTransactionId] = useState("");

  const [returnScannerValue, setReturnScannerValue] = useState("");
  const [returnScannerStep, setReturnScannerStep] = useState("student");
  const [returnStudentId, setReturnStudentId] = useState("");

  const [returning, setReturning] = useState(false);

  const [returnError, setReturnError] = useState("");

  const [returnSuccess, setReturnSuccess] = useState("");

  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  const [renewTransactionId, setRenewTransactionId] = useState("");

  const [renewDueDate, setRenewDueDate] = useState("");

  const [renewing, setRenewing] = useState(false);

  const [renewError, setRenewError] = useState("");

  const [renewSuccess, setRenewSuccess] = useState("");

  const selectedRenewTransaction = transactions.find(
    (transaction) => transaction._id === renewTransactionId,
  );

  const selectedRenewBookId = selectedRenewTransaction?.book?._id;

  const waitingReservations = selectedRenewBookId
    ? reservations
        .filter(
          (reservation) =>
            reservation.book?._id === selectedRenewBookId &&
            reservation.status === "pending" &&
            reservation.student?._id !== selectedRenewTransaction?.student?._id,
        )
        .sort(
          (a, b) =>
            new Date(a.reservedAt || a.createdAt).getTime() -
            new Date(b.reservedAt || b.createdAt).getTime(),
        )
    : [];

  const waitingReservationCount = waitingReservations.length;

  const waitingReservationExists = waitingReservationCount > 0;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("libro_token") ||
        sessionStorage.getItem("libro_token");

      if (!token) {
        setError("Please login to access circulation.");
        return;
      }

      const response = await fetch(`${API_URL}/api/circulation`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load circulation data.");
      }

      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Fetch circulation error:", err);

      setError(err.message || "Unable to load circulation data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      setIssueError("");

      const token =
        localStorage.getItem("libro_token") ||
        sessionStorage.getItem("libro_token");

      if (!token) {
        throw new Error("Please login to access students.");
      }

      const response = await fetch(`${API_URL}/api/circulation/students`, {
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

      setIssueError(err.message || "Unable to load students.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoadingReservations(true);

      const token =
        localStorage.getItem("libro_token") ||
        sessionStorage.getItem("libro_token");

      if (!token) {
        throw new Error("Please login to access reservations.");
      }

      const response = await fetch(`${API_URL}/api/reservations/librarian`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load reservation queue.");
      }

      setReservations(data.reservations || []);
    } catch (err) {
      console.error("Fetch reservations error:", err);
    } finally {
      setLoadingReservations(false);
    }
  };

  const fetchCirculationBooks = async () => {
    try {
      setLoadingBooks(true);
      setIssueError("");

      const token =
        localStorage.getItem("libro_token") ||
        sessionStorage.getItem("libro_token");

      if (!token) {
        throw new Error("Please login to access books.");
      }

      const response = await fetch(`${API_URL}/api/circulation/books`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load books.");
      }

      setBooks(data.books || []);
    } catch (err) {
      console.error("Fetch circulation books error:", err);

      setIssueError(err.message || "Unable to load books.");
    } finally {
      setLoadingBooks(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchReservations();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const searchText = [
        transaction._id,
        transaction.student?.name,
        transaction.student?.email,
        transaction.student?.studentId,
        transaction.book?.title,
        transaction.book?.author,
        transaction.book?.isbn,
        transaction.type,
        transaction.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !query.trim() || searchText.includes(query.trim().toLowerCase());

      const isOverdue =
        transaction.type === "Issue" &&
        transaction.status === "Completed" &&
        !transaction.returnedAt &&
        transaction.dueDate &&
        new Date(transaction.dueDate).getTime() < Date.now();

      const matchesFilter =
        filter === "All"
          ? true
          : filter === "Overdue"
            ? isOverdue
            : transaction.type === filter;

      return matchesQuery && matchesFilter;
    });
  }, [transactions, query, filter]);

  const today = new Date();

  const isToday = (dateValue) => {
    if (!dateValue) {
      return false;
    }

    const date = new Date(dateValue);

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const todayTransactions = transactions.filter((transaction) =>
    isToday(transaction.createdAt),
  ).length;

  const issuedToday = transactions.filter(
    (transaction) =>
      isToday(transaction.createdAt) && transaction.type === "Issue",
  ).length;

  const returnedToday = transactions.filter(
    (transaction) =>
      isToday(transaction.createdAt) && transaction.type === "Return",
  ).length;

  const selectedStudentActiveLoans = transactions.filter(
    (transaction) =>
      transaction.student?._id === issueForm.studentId &&
      transaction.type === "Issue" &&
      transaction.status === "Completed" &&
      !transaction.returnedAt,
  ).length;

  const selectedStudentAtLimit = selectedStudentActiveLoans >= 5;
  const selectedStudentReadyReservation = reservations.find(
    (reservation) =>
      reservation.student?._id === issueForm.studentId &&
      reservation.book?._id === issueForm.bookId &&
      reservation.status === "ready",
  );

  const selectedBookIsReadyForPickup = Boolean(selectedStudentReadyReservation);

  const openIssueModal = async () => {
    setIssueForm({
      studentId: "",
      bookId: "",
      dueDate: "",
      physicalCopyId: "",
      copyCode: "",
      scannerValue: "",
      scannerStep: "student",
      isExtraLoan: false,
      extraLoanReason: "",
    });

    setIssueError("");
    setIssueSuccess("");

    setIsIssueModalOpen(true);

    if (students.length === 0) {
      await fetchStudents();
    }

    if (books.length === 0) {
      await fetchCirculationBooks();
    }
  };
  const openReturnModal = async (transactionId = "") => {
    setReturnTransactionId(transactionId);
    setReturnScannerValue("");
    setReturnScannerStep("student");
    setReturnStudentId("");
    setReturnError("");
    setReturnSuccess("");
    setIsReturnModalOpen(true);

    if (students.length === 0) {
      await fetchStudents();
    }
  };

  const closeReturnModal = () => {
    if (returning) {
      return;
    }

    setIsReturnModalOpen(false);
    setReturnTransactionId("");
    setReturnScannerValue("");
    setReturnScannerStep("student");
    setReturnStudentId("");
    setReturnError("");
    setReturnSuccess("");
  };

  const handleReturnBook = async (event) => {
    event.preventDefault();

    if (returning) {
      return;
    }

    if (!returnTransactionId) {
      setReturnError("Please select an issued book.");
      return;
    }

    const token =
      localStorage.getItem("libro_token") ||
      sessionStorage.getItem("libro_token");

    if (!token) {
      setReturnError("Your librarian session has expired. Please login again.");
      return;
    }

    try {
      setReturning(true);
      setReturnError("");
      setReturnSuccess("");

      const response = await fetch(`${API_URL}/api/circulation/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: returnTransactionId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to return the book.");
      }

      setReturnSuccess(data.message || "Book returned successfully.");

      await fetchTransactions();
      await fetchCirculationBooks();
      await fetchReservations();

      setTimeout(() => {
        setIsReturnModalOpen(false);
        setReturnTransactionId("");
        setReturnSuccess("");
      }, 1000);
    } catch (err) {
      console.error("Return book error:", err);

      setReturnError(err.message || "Unable to receive the returned book.");
    } finally {
      setReturning(false);
    }
  };

  const handleReturnScannerInput = (event) => {
    const value = event.target.value.trim();

    if (!value) {
      return;
    }

    if (returnScannerStep === "student") {
      const student = students.find(
        (item) =>
          String(item.studentId || "")
            .trim()
            .toLowerCase() === value.toLowerCase(),
      );

      if (!student) {
        setReturnError(`Student ID "${value}" was not found.`);
        setReturnScannerValue("");
        return;
      }

      setReturnError("");
      setReturnStudentId(student._id);
      setReturnScannerValue("");
      setReturnScannerStep("book");

      return;
    }

    if (returnScannerStep === "book") {
      const transaction = transactions.find((item) => {
        const matchesStudent = item.student?._id === returnStudentId;

        const matchesBook =
          String(item.book?.isbn || "")
            .trim()
            .toLowerCase() === value.toLowerCase() ||
          String(item.book?._id || "")
            .trim()
            .toLowerCase() === value.toLowerCase();

        return (
          matchesStudent &&
          matchesBook &&
          item.type === "Issue" &&
          !item.returnedAt
        );
      });

      if (!transaction) {
        setReturnError("No active issue was found for this student and book.");
        setReturnScannerValue("");
        return;
      }

      setReturnError("");
      setReturnTransactionId(transaction._id);
      setReturnScannerValue("");
      setReturnScannerStep("copy");

      return;
    }

    const transaction = transactions.find(
      (item) => item._id === returnTransactionId,
    );

    if (!transaction) {
      setReturnError("Issue transaction could not be found.");
      setReturnScannerValue("");
      return;
    }

    const barcode = transaction.physicalCopy?.barcode?.trim().toLowerCase();

    if (barcode && barcode !== value.toLowerCase()) {
      setReturnError(
        "The scanned physical copy does not match the issued copy.",
      );
      setReturnScannerValue("");
      return;
    }

    setReturnError("");
    setReturnScannerValue("");
    setReturnScannerStep("complete");
  };

  const openRenewModal = () => {
    setRenewTransactionId("");
    setRenewDueDate("");
    setRenewError("");
    setRenewSuccess("");
    setIsRenewModalOpen(true);
  };

  const closeRenewModal = () => {
    if (renewing) {
      return;
    }

    setIsRenewModalOpen(false);
    setRenewTransactionId("");
    setRenewDueDate("");
    setRenewError("");
    setRenewSuccess("");
  };

  const handleRenewBook = async (event) => {
    event.preventDefault();

    if (renewing) {
      return;
    }

    if (!renewTransactionId) {
      setRenewError("Please select an issued book.");
      return;
    }

    const token =
      localStorage.getItem("libro_token") ||
      sessionStorage.getItem("libro_token");

    if (!token) {
      setRenewError("Your librarian session has expired. Please login again.");
      return;
    }

    try {
      setRenewing(true);
      setRenewError("");
      setRenewSuccess("");

      const response = await fetch(`${API_URL}/api/circulation/renew`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: renewTransactionId,
          dueDate: renewDueDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to renew the book.");
      }

      setRenewSuccess(data.message || "Book renewed successfully.");

      await fetchTransactions();
      await fetchReservations();

      setTimeout(() => {
        setIsRenewModalOpen(false);
        setRenewTransactionId("");
        setRenewDueDate("");
        setRenewSuccess("");
      }, 1000);
    } catch (err) {
      console.error("Renew book error:", err);

      setRenewError(err.message || "Unable to renew the book.");
    } finally {
      setRenewing(false);
    }
  };

  const closeIssueModal = () => {
    if (issuing) {
      return;
    }

    setIsIssueModalOpen(false);

    setIssueError("");
    setIssueSuccess("");
  };

  const handleIssueBook = async (event) => {
    event.preventDefault();

    if (issuing) {
      return;
    }

    const token =
      localStorage.getItem("libro_token") ||
      sessionStorage.getItem("libro_token");

    if (!token) {
      setIssueError("Your librarian session has expired. Please login again.");
      return;
    }

    if (!issueForm.studentId || !issueForm.bookId) {
      setIssueError("Student and book are required.");
      return;
    }

    if (issueForm.scannerStep === "copy" && !issueForm.copyCode.trim()) {
      setIssueError("Please scan the physical copy before issuing.");
      return;
    }

    try {
      setIssuing(true);
      setIssueError("");
      setIssueSuccess("");

      const response = await fetch(`${API_URL}/api/circulation/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: issueForm.studentId.trim(),
          bookId: issueForm.bookId.trim(),
          dueDate: issueForm.dueDate || undefined,
          physicalCopyId: issueForm.physicalCopyId || undefined,
          copyCode: issueForm.copyCode?.trim() || undefined,
          isExtraLoan: issueForm.isExtraLoan,
          extraLoanReason: issueForm.isExtraLoan
            ? issueForm.extraLoanReason.trim()
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to issue the book.");
      }

      setTransactions((current) => [data.transaction, ...current]);

      setIssueSuccess(data.message || "Book issued successfully.");

      setIssueForm({
        studentId: "",
        bookId: "",
        dueDate: "",
        physicalCopyId: "",
        copyCode: "",
        scannerValue: "",
        scannerStep: "student",
        isExtraLoan: false,
        extraLoanReason: "",
      });

      await fetchCirculationBooks();
    } catch (err) {
      console.error("Issue book error:", err);

      setIssueError(err.message || "Unable to issue the book.");
    } finally {
      setIssuing(false);
    }
  };

  const handleScannerInput = (event) => {
    const value = event.target.value.trim();

    if (!value) {
      return;
    }

    setIssueForm((current) => {
      if (current.scannerStep === "student") {
        const student = students.find(
          (item) =>
            String(item.studentId || "")
              .trim()
              .toLowerCase() === value.toLowerCase(),
        );

        if (!student) {
          setIssueError(`Student ID "${value}" was not found.`);
          return {
            ...current,
            scannerValue: "",
          };
        }

        setIssueError("");

        return {
          ...current,
          studentId: student._id,
          scannerValue: "",
          scannerStep: "book",
        };
      }

      if (current.scannerStep === "book") {
        const book = books.find(
          (item) =>
            String(item.isbn || "")
              .trim()
              .toLowerCase() === value.toLowerCase() ||
            String(item._id || "")
              .trim()
              .toLowerCase() === value.toLowerCase(),
        );

        if (!book) {
          setIssueError(`Book "${value}" was not found.`);
          return {
            ...current,
            scannerValue: "",
          };
        }

        const readyReservation = reservations.find(
          (reservation) =>
            reservation.student?._id === current.studentId &&
            reservation.book?._id === book._id &&
            reservation.status === "ready",
        );

        const unavailable =
          Number(book.availableCopies) <= 0 && !readyReservation;

        if (unavailable) {
          setIssueError("This book is currently unavailable for this student.");
          return {
            ...current,
            scannerValue: "",
          };
        }

        setIssueError("");

        return {
          ...current,
          bookId: book._id,
          scannerValue: "",
          scannerStep: "copy",
        };
      }

      setIssueError("");

      return {
        ...current,
        copyCode: value,
        scannerValue: "",
        scannerStep: "student",
      };
    });
  };

  return (
    <div className="min-w-0 pb-8">
      {/* Header */}
      <section className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Library operations
        </p>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              Circulation desk
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Manage book issues, returns, renewals, and daily circulation
              activity from one place.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={openIssueModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-[10px] font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <LogIn className="h-3.5 w-3.5" />
              Issue book
            </button>

            <button
              type="button"
              onClick={openReturnModal}
              className="hidden h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-semibold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:bg-slate-50 sm:inline-flex"
            >
              <LogOut className="h-3.5 w-3.5" />
              Receive return
            </button>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary
          label="Today's transactions"
          value={todayTransactions}
          icon={CreditCard}
          tone="indigo"
        />

        <Summary
          label="Books issued"
          value={issuedToday}
          icon={LogIn}
          tone="violet"
        />

        <Summary
          label="Books returned"
          value={returnedToday}
          icon={LogOut}
          tone="emerald"
        />

        <Summary
          label="Desk status"
          value="Open"
          icon={CheckCircle2}
          tone="amber"
        />
      </section>

      {/* Quick actions */}
      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <QuickAction
          icon={LogIn}
          title="Issue a book"
          description="Check out a book to a student."
          onClick={openIssueModal}
        />

        <QuickAction
          icon={LogOut}
          title="Receive return"
          description="Receive a physical book returned by a student."
          onClick={openReturnModal}
        />

        <QuickAction
          icon={Clock3}
          title="Renew a loan"
          description="Extend an eligible borrowing period."
          onClick={openRenewModal}
        />
      </section>

      {/* Transactions */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="border-b border-slate-100 p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search student, book, or transaction ID..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-50 p-1">
              {["All", "Issue", "Return", "Renew", "Overdue"].map((item) => (
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
        </div>

        {error && (
          <div className="border-b border-rose-100 bg-rose-50 px-4 py-3">
            <p className="text-xs font-semibold text-rose-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-500">
              Loading circulation...
            </p>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction._id}
                  transaction={transaction}
                  onReceive={openReturnModal}
                />
              ))}

              {filteredTransactions.length === 0 && <EmptyState />}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <TableHead>Transaction</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead align="right">Action</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction._id}
                      transaction={transaction}
                      onReceive={openReturnModal}
                    />
                  ))}
                </tbody>
              </table>

              {filteredTransactions.length === 0 && <EmptyState />}
            </div>
          </>
        )}
      </section>

      {/* Issue Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Issue a book
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the student, book, and due date for this issue.
                </p>
              </div>

              <button
                type="button"
                onClick={closeIssueModal}
                disabled={issuing}
                className="text-sm font-semibold text-slate-400 hover:text-slate-700 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleIssueBook} className="mt-5 space-y-4">
              {/* Scanner */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-indigo-900">
                      Smart Scanner
                    </p>

                    <p className="mt-1 text-[11px] text-indigo-600">
                      {issueForm.scannerStep === "student"
                        ? "Step 1: Scan Student ID"
                        : issueForm.scannerStep === "book"
                          ? "Step 2: Scan Book ISBN / Book Code"
                          : "Step 3: Scan Physical Copy Barcode"}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-indigo-700">
                    {issueForm.scannerStep === "student"
                      ? "STUDENT"
                      : issueForm.scannerStep === "book"
                        ? "BOOK"
                        : "COPY"}
                  </span>
                </div>

                <input
                  type="text"
                  value={issueForm.scannerValue}
                  onChange={handleScannerInput}
                  placeholder={
                    issueForm.scannerStep === "student"
                      ? "Scan Student ID"
                      : issueForm.scannerStep === "book"
                        ? "Scan Book ISBN / Code"
                        : "Scan Physical Copy Barcode"
                  }
                  autoComplete="off"
                  autoFocus
                  className="mt-3 h-11 w-full rounded-xl border border-indigo-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                />

                <p className="mt-2 text-[10px] text-indigo-500">
                  The same scanner is used for all three steps.
                </p>
              </div>
              {/* Student */}
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Student
                </label>

                <select
                  value={issueForm.studentId}
                  onChange={(event) =>
                    setIssueForm((current) => ({
                      ...current,
                      studentId: event.target.value,
                    }))
                  }
                  disabled={loadingStudents}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">
                    {loadingStudents
                      ? "Loading students..."
                      : students.length === 0
                        ? "No students found"
                        : "Select a student"}
                  </option>

                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name}
                      {student.studentId ? ` — ${student.studentId}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Book */}
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Book
                </label>

                <select
                  value={issueForm.bookId}
                  onChange={(event) =>
                    setIssueForm((current) => ({
                      ...current,
                      bookId: event.target.value,
                    }))
                  }
                  disabled={loadingBooks}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">
                    {loadingBooks ? "Loading books..." : "Select a book"}
                  </option>

                  {books.map((book) => {
                    const readyReservation = reservations.find(
                      (reservation) =>
                        reservation.student?._id === issueForm.studentId &&
                        reservation.book?._id === book._id &&
                        reservation.status === "ready",
                    );

                    const isReadyForPickup = Boolean(readyReservation);

                    const isUnavailable =
                      Number(book.availableCopies) <= 0 && !isReadyForPickup;

                    return (
                      <option
                        key={book._id}
                        value={book._id}
                        disabled={isUnavailable}
                      >
                        {book.title} — {book.author} —{" "}
                        {isReadyForPickup
                          ? "Ready for pickup"
                          : `${book.availableCopies} available`}
                      </option>
                    );
                  })}
                </select>
                {selectedBookIsReadyForPickup && (
                  <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <p className="text-[9px] font-semibold text-emerald-700">
                      Ready for pickup
                    </p>

                    <p className="mt-0.5 text-[9px] leading-4 text-emerald-600">
                      This book is reserved for the selected student. The
                      reserved copy will be issued when you complete this
                      transaction.
                    </p>
                  </div>
                )}
              </div>

              {/* Physical Copy / Scanner */}
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Physical Copy
                </label>

                <input
                  type="text"
                  value={issueForm.copyCode}
                  onChange={(event) =>
                    setIssueForm((current) => ({
                      ...current,
                      copyCode: event.target.value,
                      physicalCopyId: "",
                    }))
                  }
                  placeholder="Scan or enter book copy barcode"
                  autoComplete="off"
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                />

                <p className="mt-1 text-[9px] text-slate-400">
                  Scan the physical copy barcode. Manual selection remains
                  supported.
                </p>
              </div>

              {/* Due date */}
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Due date
                </label>

                <input
                  type="date"
                  value={issueForm.dueDate}
                  onChange={(event) =>
                    setIssueForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {/* Extra Loan */}
              {selectedStudentAtLimit && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <input
                      id="extraLoan"
                      type="checkbox"
                      checked={issueForm.isExtraLoan}
                      onChange={(event) =>
                        setIssueForm((current) => ({
                          ...current,
                          isExtraLoan: event.target.checked,
                          extraLoanReason: event.target.checked
                            ? current.extraLoanReason
                            : "",
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    <div>
                      <label
                        htmlFor="extraLoan"
                        className="text-sm font-semibold text-amber-900"
                      >
                        Issue Extra Loan
                      </label>

                      <p className="mt-1 text-xs leading-5 text-amber-800">
                        This student already has {selectedStudentActiveLoans}{" "}
                        active books. An extra loan can only be issued by the
                        librarian.
                      </p>
                    </div>
                  </div>

                  {issueForm.isExtraLoan && (
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-amber-900">
                        Reason for extra loan
                      </label>

                      <textarea
                        value={issueForm.extraLoanReason}
                        onChange={(event) =>
                          setIssueForm((current) => ({
                            ...current,
                            extraLoanReason: event.target.value,
                          }))
                        }
                        placeholder="Enter the reason for allowing this extra loan..."
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                  )}
                </div>
              )}

              {issueError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                  <p className="text-sm font-semibold text-rose-700">
                    {issueError}
                  </p>
                </div>
              )}

              {issueSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-sm font-semibold text-emerald-700">
                    {issueSuccess}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  issuing ||
                  loadingStudents ||
                  loadingBooks ||
                  (selectedStudentAtLimit && !issueForm.isExtraLoan)
                }
                className="flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {issuing
                  ? "Issuing..."
                  : issueForm.isExtraLoan
                    ? "Issue Extra Loan"
                    : selectedBookIsReadyForPickup
                      ? "Issue Reserved Book"
                      : "Issue Book"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Receive a returned book
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Scan the student ID, book, and physical copy to verify the
                  return.
                </p>
              </div>

              <button
                type="button"
                onClick={closeReturnModal}
                disabled={returning}
                className="text-sm font-semibold text-slate-400 hover:text-slate-700 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleReturnBook} className="mt-5 space-y-4">
              {/* Smart Return Scanner */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-indigo-900">
                      Smart Return Scanner
                    </p>

                    <p className="mt-1 text-[11px] text-indigo-600">
                      {returnScannerStep === "student"
                        ? "Step 1: Scan Student ID"
                        : returnScannerStep === "book"
                          ? "Step 2: Scan Book ISBN / Book Code"
                          : returnScannerStep === "copy"
                            ? "Step 3: Scan Physical Copy Barcode"
                            : "Return verified"}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-indigo-700">
                    {returnScannerStep === "student"
                      ? "STUDENT"
                      : returnScannerStep === "book"
                        ? "BOOK"
                        : returnScannerStep === "copy"
                          ? "COPY"
                          : "VERIFIED"}
                  </span>
                </div>

                <input
                  type="text"
                  value={returnScannerValue}
                  onChange={handleReturnScannerInput}
                  placeholder={
                    returnScannerStep === "student"
                      ? "Scan Student ID"
                      : returnScannerStep === "book"
                        ? "Scan Book ISBN / Code"
                        : returnScannerStep === "copy"
                          ? "Scan Physical Copy Barcode"
                          : "Return verified"
                  }
                  autoComplete="off"
                  autoFocus
                  disabled={returnScannerStep === "complete" || returning}
                  className="mt-3 h-11 w-full rounded-xl border border-indigo-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <p className="mt-2 text-[10px] text-indigo-500">
                  Use the same scanner for all three verification steps.
                </p>
              </div>

              {/* Selected Transaction */}
              {returnTransactionId &&
                (() => {
                  const selectedTransaction = transactions.find(
                    (transaction) => transaction._id === returnTransactionId,
                  );

                  if (!selectedTransaction) {
                    return null;
                  }

                  return (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Return details
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-800">
                        {selectedTransaction.book?.title || "Unknown book"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Student:{" "}
                        {selectedTransaction.student?.name || "Unknown student"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Student ID:{" "}
                        {selectedTransaction.student?.studentId || "—"}
                      </p>

                      {selectedTransaction.dueDate && (
                        <p className="mt-1 text-xs text-slate-500">
                          Due date:{" "}
                          {new Date(
                            selectedTransaction.dueDate,
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}

                      {returnScannerStep === "complete" && (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <p className="text-xs font-semibold text-emerald-700">
                            ✓ Student, book, and physical copy verified
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* Manual fallback */}
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Manual fallback
                </label>

                <select
                  value={returnTransactionId}
                  onChange={(event) => {
                    setReturnTransactionId(event.target.value);
                    setReturnScannerStep(
                      event.target.value ? "manual" : "student",
                    );
                    setReturnError("");
                    setReturnSuccess("");
                  }}
                  disabled={returning}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  <option value="">Select an active issued book</option>

                  {transactions
                    .filter(
                      (transaction) =>
                        transaction.type === "Issue" &&
                        transaction.status === "Completed" &&
                        !transaction.returnedAt,
                    )
                    .map((transaction) => {
                      const isOverdue =
                        transaction.dueDate &&
                        new Date(transaction.dueDate).getTime() < Date.now();

                      return (
                        <option key={transaction._id} value={transaction._id}>
                          {transaction.student?.name || "Unknown student"} —{" "}
                          {transaction.book?.title || "Unknown book"}
                          {isOverdue ? " — Overdue" : ""}
                        </option>
                      );
                    })}
                </select>

                <p className="mt-1 text-[9px] text-slate-400">
                  Manual selection remains available as a fallback.
                </p>
              </div>

              {/* Errors */}
              {returnError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                  <p className="text-sm font-semibold text-rose-700">
                    {returnError}
                  </p>
                </div>
              )}

              {/* Success */}
              {returnSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <p className="text-sm font-semibold text-emerald-700">
                    {returnSuccess}
                  </p>
                </div>
              )}

              {/* Receive */}
              <button
                type="submit"
                disabled={
                  returning ||
                  !returnTransactionId ||
                  (returnScannerStep !== "complete" &&
                    returnScannerStep !== "manual")
                }
                className="flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {returning
                  ? "Receiving..."
                  : returnScannerStep === "complete"
                    ? "Receive Book"
                    : returnScannerStep === "manual"
                      ? "Receive Book"
                      : "Complete Scanner Verification"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isRenewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRenewModal();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Renew a loan
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Extend the due date of an active book loan.
                </p>
              </div>

              <button
                type="button"
                onClick={closeRenewModal}
                disabled={renewing}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close renew modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRenewBook} className="space-y-5 px-6 py-6">
              <div>
                <label
                  htmlFor="renewTransactionId"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Active loan
                </label>

                <select
                  id="renewTransactionId"
                  value={renewTransactionId}
                  onChange={(event) => {
                    setRenewTransactionId(event.target.value);
                    setRenewError("");
                    setRenewSuccess("");
                  }}
                  disabled={renewing}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Select an active loan</option>

                  {transactions
                    .filter(
                      (transaction) =>
                        transaction.type === "Issue" &&
                        transaction.status === "Completed" &&
                        !transaction.returnedAt,
                    )
                    .map((transaction) => (
                      <option key={transaction._id} value={transaction._id}>
                        {transaction.student?.name || "Student"} —{" "}
                        {transaction.book?.title || "Book"}
                      </option>
                    ))}
                </select>
              </div>

              {renewTransactionId && (
                <div
                  className={
                    waitingReservationExists
                      ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                      : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                  }
                >
                  {waitingReservationExists ? (
                    <>
                      <p className="text-sm font-semibold text-amber-800">
                        Renewal not allowed
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        {waitingReservationCount}{" "}
                        {waitingReservationCount === 1
                          ? "student is"
                          : "students are"}{" "}
                        waiting for this book. The book must remain available
                        for the reservation queue.
                      </p>

                      <p className="mt-2 text-xs font-semibold text-amber-800">
                        Queue position starts with:
                      </p>

                      <div className="mt-1 space-y-1">
                        {waitingReservations
                          .slice(0, 3)
                          .map((reservation, index) => (
                            <p
                              key={reservation._id}
                              className="text-xs text-amber-700"
                            >
                              #{index + 1}{" "}
                              {reservation.student?.name || "Waiting student"}
                            </p>
                          ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-emerald-800">
                        Renewal allowed
                      </p>

                      <p className="mt-1 text-xs text-emerald-700">
                        No other student is currently waiting for this book.
                      </p>
                    </>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="renewDueDate"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  New due date
                </label>

                <input
                  id="renewDueDate"
                  type="date"
                  value={renewDueDate}
                  onChange={(event) => {
                    setRenewDueDate(event.target.value);
                    setRenewError("");
                    setRenewSuccess("");
                  }}
                  disabled={renewing}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Leave this empty if the system should calculate the renewed
                  due date automatically.
                </p>
              </div>

              {renewError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {renewError}
                </div>
              )}

              {renewSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {renewSuccess}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRenewModal}
                  disabled={renewing}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    renewing ||
                    !renewTransactionId ||
                    waitingReservationExists ||
                    loadingReservations
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {renewing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Renewing...
                    </>
                  ) : (
                    <>
                      <Clock3 className="h-4 w-4" />
                      {waitingReservationExists
                        ? "Renewal unavailable"
                        : "Renew loan"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <BookOpen className="h-4 w-4" />
          </span>

          <div>
            <p className="text-[10px] font-bold text-indigo-900">
              Circulation is running smoothly
            </p>

            <p className="mt-0.5 text-[8px] text-indigo-700/60">
              Recent transactions are synced with the library system.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center gap-1 text-[8px] font-semibold text-indigo-400"
        >
          View daily report
          <ArrowRight className="h-3 w-3" />
        </button>
      </section>
    </div>
  );
}

function Summary({ label, value, icon: Icon, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
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

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "transition-all hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-sm",
      ].join(" ")}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold text-slate-800">
          {title}
        </span>

        <span className="mt-0.5 block text-[8px] leading-4 text-slate-400">
          {description}
        </span>
      </span>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
    </button>
  );
}

function TransactionRow({ transaction, onReceive }) {
  const studentName = transaction.student?.name || "Unknown student";

  const studentId =
    transaction.student?.studentId || transaction.student?._id || "—";

  const bookTitle = transaction.book?.title || "Unknown book";

  const transactionId = transaction._id || "—";

  const transactionDate =
    transaction.createdAt || transaction.issuedAt || transaction.returnedAt;

  const formattedDate = transactionDate
    ? new Date(transactionDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const formattedTime = transactionDate
    ? new Date(transactionDate).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <tr className="transition-colors hover:bg-slate-50/50">
      <td className="px-4 py-4">
        <p className="max-w-[120px] truncate text-[9px] font-bold text-slate-700">
          {transactionId}
        </p>
      </td>

      <td className="px-4 py-4">
        <div className="min-w-[170px]">
          <p className="text-[10px] font-bold text-slate-800">{studentName}</p>

          <p className="mt-0.5 text-[8px] text-slate-400">{studentId}</p>
        </div>
      </td>

      <td className="max-w-[220px] px-4 py-4">
        <p className="truncate text-[10px] font-semibold text-slate-700">
          {bookTitle}
        </p>

        {transaction.book?.author && (
          <p className="mt-0.5 truncate text-[8px] text-slate-400">
            {transaction.book.author}
          </p>
        )}
      </td>

      <td className="px-4 py-4">
        <TransactionType type={transaction.type} />

        {transaction.type === "Issue" && transaction.renewalCount > 0 && (
          <p className="mt-1 text-[8px] font-semibold text-violet-500">
            Renewed {transaction.renewalCount}{" "}
            {transaction.renewalCount === 1 ? "time" : "times"}
          </p>
        )}
      </td>

      <td className="px-4 py-4">
        <p className="text-[9px] font-semibold text-slate-600">
          {formattedDate}
        </p>

        <p className="mt-0.5 text-[8px] text-slate-400">{formattedTime}</p>

        {transaction.type === "Issue" && transaction.dueDate && (
          <>
            <p className="mt-1 text-[8px] font-semibold text-indigo-500">
              Due:{" "}
              {new Date(transaction.dueDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>

            {!transaction.returnedAt &&
              new Date(transaction.dueDate).getTime() < Date.now() && (
                <span className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[7px] font-bold text-rose-600">
                  Overdue
                </span>
              )}
          </>
        )}
      </td>

      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {transaction.status}
        </span>
      </td>

      <td className="px-4 py-4 text-right">
        {transaction.type === "Issue" && !transaction.returnedAt ? (
          <button
            type="button"
            onClick={() => onReceive(transaction._id)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-[8px] font-semibold text-white hover:bg-slate-800"
          >
            <LogOut className="h-2.5 w-2.5" />
            Receive
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[8px] font-semibold text-slate-400"
          >
            Details
            <ArrowRight className="h-2.5 w-2.5" />
          </button>
        )}
      </td>
    </tr>
  );
}

function TransactionCard({ transaction, onReceive }) {
  const studentName = transaction.student?.name || "Unknown student";

  const studentId =
    transaction.student?.studentId || transaction.student?._id || "—";

  const bookTitle = transaction.book?.title || "Unknown book";

  const transactionId = transaction._id || "—";

  const transactionDate =
    transaction.createdAt || transaction.issuedAt || transaction.returnedAt;

  const formattedDate = transactionDate
    ? new Date(transactionDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const formattedTime = transactionDate
    ? new Date(transactionDate).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <article className="p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <CreditCard className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-800">
                {studentName}
              </p>

              <p className="mt-0.5 text-[8px] text-slate-400">
                {studentId} · {transactionId}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <TransactionType type={transaction.type} />

              {transaction.type === "Issue" && transaction.renewalCount > 0 && (
                <span className="text-[8px] font-semibold text-violet-500">
                  Renewed {transaction.renewalCount}{" "}
                  {transaction.renewalCount === 1 ? "time" : "times"}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-700">
              {bookTitle}
            </p>

            {transaction.book?.author && (
              <p className="mt-1 text-[8px] text-slate-400">
                {transaction.book.author}
              </p>
            )}

            <p className="mt-1 text-[8px] text-slate-400">
              {formattedDate} · {formattedTime}
            </p>

            {transaction.type === "Issue" && transaction.dueDate && (
              <>
                <p className="mt-1 text-[8px] font-semibold text-indigo-500">
                  Due:{" "}
                  {new Date(transaction.dueDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                {!transaction.returnedAt &&
                  new Date(transaction.dueDate).getTime() < Date.now() && (
                    <span className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[7px] font-bold text-rose-600">
                      Overdue
                    </span>
                  )}
              </>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[8px] font-semibold text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              {transaction.status || "Completed"}
            </span>

            {transaction.type === "Issue" && !transaction.returnedAt ? (
              <button
                type="button"
                onClick={() => onReceive(transaction._id)}
                className="rounded-lg bg-slate-950 px-3 py-1.5 text-[8px] font-semibold text-white"
              >
                Receive
              </button>
            ) : (
              <button
                type="button"
                className="text-[8px] font-semibold text-indigo-600"
              >
                View details
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function TransactionType({ type }) {
  const styles = {
    Issue: "bg-indigo-50 text-indigo-700",
    Return: "bg-emerald-50 text-emerald-700",
    Renew: "bg-violet-50 text-violet-700",
  };

  const icons = {
    Issue: LogIn,
    Return: LogOut,
    Renew: Clock3,
  };

  const Icon = icons[type] || CreditCard;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[8px] font-semibold",
        styles[type] || "bg-slate-100 text-slate-600",
      ].join(" ")}
    >
      <Icon className="h-2.5 w-2.5" />
      {type}
    </span>
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
        <Search className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-sm font-bold text-slate-900">
        No transactions found
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Try another search term or transaction type.
      </p>
    </div>
  );
}
