import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Library,
  Sparkles,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ease = [0.22, 1, 0.36, 1];

const getCoverImageUrl = (coverImage) => {
  if (!coverImage) return null;

  if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
    return coverImage;
  }

  if (coverImage.startsWith("/")) {
    return `${API_URL}${coverImage}`;
  }

  return `${API_URL}/${coverImage}`;
};

const pageVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.065,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease,
    },
  },
};

const softItemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease,
    },
  },
};

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();

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
      if (!loan.dueDate) return false;

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

  const borrowedBookIds = useMemo(
    () => new Set(activeLoans.map((loan) => loan.book?._id).filter(Boolean)),
    [activeLoans],
  );

  const recommendedBooks = useMemo(
    () => books.filter((book) => !borrowedBookIds.has(book._id)).slice(0, 5),
    [books, borrowedBookIds],
  );

  const availableCopies = useMemo(
    () =>
      books.reduce(
        (total, book) => total + Number(book.availableCopies || 0),
        0,
      ),
    [books],
  );

  const displayName = user?.name || "Student";

  const firstName = displayName.split(" ")[0];

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchDashboard} />;
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
      variants={pageVariants}
      className="pb-8"
    >
      {/* ================================================================ */}
      {/* WELCOME HEADER                                                    */}
      {/* ================================================================ */}

      <motion.section variants={itemVariants} className="mb-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
              Student library
            </p>

            <h1 className="mt-1.5 truncate text-[27px] font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl">
              Good morning, {firstName}
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              Keep exploring. Your next great read is waiting.
            </p>
          </div>

          <motion.button
            type="button"
            onClick={() => navigate("/notifications")}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-[0_5px_20px_rgba(15,23,42,0.05)] transition-colors hover:text-indigo-600"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />

            {notifications.length > 0 && (
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </motion.button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[10px] font-medium text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />

          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
      </motion.section>

      {/* ================================================================ */}
      {/* PREMIUM HERO                                                      */}
      {/* ================================================================ */}

      <motion.section
        variants={itemVariants}
        className="relative isolate overflow-hidden rounded-[28px] bg-[#111827] p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:p-7 lg:p-8"
      >
        {/* Ambient background */}

        <motion.div
          aria-hidden="true"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, 18, 0],
                  y: [0, -10, 0],
                  scale: [1, 1.05, 1],
                }
          }
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
        />

        <motion.div
          aria-hidden="true"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, -12, 0],
                  y: [0, 14, 0],
                }
          }
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-24 -left-16 -z-10 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl"
        />

        <div className="relative max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">
            <Sparkles className="h-3 w-3 text-indigo-300" />

            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-100">
              Your reading space
            </span>
          </div>

          <h2 className="mt-4 max-w-md text-[25px] font-bold leading-[1.08] tracking-[-0.045em] text-white sm:text-3xl">
            Discover your next
            <span className="text-indigo-300"> great read.</span>
          </h2>

          <p className="mt-3 max-w-sm text-xs leading-5 text-slate-300 sm:text-sm">
            Browse the Libro collection, reserve a book, and keep your reading
            journey organized.
          </p>

          <motion.button
            type="button"
            onClick={() => navigate("/student/catalog")}
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    x: 2,
                    boxShadow: "0 12px 30px rgba(0,0,0,.22)",
                  }
            }
            whileTap={
              shouldReduceMotion
                ? undefined
                : {
                    scale: 0.97,
                  }
            }
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition-colors hover:bg-indigo-50"
          >
            Browse books
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>
        </div>

        {/* Decorative book */}

        <motion.div
          aria-hidden="true"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, -7, 0],
                  rotate: [-3, -1, -3],
                }
          }
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -bottom-5 right-5 hidden h-36 w-24 rotate-[-3deg] rounded-r-xl rounded-l-md bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[12px_16px_35px_rgba(0,0,0,0.28)] sm:block"
        >
          <div className="absolute inset-y-3 left-3 w-px bg-white/20" />

          <div className="absolute left-7 top-8 right-3">
            <div className="h-1.5 w-10 rounded-full bg-white/70" />
            <div className="mt-2 h-1 w-8 rounded-full bg-white/25" />
            <div className="mt-1 h-1 w-6 rounded-full bg-white/25" />
          </div>

          <BookOpen className="absolute bottom-4 right-3 h-5 w-5 text-white/30" />
        </motion.div>
      </motion.section>

      {/* ================================================================ */}
      {/* QUICK STATS                                                       */}
      {/* ================================================================ */}

      <motion.section variants={itemVariants} className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Overview
            </p>

            <h2 className="mt-1 text-base font-bold tracking-[-0.025em] text-slate-950">
              Your library
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Borrowed"
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
            label="Pending fines"
            value={`₹${pendingFineAmount}`}
            icon={WalletCards}
            tone={pendingFineAmount > 0 ? "rose" : "violet"}
          />
        </div>
      </motion.section>

      {/* ================================================================ */}
      {/* CONTENT WILL CONTINUE IN PART 2                                  */}
      {/* ================================================================ */}
    </motion.div>
  );
}
function StatCard({ label, value, icon: Icon, tone }) {
  const shouldReduceMotion = useReducedMotion();

  const tones = {
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
  };

  return (
    <motion.div
      variants={softItemVariants}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -3,
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              scale: 0.985,
            }
      }
      className="group rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_6px_22px_rgba(15,23,42,0.035)] transition-shadow hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-slate-400">
            {label}
          </p>

          <motion.p
            initial={
              shouldReduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 5,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
              ease,
              delay: 0.15,
            }}
            className="mt-2 text-[25px] font-bold tracking-[-0.055em] text-slate-950"
          >
            {value}
          </motion.p>
        </div>

        <span
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 transition-transform duration-200 group-hover:scale-105",
            tones[tone],
          ].join(" ")}
        >
          <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
        </span>
      </div>
    </motion.div>
  );
}

