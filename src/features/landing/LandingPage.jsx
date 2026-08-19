import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  BookMarked,
  Clock3,
  Library,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getCoverImageUrl(coverImage) {
  if (!coverImage) return null;

  const value = String(coverImage).trim();

  if (!value) return null;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/${value}`;
}

function LandingBookCover({ book }) {
  const [failed, setFailed] = useState(false);

  const coverUrl = getCoverImageUrl(book?.coverImage);

  useEffect(() => {
    setFailed(false);
  }, [coverUrl]);

  if (!coverUrl || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-700 via-violet-700 to-slate-950">
        <BookOpen className="h-7 w-7 text-white/40" />
      </div>
    );
  }

  return (
    <img
      src={coverUrl}
      alt={book?.title || "Book cover"}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => {
        console.error("Landing page cover failed:", coverUrl);
        setFailed(true);
      }}
    />
  );
}
export function LandingPage() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBooks() {
      try {
        setLoadingBooks(true);

        const response = await fetch(`${API_URL}/api/books/public`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load books");
        }

        const receivedBooks = Array.isArray(data)
          ? data
          : Array.isArray(data?.books)
            ? data.books
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (!cancelled) {
          setBooks(receivedBooks);
        }
      } catch (error) {
        console.error("Landing page books loading failed:", error);

        if (!cancelled) {
          setBooks([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingBooks(false);
        }
      }
    }

    loadBooks();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredBooks = useMemo(() => books.slice(0, 4), [books]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f9fc] text-slate-950">
      {/* Hero */}
      <main>
        <section className="relative overflow-hidden">
          {/* Premium background glow */}
          <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-indigo-200/30 blur-3xl" />

          <div className="pointer-events-none absolute left-[15%] top-[35%] h-40 w-40 rounded-full bg-violet-200/20 blur-3xl" />

          <div className="pointer-events-none absolute right-[10%] top-[25%] h-48 w-48 rounded-full bg-indigo-100/30 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:px-10 lg:pb-24 lg:pt-24">
            <div className="mx-auto max-w-4xl text-center">
              {/* Eyebrow */}
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-[9px] font-semibold text-indigo-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <Sparkles className="h-3 w-3" />A smarter way to experience your
                library
              </span>

              {/* Heading */}
              <h1 className="mt-6 text-4xl font-bold leading-[1.03] tracking-[-0.065em] text-slate-950 sm:text-5xl lg:text-7xl">
                Discover your next
                <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  great read.
                </span>
              </h1>

              {/* Description */}
              <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Explore thousands of books, manage your loans, reserve titles,
                and stay connected with your library â€” all from one
                beautifully simple platform.
              </p>

              {/* CTA */}
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-xs font-bold text-white shadow-[0_10px_25px_rgba(79,70,229,0.18)] transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-[0_12px_30px_rgba(79,70,229,0.22)]"
                >
                  Start exploring
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-xs font-bold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-700"
                >
                  Sign in to library
                </button>
              </div>
            </div>

            {/* Search preview */}
            <div className="mx-auto mt-12 max-w-3xl sm:mt-16">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new Event("libro:open-search"))
                  }
                  className="flex h-12 w-full items-center gap-3 rounded-xl bg-slate-50 px-4 text-left transition hover:bg-indigo-50/60"
                >
                  <Search className="h-4 w-4 text-slate-400" />

                  <span className="flex-1 text-xs text-slate-400">
                    Search books, authors, subjects...
                  </span>

                  <span className="hidden rounded-lg border border-slate-200 bg-white px-2 py-1 text-[8px] font-medium text-slate-400 sm:block">
                    âŒ˜ K
                  </span>
                </button>

                <div className="grid gap-2 p-2 sm:grid-cols-3">
                  <MiniBook
                    title="Atomic Habits"
                    author="James Clear"
                    color="from-indigo-700 to-violet-600"
                  />

                  <MiniBook
                    title="Clean Code"
                    author="Robert C. Martin"
                    color="from-slate-950 to-slate-700"
                  />

                  <MiniBook
                    title="Deep Work"
                    author="Cal Newport"
                    color="from-emerald-700 to-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-slate-200/70 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200/70 sm:grid-cols-4">
            <Stat value="1.2K+" label="Books available" />
            <Stat value="846" label="Active students" />
            <Stat value="98%" label="On-time returns" />
            <Stat value="4.9/5" label="Student experience" />
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              Everything in one place
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-4xl">
              Designed around your reading journey.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              A focused digital experience that makes everyday library tasks
              faster, clearer, and more enjoyable.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={Search}
              title="Find anything"
              description="Search the collection by title, author, category, or subject."
              tone="indigo"
            />

            <FeatureCard
              icon={BookMarked}
              title="Reserve instantly"
              description="Reserve books and know exactly when they are ready."
              tone="violet"
            />

            <FeatureCard
              icon={Clock3}
              title="Track your loans"
              description="See due dates, renewals, and your complete borrowing history."
              tone="amber"
            />

            <FeatureCard
              icon={ShieldCheck}
              title="Stay protected"
              description="Your account and library activity are handled securely."
              tone="emerald"
            />
          </div>
        </section>

        {/* Collection */}
        <section id="collection" className="bg-slate-950 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
                  Curated collection
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">
                  Something worth reading is always waiting.
                </h2>

                <p className="mt-5 text-sm leading-7 text-slate-400">
                  From technology and business to design, psychology, and
                  personal development, discover titles selected for curious
                  minds.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-xs font-bold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Explore collection
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {loadingBooks ? (
                  [1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="aspect-[2/3] animate-pulse rounded-2xl bg-white/10"
                    />
                  ))
                ) : featuredBooks.length > 0 ? (
                  featuredBooks.map((book, index) => (
                    <motion.button
                      key={book._id}
                      type="button"
                      onClick={() =>
                        navigate(`/student/catalog/${book._id}`)
                      }
                      initial={{
                        opacity: 0,
                        y: 18,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                        amount: 0.2,
                      }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.08,
                      }}
                      whileHover={{
                        y: -8,
                      }}
                      className="group text-left"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-slate-800 shadow-[0_14px_35px_rgba(0,0,0,0.28)]">
                        <LandingBookCover book={book} />

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        <div className="absolute bottom-2.5 left-2.5 right-2.5 translate-y-2 rounded-lg border border-white/20 bg-white/10 px-2.5 py-2 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <p className="line-clamp-1 text-[9px] font-bold text-white">
                            View book
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 px-0.5">
                        <p className="line-clamp-2 text-[10px] font-bold leading-4 text-white">
                          {book.title}
                        </p>

                        <p className="mt-1 line-clamp-1 text-[9px] text-slate-500">
                          {book.author || "Unknown author"}
                        </p>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <div className="col-span-2 flex aspect-[2/3] items-center justify-center rounded-2xl bg-white/5 p-4 text-center sm:col-span-4">
                    <div>
                      <BookOpen className="mx-auto h-7 w-7 text-white/20" />

                      <p className="mt-3 text-xs font-semibold text-white/60">
                        Collection coming soon
                      </p>

                      <p className="mt-1 text-[9px] text-slate-500">
                        Books added to Libro will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* About / CTA */}
        <section
          id="about"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 shadow-[0_20px_60px_rgba(79,70,229,0.18)] sm:p-10 lg:p-14">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-300/10 blur-3xl" />

            <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-semibold text-indigo-100 ring-1 ring-white/10">
                  <Library className="h-3 w-3" />
                  Built for modern students
                </span>

                <h2 className="mt-5 max-w-2xl text-3xl font-bold tracking-[-0.05em] text-white sm:text-4xl">
                  Your library, beautifully simplified.
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-indigo-100/75">
                  Spend less time managing your books and more time learning,
                  exploring, and reading.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/register")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-xs font-bold text-indigo-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Create your account
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-white">
              <BookOpen className="h-3.5 w-3.5" />
            </span>

            <span className="text-[10px] font-bold text-slate-800">
              Library Management System
            </span>
          </div>

          <p className="text-[9px] text-slate-400">
            Built for a better academic reading experience.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------------- */
/* Mini Book                        */
/* -------------------------------- */

function MiniBook({ title, author, color }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 transition-all hover:border-indigo-100 hover:shadow-sm">
      <div
        className={`relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-gradient-to-br ${color}`}
      >
        <span className="absolute bottom-1.5 left-1.5 right-1 text-[5px] font-bold leading-tight text-white">
          {title}
        </span>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold text-slate-800">{title}</p>

        <p className="mt-1 truncate text-[8px] text-slate-400">{author}</p>

        <div className="mt-1.5 flex items-center gap-1 text-[7px] text-amber-500">
          <Star className="h-2.5 w-2.5 fill-current" />
          4.8
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- */
/* Stats                            */
/* -------------------------------- */

function Stat({ value, label }) {
  return (
    <div className="px-4 py-6 text-center transition-colors hover:bg-indigo-50/30 sm:py-8">
      <p className="text-xl font-bold tracking-[-0.04em] text-slate-950 sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

/* -------------------------------- */
/* Feature Card                     */
/* -------------------------------- */

function FeatureCard({ icon: Icon, title, description, tone }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <h3 className="mt-5 text-sm font-bold text-slate-900">{title}</h3>

      <p className="mt-2 text-[10px] leading-5 text-slate-400">{description}</p>

      <span className="mt-5 block h-px w-8 bg-slate-200 transition-all group-hover:w-12 group-hover:bg-indigo-400" />
    </article>
  );
}

/* -------------------------------- */
/* Dark Book                        */
/* -------------------------------- */

function DarkBook({ title, author, color }) {
  return (
    <div className="group">
      <div
        className={`relative aspect-[3/4.3] overflow-hidden rounded-xl bg-gradient-to-br ${color} shadow-lg transition-transform duration-200 group-hover:-translate-y-1`}
      >
        <div className="absolute inset-2 rounded-lg border border-white/10" />

        <span className="absolute left-3 top-3 text-[6px] font-bold uppercase tracking-[0.12em] text-white/40">
          LIBRARY
        </span>

        <div className="absolute bottom-3 left-3 right-3">
          <p className="line-clamp-4 text-[9px] font-bold leading-3 text-white">
            {title}
          </p>

          <p className="mt-1 truncate text-[6px] text-white/50">{author}</p>
        </div>
      </div>
    </div>
  );
}



