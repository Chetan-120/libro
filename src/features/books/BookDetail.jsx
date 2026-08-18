import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Library,
  MapPin,
  Share2,
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isReserved, setIsReserved] = useState(false);
  const [reservationStatus, setReservationStatus] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [alreadyBorrowed, setAlreadyBorrowed] = useState(false);
  const [checkingReservation, setCheckingReservation] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [reservationError, setReservationError] = useState("");
  const [reservationMessage, setReservationMessage] = useState("");

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("libro_token") ||
          sessionStorage.getItem("libro_token");

        const response = await fetch(`${API_URL}/api/books/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            `Book API returned an unexpected response (${response.status}).`,
          );
        }

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load book details.");
        }

        setBook(data.book);
      } catch (err) {
        console.error("Book detail error:", err);

        setError(err.message || "Unable to load book details.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  // Reservation status is checked by the effect below.

  const handleReserve = async () => {
    if (!book || reserving || isReserved || alreadyBorrowed) {
      console.log("Reservation blocked:", {
        hasBook: Boolean(book),
        reserving,
        isReserved,
        alreadyBorrowed,
        bookId: book?._id,
        availableCopies: book?.availableCopies,
      });

      return;
    }
    setReserving(true);
    setReservationMessage("");
    setReservationError("");

    try {
      const token =
        localStorage.getItem("libro_token") ||
        sessionStorage.getItem("libro_token");

      if (!token) {
        navigate("/login", {
          state: {
            from: `/student/catalog/${book._id}`,
          },
        });

        return;
      }

      const response = await fetch(`${API_URL}/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId: book._id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Reservation API failed:", {
          status: response.status,
          statusText: response.statusText,
          data,
        });

        throw new Error(
          data.message ||
            `Unable to reserve this book. Server returned ${response.status}.`,
        );
      }

      setIsReserved(true);

      setReservationStatus(data.reservation?.status || "pending");

      setQueuePosition(data.reservation?.position || null);

      if (data.reservation?.status === "ready") {
        setBook((currentBook) =>
          currentBook
            ? {
                ...currentBook,
                availableCopies: Math.max(0, currentBook.availableCopies - 1),
              }
            : currentBook,
        );
      }

      setReservationMessage(
        data.reservation?.status === "ready"
          ? "Book reserved successfully and is ready for pickup."
          : data.reservation?.position
            ? `Book reserved successfully. You are #${data.reservation.position} in the queue.`
            : data.message || "Book reserved successfully.",
      );
    } catch (err) {
      console.error("Reservation error:", err);

      setReservationError(err.message || "Unable to reserve this book.");
    } finally {
      setReserving(false);
    }
  };

  useEffect(() => {
    const checkReservation = async () => {
      if (!id) return;

      const token =
        localStorage.getItem("libro_token") ||
        sessionStorage.getItem("libro_token");

      if (!token) {
        setIsReserved(false);
        setReservationStatus(null);
        setQueuePosition(null);
        setAlreadyBorrowed(false);
        setCheckingReservation(false);
        return;
      }

      try {
        setCheckingReservation(true);

        const [reservationResponse, loansResponse] = await Promise.all([
          fetch(`${API_URL}/api/reservations/book/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/api/circulation/my-loans`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const reservationContentType =
          reservationResponse.headers.get("content-type") || "";

        const loansContentType =
          loansResponse.headers.get("content-type") || "";

        if (!reservationContentType.includes("application/json")) {
          throw new Error(
            `Reservation API returned an unexpected response (${reservationResponse.status}).`,
          );
        }

        if (!loansContentType.includes("application/json")) {
          throw new Error(
            `Loans API returned an unexpected response (${loansResponse.status}).`,
          );
        }

        const reservationData = await reservationResponse.json();

        const loansData = await loansResponse.json();

        console.log("LIBRO DEBUG - MY LOANS:", loansData);

        if (!reservationResponse.ok || !reservationData.success) {
          throw new Error(
            reservationData.message || "Unable to check reservation status.",
          );
        }

        if (!loansResponse.ok || !loansData.success) {
          throw new Error(
            loansData.message || "Unable to check your active loans.",
          );
        }

        setIsReserved(Boolean(reservationData.reserved));

        setReservationStatus(reservationData.reservation?.status || null);

        setQueuePosition(reservationData.reservation?.position || null);

        const hasBook = (loansData.transactions || []).some((transaction) => {
          const transactionBookId = transaction.book?._id || transaction.book;

          return (
            transaction.type === "Issue" &&
            transaction.status === "Completed" &&
            !transaction.returnedAt &&
            transactionBookId?.toString() === id
          );
        });

        setAlreadyBorrowed(hasBook);
      } catch (error) {
        console.error("Reservation/loan status error:", error);

        setIsReserved(false);
        setReservationStatus(null);
        setQueuePosition(null);
        setAlreadyBorrowed(false);
      } finally {
        setCheckingReservation(false);
      }
    };

    checkReservation();
  }, [id]);

  // Reservation action is handled by the function below.

  const handleCancelReservation = async () => {
    if (!book || !isReserved || reservationStatus === "ready" || reserving) {
      return;
    }

    const token =
      localStorage.getItem("libro_token") ||
      sessionStorage.getItem("libro_token");

    if (!token) {
      navigate("/login", {
        state: {
          from: `/student/catalog/${book._id}`,
        },
      });

      return;
    }

    try {
      setReserving(true);
      setReservationError("");
      setReservationMessage("");

      const statusResponse = await fetch(
        `${API_URL}/api/reservations/book/${book._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const statusData = await statusResponse.json();

      if (
        !statusResponse.ok ||
        !statusData.success ||
        !statusData.reservation
      ) {
        throw new Error("Active reservation not found.");
      }

      const reservationId = statusData.reservation._id;

      const response = await fetch(
        `${API_URL}/api/reservations/${reservationId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to cancel the reservation.");
      }

      setIsReserved(false);
      setReservationStatus(null);
      setQueuePosition(null);

      setReservationMessage("Reservation cancelled successfully.");
    } catch (error) {
      console.error("Cancel reservation error:", error);

      setReservationError(error.message || "Unable to cancel the reservation.");
    } finally {
      setReserving(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: book?.title || "Libro Book",
      text: book ? `${book.title} by ${book.author}` : "Libro book",
      url: window.location.href,
    };

    try {
      if (navigator.share && typeof navigator.share === "function") {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);

      alert("Book link copied to clipboard.");
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Share error:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-w-0 pb-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-20 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading book details...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Fetching the latest information from the library.
          </p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-w-0 pb-8">
        <button
          type="button"
          onClick={() => navigate("/student/catalog")}
          className="mb-5 inline-flex items-center gap-2 text-[9px] font-semibold text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to catalogue
        </button>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
            <BookOpen className="h-5 w-5" />
          </div>

          <h2 className="mt-4 text-sm font-bold text-rose-800">
            Book not found
          </h2>

          <p className="mt-1 text-xs text-rose-600">
            {error || "This book is no longer available."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/student/catalog")}
            className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Return to catalogue
          </button>
        </div>
      </div>
    );
  }

  const available = Number(book.availableCopies) > 0;

  const publishedYear = book.publishedYear || "Not available";

  const coverUrl = book.coverImage
    ? book.coverImage.startsWith("http://") ||
      book.coverImage.startsWith("https://")
      ? book.coverImage
      : `${API_URL}${
          book.coverImage.startsWith("/") ? "" : "/"
        }${book.coverImage}`
    : "";

  return (
    <div className="min-w-0 pb-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/student/catalog")}
        className="mb-5 inline-flex items-center gap-2 text-[9px] font-semibold text-slate-500 hover:text-indigo-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to catalogue
      </button>

      {/* Main */}
      <section className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Cover */}
        <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
          <div className="relative flex min-h-[390px] items-center justify-center overflow-hidden">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />

            {coverUrl ? (
              <img
                src={coverUrl}
                alt={`${book.title} cover`}
                className="relative max-h-[350px] max-w-[240px] rounded-lg object-contain shadow-2xl shadow-black/40"
                onError={(event) => {
                  event.currentTarget.style.display = "none";

                  event.currentTarget.nextElementSibling?.classList.remove(
                    "hidden",
                  );
                }}
              />
            ) : null}

            <div
              className={[
                "relative flex h-64 w-44 flex-col items-center justify-center rounded-lg",
                "bg-gradient-to-br from-indigo-500 via-violet-600 to-slate-900",
                "p-5 text-center text-white shadow-2xl shadow-indigo-950/40",
                book.coverImage ? "hidden" : "",
              ].join(" ")}
            >
              <BookOpen className="h-10 w-10 text-white/80" />

              <p className="mt-4 line-clamp-4 text-sm font-bold leading-tight">
                {book.title}
              </p>

              <p className="mt-3 line-clamp-2 text-[8px] text-indigo-200">
                {book.author}
              </p>
            </div>

            <span className="absolute left-4 top-4 rounded-full bg-white/10 px-2.5 py-1 text-[7px] font-bold text-indigo-200 backdrop-blur-sm">
              {book.category}
            </span>
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-1.5 text-[8px] text-slate-500">
                <MapPin className="h-3 w-3 shrink-0" />

                <span className="truncate">{book.category} Section</span>
              </span>

              <span
                className={[
                  "flex shrink-0 items-center gap-1 text-[8px] font-semibold",
                  available ? "text-emerald-400" : "text-rose-400",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    available ? "bg-emerald-400" : "bg-rose-400",
                  ].join(" ")}
                />

                {available ? "Available" : "Unavailable"}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[8px] font-semibold text-indigo-700">
              {book.category}
            </span>

            <span
              className={[
                "rounded-full px-2.5 py-1 text-[8px] font-semibold",
                reservationStatus === "ready"
                  ? "bg-amber-50 text-amber-700"
                  : reservationStatus === "pending"
                    ? "bg-indigo-50 text-indigo-700"
                    : available
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700",
              ].join(" ")}
            >
              {reservationStatus === "ready"
                ? "Ready for pickup"
                : reservationStatus === "pending"
                  ? "Reservation pending"
                  : available
                    ? `${book.availableCopies} copies available`
                    : "Currently unavailable"}
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl text-2xl font-bold tracking-[-0.05em] text-slate-950 sm:text-3xl">
            {book.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[10px] font-semibold text-slate-700">
              {book.author}
            </span>

            <span className="h-1 w-1 rounded-full bg-slate-300" />

            <span className="text-[9px] text-slate-400">{publishedYear}</span>

            {book.publisher && (
              <>
                <span className="h-1 w-1 rounded-full bg-slate-300" />

                <span className="text-[9px] text-slate-400">
                  {book.publisher}
                </span>
              </>
            )}
          </div>

          <div className="my-6 h-px bg-slate-100" />

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-600">
              About this book
            </p>

            <p className="mt-3 max-w-3xl text-[11px] leading-6 text-slate-500">
              {book.description ||
                "No description has been added for this book yet."}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <InfoBox
              icon={BookOpen}
              label="Availability"
              value={`${book.availableCopies} of ${book.totalCopies} copies`}
            />

            <InfoBox icon={Library} label="Category" value={book.category} />

            <InfoBox
              icon={CalendarDays}
              label="Published"
              value={String(publishedYear)}
            />
          </div>

          {alreadyBorrowed && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <div>
                <p className="text-[10px] font-bold text-slate-800">
                  Already borrowed
                </p>

                <p className="mt-1 text-[9px] leading-5 text-slate-500">
                  You currently have this physical book. Return it before
                  borrowing or reserving the same book again.
                </p>
              </div>
            </div>
          )}
          {reservationStatus === "pending" && queuePosition && (
            <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold text-indigo-800">
                  Reservation pending
                </p>

                <p className="mt-1 text-[9px] leading-5 text-indigo-600">
                  You are waiting for this physical book.
                </p>
              </div>

              <div className="shrink-0 text-center">
                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-indigo-400">
                  Queue
                </p>

                <p className="text-xl font-bold text-indigo-700">
                  #{queuePosition}
                </p>
              </div>
            </div>
          )}

          {reservationStatus === "ready" && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

              <div>
                <p className="text-[10px] font-bold text-amber-800">
                  Ready for pickup
                </p>

                <p className="mt-1 text-[9px] leading-5 text-amber-700">
                  Your reservation has been accepted by the librarian. Please
                  collect this book from the library.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={
                reservationStatus === "ready" ||
                alreadyBorrowed ||
                available ||
                reserving ||
                checkingReservation
              }
              onClick={
                reservationStatus === "ready" || alreadyBorrowed || available
                  ? undefined
                  : isReserved
                    ? handleCancelReservation
                    : handleReserve
              }
              className={[
                "flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[10px] font-bold transition-colors",
                reservationStatus === "ready"
                  ? "cursor-default bg-amber-50 text-amber-700"
                  : alreadyBorrowed || available
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : isReserved
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : !checkingReservation
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "cursor-not-allowed bg-slate-100 text-slate-400",
              ].join(" ")}
            >
              <Clock3 className="h-3.5 w-3.5" />

              {checkingReservation
                ? "Checking..."
                : reserving
                  ? isReserved
                    ? "Cancelling..."
                    : "Reserving..."
                  : reservationStatus === "ready"
                    ? "✓ Ready for pickup"
                    : reservationStatus === "pending"
                      ? `✓ Queue #${queuePosition || "—"}`
                      : alreadyBorrowed
                        ? "✓ Already borrowed"
                        : available
                          ? `${book.availableCopies} ${
                              book.availableCopies === 1 ? "copy" : "copies"
                            } available`
                          : isReserved
                            ? "✓ Reserved"
                            : "Join reservation queue"}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              aria-label="Share book"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {reservationMessage && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-700">
                {reservationMessage}
              </p>
            </div>
          )}

          {reservationError && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm font-semibold text-rose-700">
                {reservationError}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Additional information */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <UserRound className="h-4 w-4" />
            </span>

            <div>
              <h2 className="text-sm font-bold text-slate-950">Author</h2>

              <p className="mt-0.5 text-[8px] text-slate-400">
                Author information from the library record.
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600">
              {getInitials(book.author)}
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-800">
                {book.author}
              </p>

              {book.publisher && (
                <p className="mt-1 text-[9px] text-slate-400">
                  Published by {book.publisher}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>

            <div>
              <h2 className="text-sm font-bold text-slate-950">
                Availability information
              </h2>

              <p className="mt-0.5 text-[8px] text-slate-400">
                Current inventory status.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <DetailRow label="Total copies" value={`${book.totalCopies}`} />

            <DetailRow
              label="Available copies"
              value={`${book.availableCopies}`}
              success={available}
            />

            <DetailRow
              label="Borrowed copies"
              value={`${Math.max(0, book.totalCopies - book.availableCopies)}`}
            />

            <DetailRow
              label="Current availability"
              value={available ? "Available" : "Unavailable"}
              success={available}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <Icon className="h-3.5 w-3.5 text-indigo-500" />

      <p className="mt-3 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-[9px] font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value, success = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-[9px] text-slate-400">{label}</span>

      <span
        className={[
          "text-right text-[9px] font-semibold",
          success ? "text-emerald-600" : "text-slate-700",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