function ErrorState({ error, onRetry }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <motion.div
        initial={
          shouldReduceMotion
            ? false
            : {
                opacity: 0,
                y: 14,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="w-full max-w-md rounded-[28px] border border-rose-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <TriangleAlert className="h-5 w-5" />
        </div>

        <h2 className="mt-5 text-lg font-bold text-slate-950">
          We couldn't load your dashboard
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          Try again
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse pb-8">
      <div className="mb-5">
        <div className="h-2.5 w-24 rounded-full bg-slate-200" />

        <div className="mt-3 h-8 w-56 rounded-xl bg-slate-200" />

        <div className="mt-2 h-3 w-72 rounded-full bg-slate-100" />
      </div>

      <div className="h-[260px] rounded-[28px] bg-slate-200 sm:h-56" />

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-[108px] rounded-[20px] bg-slate-100" />
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="h-80 rounded-[24px] bg-slate-100" />

        <div className="h-80 rounded-[24px] bg-slate-100" />
      </div>
    </div>
  );
}
{
  /* ================================================================ */
}
{
  /* READING NOW + ACTIVITY                                           */
}
{
  /* ================================================================ */
}

<div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
  {/* READING NOW */}

  <motion.section
    variants={itemVariants}
    className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
  >
    <SectionHeader
      eyebrow="Currently reading"
      title="Your books"
      description={
        activeLoans.length > 0
          ? `${activeLoans.length} book${
              activeLoans.length === 1 ? "" : "s"
            } currently with you.`
          : "Your active loans will appear here."
      }
      action={activeLoans.length > 0 ? "View all" : "Browse books"}
      onAction={() =>
        activeLoans.length > 0
          ? navigate("/student/loans")
          : navigate("/student/catalog")
      }
    />

    {activeLoans.length > 0 ? (
      <div className="divide-y divide-slate-100">
        {activeLoans.slice(0, 4).map((loan, index) => (
          <BorrowedBook
            key={loan._id}
            loan={loan}
            index={index}
            onView={() =>
              loan.book?._id && navigate(`/student/catalog/${loan.book._id}`)
            }
          />
        ))}
      </div>
    ) : (
      <EmptySection
        icon={BookOpen}
        title="Nothing on loan"
        text="Your next book could be waiting in the catalogue."
        action="Browse catalogue"
        onClick={() => navigate("/student/catalog")}
      />
    )}
  </motion.section>

  {/* RECENT ACTIVITY */}

  <motion.section
    variants={itemVariants}
    className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
  >
    <SectionHeader
      eyebrow="Latest updates"
      title="Recent activity"
      description="The latest changes from your library."
      icon={Bell}
    />

    {recentNotifications.length > 0 ? (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        className="divide-y divide-slate-100"
      >
        {recentNotifications.map((notification, index) => (
          <UpdateItem
            key={notification._id || `${notification.createdAt}-${index}`}
            notification={notification}
            index={index}
          />
        ))}
      </motion.div>
    ) : (
      <EmptySection
        icon={Bell}
        title="You're all caught up"
        text="New library updates will appear here."
      />
    )}
  </motion.section>
</div>;

{
  /* ================================================================ */
}
{
  /* RESERVATIONS                                                      */
}
{
  /* ================================================================ */
}

<AnimatePresence initial={false}>
  {activeReservations.length > 0 && (
    <motion.section
      key="reservations"
      initial={
        shouldReduceMotion
          ? false
          : {
              opacity: 0,
              height: 0,
              y: 12,
            }
      }
      animate={{
        opacity: 1,
        height: "auto",
        y: 0,
      }}
      exit={
        shouldReduceMotion
          ? undefined
          : {
              opacity: 0,
              height: 0,
              y: -8,
            }
      }
      transition={{
        duration: 0.4,
        ease,
      }}
      className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
    >
      <SectionHeader
        eyebrow="Reservations"
        title="Your reservation status"
        description={
          readyReservations.length > 0
            ? `${readyReservations.length} book${
                readyReservations.length === 1 ? "" : "s"
              } ready for pickup.`
            : waitingReservations.length > 0
              ? "Track your place in the queue."
              : "Track your reservation progress."
        }
        action="Browse books"
        onAction={() => navigate("/student/catalog")}
      />

      <div className="divide-y divide-slate-100">
        {activeReservations.slice(0, 4).map((reservation, index) => {
          const isReady = reservation.status === "ready";

          const position = reservation.position;

          return (
            <motion.button
              key={reservation._id}
              type="button"
              variants={softItemVariants}
              initial="hidden"
              animate="visible"
              transition={{
                delay: index * 0.04,
              }}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      backgroundColor: "#f8fafc",
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.995,
                    }
              }
              onClick={() =>
                reservation.book?._id &&
                navigate(`/student/catalog/${reservation.book._id}`)
              }
              className="flex w-full items-center gap-3 p-4 text-left transition-colors sm:p-5"
            >
              <motion.div
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 1.06,
                      }
                }
                className={[
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                  isReady
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-indigo-50 text-indigo-600",
                ].join(" ")}
              >
                {isReady ? (
                  <CheckCircle2 className="h-[18px] w-[18px]" />
                ) : (
                  <Library className="h-[18px] w-[18px]" />
                )}
              </motion.div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">
                  {reservation.book?.title || "Reserved book"}
                </p>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {isReady
                    ? "Ready for pickup"
                    : position
                      ? `You are #${position} in the queue`
                      : "Waiting for the next available copy"}
                </p>
              </div>

              <span
                className={[
                  "shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold",
                  isReady
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-indigo-50 text-indigo-700",
                ].join(" ")}
              >
                {isReady ? "Ready" : `#${position || "—"}`}
              </span>

              <ChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  )}
</AnimatePresence>;

{
  /* ================================================================ */
}
{
  /* RECOMMENDATIONS                                                   */
}
{
  /* ================================================================ */
}

<motion.section
  variants={itemVariants}
  className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
>
  <SectionHeader
    eyebrow="From the collection"
    title="Recommended books"
    description="Discover your next read."
    action="Explore all"
    onAction={() => navigate("/student/catalog")}
  />

  {recommendedBooks.length > 0 ? (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-5 pt-1 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:p-5 lg:grid-cols-3">
      {recommendedBooks.map((book, index) => (
        <RecommendationCard
          key={book._id}
          book={book}
          index={index}
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
</motion.section>;

{
  /* ================================================================ */
}
{
  /* LIBRARY STATUS                                                    */
}
{
  /* ================================================================ */
}

<motion.section
  variants={itemVariants}
  className="relative mt-5 overflow-hidden rounded-[24px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 sm:p-6"
>
  <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-indigo-200/30 blur-3xl" />

  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3">
      <motion.span
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                rotate: 5,
                scale: 1.05,
              }
        }
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100"
      >
        <Library className="h-[18px] w-[18px]" />
      </motion.span>

      <div>
        <p className="text-sm font-bold text-indigo-950">Library collection</p>

        <p className="mt-0.5 text-xs text-indigo-700/60">
          Available copies across the catalogue.
        </p>
      </div>
    </div>

    <motion.span
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -2,
            }
      }
      className="w-fit rounded-full bg-white px-3.5 py-2 text-xs font-bold text-indigo-700 shadow-sm ring-1 ring-indigo-100"
    >
      {availableCopies} {availableCopies === 1 ? "copy" : "copies"} available
    </motion.span>
  </div>
</motion.section>;
function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  onAction,
  icon: Icon,
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-indigo-500" />

          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-600">
            {eyebrow}
          </p>

          {Icon && (
            <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="h-3 w-3" />
            </span>
          )}
        </div>

        <h2 className="mt-2 text-lg font-bold tracking-[-0.03em] text-slate-950">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      </div>

      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="hidden shrink-0 items-center gap-1 text-xs font-bold text-indigo-600 transition-colors hover:text-indigo-700 sm:inline-flex"
        >
          {action}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function BorrowedBook({ loan, onView }) {
  const shouldReduceMotion = useReducedMotion();

  const status = getLoanStatus(loan);
  const progress = calculateLoanProgress(loan);

  const urgent = status === "Due soon";
  const overdue = status === "Overdue";

  const title = loan.book?.title || "Unknown book";

  const author = loan.book?.author || "Unknown author";

  const cover = getCoverImageUrl(loan.book?.coverImage);

  return (
    <motion.div
      variants={softItemVariants}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              backgroundColor: "#fafafa",
            }
      }
      className="group flex gap-4 p-4 transition-colors sm:p-5"
    >
      <motion.div
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                scale: 1.035,
                rotate: -1,
              }
        }
        transition={{
          duration: 0.2,
          ease,
        }}
        className="relative flex h-24 w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_8px_18px_rgba(79,70,229,0.15)]"
      >
        {cover ? (
          <img
            src={cover}
            alt={title}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <BookOpen className="h-5 w-5" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/10 to-white/10" />
      </motion.div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{title}</p>

            <p className="mt-1 truncate text-xs text-slate-400">{author}</p>
          </div>

          <span
            className={[
              "w-fit rounded-full px-2.5 py-1 text-[9px] font-bold",
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
            <span className="text-[10px] font-medium text-slate-400">
              Loan progress
            </span>

            <span className="text-[10px] font-bold text-slate-500">
              {progress}%
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      width: 0,
                    }
              }
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.8,
                ease,
              }}
              className={[
                "h-full rounded-full",
                overdue
                  ? "bg-rose-500"
                  : urgent
                    ? "bg-amber-500"
                    : "bg-indigo-500",
              ].join(" ")}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span
            className={[
              "flex min-w-0 items-center gap-1.5 text-[10px]",
              overdue ? "font-semibold text-rose-600" : "text-slate-400",
            ].join(" ")}
          >
            <Clock3 className="h-3 w-3 shrink-0" />
            <span className="truncate">Due {formatDate(loan.dueDate)}</span>
          </span>

          <button
            type="button"
            onClick={onView}
            className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-indigo-600 transition-colors hover:text-indigo-700"
          >
            Details
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
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
    <motion.div variants={softItemVariants} className="flex gap-3 p-4 sm:p-5">
      <span
        className={[
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          tones[tone],
        ].join(" ")}
      >
        <Bell className="h-3.5 w-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold leading-5 text-slate-800">
            {notification.title}
          </p>

          <span className="shrink-0 text-[9px] text-slate-400">
            {notification.createdAt
              ? formatRelativeTime(notification.createdAt)
              : ""}
          </span>
        </div>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {notification.message}
        </p>
      </div>
    </motion.div>
  );
}

