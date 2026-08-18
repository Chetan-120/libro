import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function BookCatalog() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [reservationStatuses, setReservationStatuses] = useState({});
  const [reservationPositions, setReservationPositions] = useState({});
  const [activeLoanBookIds, setActiveLoanBookIds] = useState({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("featured");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBooksAndReservations = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("libro_token") ||
          sessionStorage.getItem("libro_token");

        if (!token) {
          throw new Error("Please login to continue.");
        }

        const [booksResponse, reservationsResponse, loansResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/books`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),

            fetch(`${API_URL}/api/reservations/my`, {
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

        const booksContentType =
          booksResponse.headers.get("content-type") || "";

        const reservationsContentType =
          reservationsResponse.headers.get("content-type") || "";

        const loansContentType =
          loansResponse.headers.get("content-type") || "";

        if (!booksContentType.includes("application/json")) {
          throw new Error(
            `Books API returned an unexpected response (${booksResponse.status}).`,
          );
        }

        if (!reservationsContentType.includes("application/json")) {
          throw new Error(
            `Reservations API returned an unexpected response (${reservationsResponse.status}).`,
          );
        }

        if (!loansContentType.includes("application/json")) {
          throw new Error(
            `Loans API returned an unexpected response (${loansResponse.status}).`,
          );
        }

        const booksData = await booksResponse.json();

        const reservationsData = await reservationsResponse.json();

        const loansData = await loansResponse.json();

        if (!booksResponse.ok || !booksData.success) {
          throw new Error(booksData.message || "Unable to load books.");
        }

        if (!reservationsResponse.ok || !reservationsData.success) {
          throw new Error(
            reservationsData.message || "Unable to load reservations.",
          );
        }

        if (!loansResponse.ok || !loansData.success) {
          throw new Error(
            loansData.message || "Unable to load your active loans.",
          );
        }

        setBooks(booksData.books || []);

        const statusMap = {};
        const positionMap = {};

        (reservationsData.reservations || []).forEach((reservation) => {
          if (
            reservation.book?._id &&
            ["pending", "ready"].includes(reservation.status)
          ) {
            statusMap[reservation.book._id] = reservation.status;

            if (reservation.status === "pending" && reservation.position) {
              positionMap[reservation.book._id] = reservation.position;
            }
          }
        });

        setReservationStatuses(statusMap);
        setReservationPositions(positionMap);

        const loanMap = {};

        (loansData.transactions || []).forEach((transaction) => {
          const bookId = transaction.book?._id;

          if (bookId) {
            loanMap[bookId] = true;
          }
        });

        setActiveLoanBookIds(loanMap);
      } catch (err) {
        console.error("Book catalog error:", err);

        setError(err.message || "Unable to load books.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooksAndReservations();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(books.map((book) => book.category).filter(Boolean)),
    ];

    return ["All", ...uniqueCategories.sort()];
  }, [books]);

  const filteredBooks = useMemo(() => {
    const result = books.filter((book) => {
      const matchesQuery =
        !query.trim() ||
        `${book.title} ${book.author} ${book.category}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesCategory = category === "All" || book.category === category;

      return matchesQuery && matchesCategory;
    });

    return [...result].sort((a, b) => {
      if (sort === "title") {
        return a.title.localeCompare(b.title);
      }

      if (sort === "year") {
        return (b.publishedYear || 0) - (a.publishedYear || 0);
      }

      if (sort === "featured") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }

      return 0;
    });
  }, [books, query, category, sort]);

  return (
    <div className="min-w-0 pb-8">
      {/* Header */}
      <section className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
          Explore collection
        </p>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              Book catalogue
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Discover books from across the library collection and find your
              next read.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />

            <span className="text-[9px] font-semibold text-slate-600">
              {books.length} titles available
            </span>
          </div>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading books...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Fetching the latest library collection.
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
          <p className="text-sm font-bold text-rose-700">
            Unable to load books
          </p>

          <p className="mt-1 text-xs text-rose-500">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Featured */}
          <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_10px_30px_rgba(15,23,42,0.1)] sm:p-6">
            <div className="absolute -right-10 -top-20 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-indigo-300">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>

                  <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-300">
                    Featured collection
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-bold tracking-[-0.03em] sm:text-xl">
                  Curated books worth your time.
                </h2>

                <p className="mt-2 max-w-xl text-[9px] leading-5 text-slate-500">
                  Explore titles selected from the library collection.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCategory("All");
                  setSort("featured");
                }}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[10px] font-bold text-slate-950 hover:bg-indigo-50"
              >
                Recently added
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          {/* Search and controls */}
          <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title, author, or category..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-[9px] font-semibold text-slate-600 outline-none focus:border-indigo-300 sm:w-36"
                  >
                    <option value="featured">Recently added</option>
                    <option value="title">Title A–Z</option>
                    <option value="year">Newest</option>
                  </select>
                </div>

                <div className="hidden items-center rounded-xl bg-slate-50 p-1 sm:flex">
                  <ViewButton
                    active={view === "grid"}
                    onClick={() => setView("grid")}
                    icon={Grid2X2}
                  />

                  <ViewButton
                    active={view === "list"}
                    onClick={() => setView("list")}
                    icon={List}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={[
                    "shrink-0 rounded-lg px-3 py-2 text-[9px] font-semibold transition-colors",
                    category === item
                      ? "bg-slate-950 text-white"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800",
                  ].join(" ")}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {/* Results */}
          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[9px] font-semibold text-slate-500">
                Showing{" "}
                <span className="text-slate-900">{filteredBooks.length}</span>{" "}
                books
              </p>

              {category !== "All" && (
                <button
                  type="button"
                  onClick={() => setCategory("All")}
                  className="text-[9px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Clear filter
                </button>
              )}
            </div>

            {filteredBooks.length > 0 ? (
              view === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {filteredBooks.map((book) => (
                    <BookCard
                      key={book._id}
                      book={book}
                      reservationStatus={reservationStatuses[book._id] || null}
                      queuePosition={reservationPositions[book._id] || null}
                      alreadyBorrowed={Boolean(activeLoanBookIds[book._id])}
                      onView={() => navigate(`/student/catalog/${book._id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                  <div className="divide-y divide-slate-100">
                    {filteredBooks.map((book) => (
                      <BookListItem
                        key={book._id}
                        book={book}
                        reservationStatus={
                          reservationStatuses[book._id] || null
                        }
                        queuePosition={reservationPositions[book._id] || null}
                        alreadyBorrowed={Boolean(activeLoanBookIds[book._id])}
                        onView={() => navigate(`/student/catalog/${book._id}`)}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : (
              <EmptyState />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function BookCard({
  book,
  reservationStatus,
  queuePosition,
  alreadyBorrowed,
  onView,
}) {
  const available = book.availableCopies > 0;

  const coverUrl = book.coverImage
    ? book.coverImage.startsWith("http://") ||
      book.coverImage.startsWith("https://")
      ? book.coverImage
      : `${API_URL}${
          book.coverImage.startsWith("/") ? "" : "/"
        }${book.coverImage}`
    : "";

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/20 blur-2xl" />

        <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-violet-500/15 blur-2xl" />

        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${book.title} cover`}
            className="relative h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="relative flex h-32 w-24 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-950/30">
            <BookOpen className="h-7 w-7" />
          </div>
        )}

        <span
          className={[
            "absolute right-3 top-3 rounded-full px-2 py-1 text-[7px] font-bold",
            reservationStatus === "ready"
              ? "bg-amber-400/15 text-amber-200"
              : reservationStatus === "pending"
                ? "bg-indigo-400/15 text-indigo-200"
                : available
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-rose-400/10 text-rose-300",
          ].join(" ")}
        >
          {reservationStatus === "ready"
            ? "Ready for pickup"
            : reservationStatus === "pending"
              ? "Reserved"
              : available
                ? `${book.availableCopies} available`
                : "All copies are currently taken"}
        </span>
      </div>

      <div className="p-4">
        <span className="text-[7px] font-bold uppercase tracking-[0.12em] text-indigo-500">
          {book.category}
        </span>

        <h2 className="mt-1.5 line-clamp-1 text-[11px] font-bold tracking-[-0.01em] text-slate-900">
          {book.title}
        </h2>

        <p className="mt-1 truncate text-[8px] text-slate-400">
          {book.author} · {book.publishedYear || "—"}
        </p>

        {reservationStatus === "ready" && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-[8px] font-bold text-amber-800">
              ✓ Ready for pickup
            </p>

            <p className="mt-0.5 text-[7px] text-amber-700">
              Your reservation has been accepted. Please collect the book.
            </p>
          </div>
        )}

        {reservationStatus === "pending" && queuePosition && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
            <div>
              <p className="text-[8px] font-bold text-indigo-800">
                Reservation queue
              </p>

              <p className="mt-0.5 text-[7px] text-indigo-600">
                You are waiting for this book.
              </p>
            </div>

            <div className="text-center">
              <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-indigo-400">
                Queue
              </p>

              <p className="text-lg font-bold text-indigo-700">
                #{queuePosition}
              </p>
            </div>
          </div>
        )}

        {alreadyBorrowed && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[8px] font-bold text-slate-700">
              ✓ Already borrowed
            </p>

            <p className="mt-0.5 text-[7px] text-slate-500">
              You currently have this book.
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">
              {book.availableCopies || 0}
            </span>

            <span className="text-xs text-slate-400">
              {book.availableCopies === 1
                ? "copy available"
                : "copies available"}
            </span>
          </div>

          <span className="text-xs text-slate-400">
            {book.totalCopies} copies
          </span>
        </div>

        <button
          type="button"
          onClick={onView}
          className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-[8px] font-semibold text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
        >
          View details
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}

function BookListItem({
  book,
  reservationStatus,
  queuePosition,
  alreadyBorrowed,
  onView,
}) {
  const available = book.availableCopies > 0;

  const coverUrl = book.coverImage
    ? book.coverImage.startsWith("http://") ||
      book.coverImage.startsWith("https://")
      ? book.coverImage
      : `${API_URL}${
          book.coverImage.startsWith("/") ? "" : "/"
        }${book.coverImage}`
    : "";

  return (
    <article className="flex flex-col gap-4 p-4 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-center sm:p-5">
      <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 shadow-sm">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${book.title} cover`}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <BookOpen className="h-5 w-5 text-indigo-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-500">
          {book.category}
        </span>

        <h2 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 tracking-[-0.01em] text-slate-900">
          {book.title}
        </h2>

        <p className="mt-1 truncate text-xs text-slate-500">
          {book.author} · {book.publishedYear || "—"}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div>
          <p className="text-[8px] text-slate-400">{book.totalCopies} copies</p>
        </div>

        <span
          className={[
            "rounded-full px-2.5 py-1 text-[8px] font-semibold",
            reservationStatus === "ready"
              ? "bg-amber-50 text-amber-700"
              : reservationStatus === "pending"
                ? "bg-indigo-50 text-indigo-700"
                : alreadyBorrowed
                  ? "bg-slate-100 text-slate-600"
                  : available
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700",
          ].join(" ")}
        >
          {reservationStatus === "ready"
            ? "Ready for pickup"
            : reservationStatus === "pending"
              ? `Queue #${queuePosition || "—"}`
              : alreadyBorrowed
                ? "Already borrowed"
                : available
                  ? `${book.availableCopies} available`
                  : "All copies are currently taken"}
        </span>

        <button
          type="button"
          onClick={onView}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={`View ${book.title}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function ViewButton({ active, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-400 hover:text-slate-700",
      ].join(" ")}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Search className="h-5 w-5" />
      </div>

      <h2 className="mt-4 text-sm font-bold text-slate-900">No books found</h2>

      <p className="mt-1 text-xs text-slate-400">
        Try another title, author, or category.
      </p>
    </div>
  );
}