function RecommendationCard({ book, onView, index }) {
  const shouldReduceMotion = useReducedMotion();

  const cover = getCoverImageUrl(book.coverImage);

  return (
    <motion.article
      variants={softItemVariants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: index * 0.06,
      }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              scale: 0.985,
            }
      }
      className="group min-w-[250px] snap-start shrink-0 rounded-[20px] border border-slate-200/80 bg-slate-50/70 p-4 transition-colors hover:border-indigo-100 hover:bg-white sm:min-w-0"
    >
      <div className="flex gap-3">
        <motion.div
          whileHover={
            shouldReduceMotion
              ? undefined
              : {
                  scale: 1.04,
                }
          }
          className="flex h-24 w-[66px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
        >
          {cover ? (
            <img
              src={cover}
              alt={book.title}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <BookOpen className="h-5 w-5" />
          )}
        </motion.div>

        <div className="min-w-0">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-500">
            {book.category || "Library"}
          </span>

          <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 text-slate-800">
            {book.title}
          </h3>

          <p className="mt-1 truncate text-xs text-slate-400">
            {book.author || "Unknown author"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onView}
        className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-all hover:border-indigo-200 hover:text-indigo-600 active:scale-[0.99]"
      >
        View book
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.article>
  );
}

function EmptySection({ icon: Icon, title, text, action, onClick }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">{title}</h3>

      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-400">
        {text}
      </p>

      {action && onClick && (
        <button
          type="button"
          onClick={onClick}
          className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
        >
          {action}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
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

  const now = Date.now();

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
