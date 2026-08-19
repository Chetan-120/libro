import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Command,
  Library,
  Menu,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ============================================================
   BOOK HELPERS
============================================================ */

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

function getBookTitle(book) {
  return book?.title || "Untitled book";
}

function getBookAuthor(book) {
  return book?.author || "Unknown author";
}

function getBookCategory(book) {
  return book?.category || book?.genre || book?.subject || "Featured";
}

/* ============================================================
   BOOK COVER
============================================================ */

function BookCover({ book, className = "", priority = false }) {
  const [failed, setFailed] = useState(false);

  const coverUrl = getCoverImageUrl(book?.coverImage);

  useEffect(() => {
    setFailed(false);
  }, [coverUrl]);

  if (!coverUrl || failed) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_25%_20%,rgba(99,102,241,.55),transparent_30%),linear-gradient(145deg,#312e81,#05060b)] ${className}`}
      >
        <div className="text-center">
          <BookOpen className="mx-auto h-8 w-8 text-white/30" />

          <p className="mt-3 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/30">
            Libro
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={coverUrl}
      alt={getBookTitle(book)}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        console.error("Libro cover failed:", coverUrl);
        setFailed(true);
      }}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

/* ============================================================
   REVEAL
============================================================ */

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 28,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.12,
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   AMBIENT BACKGROUND
============================================================ */

function AmbientBackground({ dark = true }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{
          x: [-60, 60, -20, -60],
          y: [-20, 45, -35, -20],
          scale: [1, 1.12, 0.96, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute left-[12%] top-[8%] h-[380px] w-[380px] rounded-full blur-[120px] ${
          dark ? "bg-indigo-600/15" : "bg-indigo-200/50"
        }`}
      />

      <motion.div
        animate={{
          x: [50, -70, 30, 50],
          y: [20, -40, 60, 20],
          scale: [1, 0.92, 1.08, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute right-[8%] top-[28%] h-[330px] w-[330px] rounded-full blur-[120px] ${
          dark ? "bg-violet-600/12" : "bg-violet-200/40"
        }`}
      />

      {dark && (
        <>
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
              backgroundSize: "70px 70px",
            }}
          />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,.5)_100%)]" />
        </>
      )}
    </div>
  );
}

/* ============================================================
   NAVBAR
============================================================ */

function Navbar({ navigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    ["Discover", "discover"],
    ["Collection", "collection"],
    ["Experience", "experience"],
  ];

  function goTo(id) {
    setMobileOpen(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <>
      <header className="absolute left-0 right-0 top-0 z-[100]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="group flex items-center gap-3"
          >
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.055] backdrop-blur-2xl">
              <span className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-violet-500/10 opacity-0 transition-opacity group-hover:opacity-100" />

              <BookOpen className="relative h-4 w-4 text-white" />
            </span>

            <span className="text-left">
              <span className="block text-sm font-bold tracking-[-0.02em] text-white">
                Libro
              </span>

              <span className="mt-0.5 block text-[7px] font-semibold uppercase tracking-[0.22em] text-white/25">
                Digital Library
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-9 md:flex">
            {links.map(([label, id]) => (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35 transition-colors hover:text-white"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="hidden h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[9px] font-bold text-white/60 backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:flex"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => navigate("/register")}
              className="hidden h-10 items-center gap-2 rounded-full bg-white px-5 text-[9px] font-bold text-slate-950 transition-transform hover:-translate-y-0.5 sm:flex"
            >
              Get started
              <ArrowUpRight className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] bg-[#05060b]/95 p-5 backdrop-blur-2xl md:hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                <BookOpen className="h-4 w-4 text-white" />
              </span>

              <span className="text-sm font-bold text-white">Libro</span>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-20 space-y-3">
            {links.map(([label, id]) => (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                className="block w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-5 text-left text-lg font-semibold text-white"
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-5 h-12 w-full rounded-full bg-white text-[10px] font-bold text-slate-950"
            >
              Sign in
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}

/* ============================================================
   SEARCH BAR
============================================================ */

function LibrarySearch({ value, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-xl">
      <div className="absolute inset-0 rounded-[22px] bg-indigo-500/10 blur-2xl" />

      <div className="relative flex h-14 items-center rounded-[18px] border border-white/10 bg-white/[0.055] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,.25)] backdrop-blur-2xl">
        <Search className="ml-4 h-4 w-4 shrink-0 text-white/30" />

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search books, authors, subjects..."
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[11px] text-white outline-none placeholder:text-white/25"
        />

        <button
          type="submit"
          className="flex h-10 items-center gap-2 rounded-[13px] bg-white px-4 text-[9px] font-bold text-slate-950 transition-transform hover:scale-[1.02]"
        >
          Search
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 px-2">
        <Command className="h-3 w-3 text-white/15" />

        <span className="text-[7px] text-white/20">
          Search your university collection
        </span>
      </div>
    </form>
  );
}

/* ============================================================
   HERO BOOK STAGE
============================================================ */

function HeroBookStage({ books, navigate }) {
  const [active, setActive] = useState(0);

  const mainBook = books[active] || books[0];

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springX = useSpring(rotateX, {
    stiffness: 90,
    damping: 18,
  });

  const springY = useSpring(rotateY, {
    stiffness: 90,
    damping: 18,
  });

  const bookX = useTransform(springY, [-0.5, 0.5], [8, -8]);

  const bookY = useTransform(springX, [-0.5, 0.5], [-10, 10]);

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width - 0.5;

    const y = (event.clientY - rect.top) / rect.height - 0.5;

    rotateX.set(x);
    rotateY.set(y);
  }

  function resetPointer() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className="relative mx-auto h-[570px] w-full max-w-[560px]"
      style={{
        perspective: "1500px",
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[110px]"
      />

      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 36,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07]"
      />

      <motion.div
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.035]"
      />

      {books.slice(1, 4).map((book, index) => (
        <motion.button
          key={book._id}
          type="button"
          onClick={() => navigate(`/student/catalog/${book._id}`)}
          initial={{
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            opacity: 0.62,
            y: [0, -12, 0],
            rotate: index === 0 ? -13 : index === 1 ? 12 : -8,
          }}
          transition={{
            opacity: {
              duration: 0.8,
              delay: 0.3 + index * 0.15,
            },
            scale: {
              duration: 0.8,
              delay: 0.3 + index * 0.15,
            },
            y: {
              duration: 6 + index,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          whileHover={{
            opacity: 1,
            scale: 1.04,
          }}
          className={`absolute z-10 aspect-[2/3] w-[115px] overflow-hidden rounded-[16px] border border-white/10 bg-slate-950 shadow-[20px_30px_70px_rgba(0,0,0,.5)] ${
            index === 0
              ? "left-[2%] top-[22%]"
              : index === 1
                ? "right-[2%] top-[14%]"
                : "right-[13%] bottom-[8%]"
          }`}
        >
          <BookCover book={book} />

          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />

          <div className="absolute inset-0 rounded-[16px] ring-1 ring-inset ring-white/10" />
        </motion.button>
      ))}

      {mainBook ? (
        <>
          <div className="absolute bottom-[50px] left-1/2 h-12 w-52 -translate-x-1/2 rounded-full bg-black/70 blur-[30px]" />

          <motion.button
            type="button"
            onClick={() => navigate(`/student/catalog/${mainBook._id}`)}
            style={{
              rotateX: bookY,
              rotateY: bookX,
              transformStyle: "preserve-3d",
            }}
            animate={{
              y: [0, -13, 0],
              rotateZ: [-1, 1, -1],
            }}
            transition={{
              y: {
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              },
              rotateZ: {
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            whileHover={{
              scale: 1.025,
            }}
            className="group absolute left-1/2 top-1/2 z-30 aspect-[2/3] w-[240px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border border-white/20 bg-slate-950 shadow-[30px_50px_100px_rgba(0,0,0,.65)]"
          >
            <BookCover
              book={mainBook}
              priority
              className="transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/15" />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 text-left">
              <span className="inline-flex rounded-full border border-white/15 bg-black/30 px-2.5 py-1.5 text-[7px] font-bold uppercase tracking-[0.18em] text-white/75 backdrop-blur-xl">
                Featured book
              </span>

              <p className="mt-3 line-clamp-2 text-[12px] font-bold leading-4 text-white">
                {getBookTitle(mainBook)}
              </p>

              <p className="mt-1 text-[8px] text-white/50">
                {getBookAuthor(mainBook)}
              </p>
            </div>

            <div className="absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/15" />
          </motion.button>

          <div className="absolute bottom-2 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] p-1.5 backdrop-blur-xl">
            {books.slice(0, 4).map((book, index) => (
              <button
                key={book._id}
                type="button"
                onClick={() => setActive(index)}
                className={`h-1.5 rounded-full transition-all ${
                  active === index ? "w-7 bg-white" : "w-1.5 bg-white/20"
                }`}
                aria-label={`Show book ${index + 1}`}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border border-white/10 border-t-white/70" />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   HERO
============================================================ */

function Hero({ books, navigate, search, setSearch }) {
  function submitSearch(event) {
    event.preventDefault();

    if (!search.trim()) {
      document.getElementById("collection")?.scrollIntoView({
        behavior: "smooth",
      });

      return;
    }

    const query = encodeURIComponent(search.trim());

    navigate(`/student/catalog?search=${query}`);
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#05060b]">
      <AmbientBackground />

      <Navbar navigate={navigate} />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-4 px-5 pb-12 pt-28 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:pb-8 lg:pt-20">
        <div className="relative z-30 max-w-2xl">
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/[0.08] px-3 py-1.5 backdrop-blur-xl"
          >
            <Sparkles className="h-3 w-3 text-indigo-300" />

            <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-indigo-100/60">
              The modern university library
            </span>
          </motion.div>

          <motion.h1
            initial={{
              opacity: 0,
              y: 35,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-7 max-w-3xl text-[56px] font-semibold leading-[0.87] tracking-[-0.075em] bg-gradient-to-r from-indigo-200 via-white to-violet-300 bg-clip-text text-transparent sm:text-7xl lg:text-[84px]"
          >
            Your next
            <span className="block bg-gradient-to-r from-indigo-100 via-white to-violet-300 bg-clip-text text-transparent">
              chapter starts here.
            </span>
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.35,
            }}
            className="mt-7 max-w-xl text-sm leading-7 text-white/40 sm:text-base"
          >
            Discover books, reserve what you need, track your loans, and
            experience your university library through one beautifully connected
            space.
          </motion.p>

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.5,
            }}
            className="mt-8"
          >
            <LibrarySearch
              value={search}
              onChange={setSearch}
              onSubmit={submitSearch}
            />
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.7,
            }}
            className="mt-5 flex flex-wrap items-center gap-3"
          >
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="group inline-flex h-11 items-center gap-3 rounded-full bg-white px-6 text-[9px] font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
            >
              Start exploring
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() =>
                document.getElementById("discover")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
              className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-5 text-[9px] font-semibold text-white/45 backdrop-blur-xl transition-colors hover:text-white"
            >
              Discover Libro
              <ArrowDown className="h-3 w-3" />
            </button>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 1,
              delay: 0.9,
            }}
            className="mt-9 flex items-center gap-6"
          >
            <div className="flex -space-x-2">
              {["L", "R", "A", "S"].map((letter) => (
                <span
                  key={letter}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#05060b] bg-indigo-500/15 text-[7px] font-bold text-white/55 backdrop-blur"
                >
                  {letter}
                </span>
              ))}
            </div>

            <div className="h-7 w-px bg-white/10" />

            <div>
              <div className="flex items-center gap-1">
                <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />

                <span className="text-[9px] font-bold text-white">
                  Built for students
                </span>
              </div>

              <p className="mt-1 text-[7px] text-white/20">
                Simple. Intelligent. Connected.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="relative">
          <HeroBookStage books={books} navigate={navigate} />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-3 text-white/20 lg:flex">
        <span className="h-px w-8 bg-white/10" />

        <span className="text-[7px] font-semibold uppercase tracking-[0.3em]">
          Scroll to explore
        </span>

        <span className="h-px w-8 bg-white/10" />
      </div>
    </section>
  );
}

/* ============================================================
   DISCOVERY
============================================================ */

function DiscoverySection({ books, loading, navigate }) {
  const featured = books.slice(0, 4);

  return (
    <section id="discover" className="relative overflow-hidden bg-[#F5F6F8]">
      <div className="pointer-events-none absolute left-[5%] top-[5%] h-[350px] w-[350px] rounded-full bg-indigo-100/60 blur-[120px]" />

      <div className="pointer-events-none absolute bottom-[5%] right-[5%] h-[300px] w-[300px] rounded-full bg-violet-100/60 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <Reveal>
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-indigo-600">
                Discover
              </p>

              <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.07em] text-[#101322] sm:text-6xl">
                Find something
                <span className="block text-[#737B90]">worth your time.</span>
              </h2>

              <p className="mt-6 max-w-xl text-sm leading-7 text-[#687086]">
                From technical depth to creative inspiration, your next great
                read is closer than you think.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="group inline-flex h-11 w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
            >
              View all books
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </Reveal>

        {loading ? (
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="aspect-[2/3] animate-pulse rounded-[22px] bg-slate-200"
              />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((book, index) => (
              <Reveal key={book._id} delay={index * 0.07}>
                <motion.button
                  type="button"
                  onClick={() => navigate(`/student/catalog/${book._id}`)}
                  whileHover={{
                    y: -8,
                  }}
                  className="group w-full text-left"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-[0_20px_50px_rgba(15,23,42,.09)]">
                    <BookCover
                      book={book}
                      className="transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-white/10" />

                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 to-transparent" />

                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="inline-flex rounded-full border border-white/15 bg-black/25 px-2.5 py-1.5 text-[7px] font-bold uppercase tracking-[0.16em] text-white/70 backdrop-blur-xl">
                        {getBookCategory(book)}
                      </span>
                    </div>

                    <div className="absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/10" />
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-[11px] font-bold leading-4 text-slate-900">
                        {getBookTitle(book)}
                      </h3>

                      <p className="mt-1 line-clamp-1 text-[8px] text-slate-400">
                        {getBookAuthor(book)}
                      </p>
                    </div>

                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all group-hover:border-slate-950 group-hover:bg-slate-950 group-hover:text-white">
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </motion.button>
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-16 rounded-[28px] border border-slate-200 bg-white p-14 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-200" />

            <p className="mt-4 text-xs font-bold text-slate-600">
              Your collection is waiting.
            </p>

            <p className="mt-2 text-[9px] text-slate-400">
              Books added to Libro will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   SUBJECTS
============================================================ */

function SubjectsSection({ navigate }) {
  const subjects = [
    {
      title: "Technology",
      number: "01",
      text: "Build, engineer, understand.",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=90",
    },
    {
      title: "Business",
      number: "02",
      text: "Think, lead, create.",
      image:
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=90",
    },
    {
      title: "Psychology",
      number: "03",
      text: "Understand people and ideas.",
      image:
        "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1400&q=90",
    },
    {
      title: "Design",
      number: "04",
      text: "Shape experiences that matter.",
      image:
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1400&q=90",
    },
    {
      title: "Literature",
      number: "05",
      text: "Stories that stay with you.",
      image:
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=90",
    },
    {
      title: "Science",
      number: "06",
      text: "Question everything.",
      image:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=90",
    },
  ];

  function openSubject(subject) {
    navigate(`/student/catalog?category=${encodeURIComponent(subject)}`);
  }

  return (
    <section id="subjects" className="relative overflow-hidden bg-[#101322]">
      {/* =====================================================
          CINEMATIC BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        <div className="absolute left-[5%] top-[10%] h-[420px] w-[420px] rounded-full bg-indigo-600/15 blur-[140px]" />

        <div className="absolute right-[5%] bottom-[10%] h-[420px] w-[420px] rounded-full bg-violet-600/15 blur-[140px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(5,6,11,.65)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        {/* =================================================
            HEADING
        ================================================= */}

        <Reveal>
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/[0.08] px-3 py-1.5 backdrop-blur-xl">
                <Sparkles className="h-3 w-3 text-indigo-300" />

                <span className="text-[8px] font-semibold uppercase tracking-[0.22em] text-indigo-200/70">
                  Explore by subject
                </span>
              </div>

              <h2 className="mt-6 text-4xl font-semibold leading-[0.9] tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
                Follow your
                <span className="block bg-gradient-to-r from-indigo-200 via-white to-violet-300 bg-clip-text text-transparent">
                  curiosity.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-sm leading-7 text-white/45">
                Explore different worlds of knowledge and discover something
                that moves your next idea forward.
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-indigo-400/30" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25">
                  06 areas to explore
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* =================================================
            SUBJECT GRID
        ================================================= */}

        <div className="mt-14 grid overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.025] shadow-[0_40px_120px_rgba(0,0,0,.4)] sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, index) => (
            <Reveal key={subject.title} delay={index * 0.05}>
              <motion.button
                type="button"
                onClick={() => openSubject(subject.title)}
                whileHover={{
                  y: -5,
                }}
                transition={{
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`group relative flex min-h-[300px] w-full overflow-hidden text-left ${
                  index % 3 !== 2 ? "lg:border-r" : ""
                } ${index < 3 ? "lg:border-b" : ""} ${
                  index === 0 || index === 1 || index === 2 ? "sm:border-b" : ""
                } border-white/10`}
              >
                {/* IMAGE */}

                <img
                  src={subject.image}
                  alt={subject.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />

                {/* DARK CINEMATIC OVERLAY */}

                <div className="absolute inset-0 bg-gradient-to-b from-[#080910]/20 via-[#080910]/35 to-[#080910]/95" />

                {/* PURPLE TINT */}

                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-violet-700/25 opacity-80 transition-opacity duration-700 group-hover:from-indigo-600/30 group-hover:to-violet-700/40" />

                {/* TOP VIGNETTE */}

                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />

                {/* NUMBER */}

                <div className="absolute left-5 top-5 z-10">
                  <span className="flex h-8 items-center rounded-full border border-white/15 bg-black/20 px-3 text-[8px] font-bold tracking-[0.2em] text-white/60 backdrop-blur-xl transition-all duration-500 group-hover:border-indigo-300/30 group-hover:bg-indigo-500/15 group-hover:text-indigo-100">
                    {subject.number}
                  </span>
                </div>

                {/* ARROW */}

                <div className="absolute right-5 top-5 z-10">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/60 backdrop-blur-xl transition-all duration-500 group-hover:scale-110 group-hover:border-white/30 group-hover:bg-white group-hover:text-slate-950">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>

                {/* CONTENT */}

                <div className="relative z-10 mt-auto w-full p-6 sm:p-7">
                  <div className="mb-4 h-px w-8 bg-indigo-300/60 transition-all duration-700 group-hover:w-16 group-hover:bg-white" />

                  <h3 className="text-2xl font-semibold tracking-[-0.05em] text-white sm:text-[27px]">
                    {subject.title}
                  </h3>

                  <p className="mt-2 max-w-[220px] text-[10px] font-medium leading-5 text-white/55 transition-colors duration-500 group-hover:text-white/75">
                    {subject.text}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-[7px] font-bold uppercase tracking-[0.2em] text-white/0 transition-all duration-500 group-hover:text-indigo-200/80">
                    Explore subject
                    <ArrowRight className="h-2.5 w-2.5" />
                  </div>
                </div>

                {/* GLASS BORDER */}

                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 transition-all duration-500 group-hover:ring-indigo-300/20" />
              </motion.button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   EXPERIENCE
============================================================ */

function ExperienceSection() {
  const steps = [
    {
      number: "01",
      icon: Search,
      title: "Discover",
      text: "Search the collection by title, author, category, or subject.",
    },
    {
      number: "02",
      icon: BookMarked,
      title: "Reserve",
      text: "Reserve a book and know exactly when it becomes ready.",
    },
    {
      number: "03",
      icon: Library,
      title: "Pick up",
      text: "Know the status before you walk to the library.",
    },
    {
      number: "04",
      icon: Clock3,
      title: "Track",
      text: "Manage due dates, loans, renewals, and history.",
    },
  ];

  return (
    <section id="experience" className="relative overflow-hidden bg-[#070810]">
      <AmbientBackground />

      <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <Reveal>
          <div className="max-w-3xl">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-indigo-300">
              How Libro works
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.07em] text-[#F7F8FC] sm:text-6xl">
              Everything you need.
              <span className="block text-[#A7ADBE]">Nothing you don't.</span>
            </h2>

            <p className="mt-6 max-w-xl text-sm leading-7 text-[#9299AC]">
              A focused experience that turns everyday library tasks into
              something simple.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-16">
          <div className="absolute left-[12%] right-[12%] top-[30px] hidden h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent lg:block" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ number, icon: Icon, title, text }) => (
              <Reveal key={number}>
                <motion.div
                  whileHover={{
                    y: -7,
                  }}
                  className="group relative rounded-[24px] border border-white/[0.11] bg-white/[0.045] p-6 backdrop-blur-xl transition-colors duration-500 hover:border-indigo-400/20 hover:bg-indigo-500/[0.06]"
                >
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] transition-colors duration-500 group-hover:border-indigo-300/20 group-hover:bg-indigo-500/10">
                    <Icon className="h-4 w-4 text-white/65 group-hover:text-indigo-200" />
                  </div>

                  <span className="absolute right-5 top-5 text-[8px] font-bold tracking-[0.2em] text-white/30">
                    {number}
                  </span>

                  <h3 className="mt-9 text-sm font-bold text-white">{title}</h3>

                  <p className="mt-3 text-[9px] leading-5 text-[#9299AC]">
                    {text}
                  </p>

                  <div className="mt-8 h-px w-7 bg-indigo-400/30 transition-all duration-500 group-hover:w-14 group-hover:bg-indigo-400" />
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   STUDENT EXPERIENCE
============================================================ */

function StudentExperience() {
  return (
    <section className="overflow-hidden bg-[#F5F6F8]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:px-10">
        <Reveal>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-indigo-600">
              Your library, connected
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.07em] text-slate-950 sm:text-6xl">
              Your books.
              <span className="block text-slate-400">Your time.</span>
            </h2>

            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-500">
              Libro keeps the important information visible without making you
              dig through menus.
            </p>

            <div className="mt-9 space-y-3">
              {[
                "See what you have borrowed",
                "Know when reservations are ready",
                "Track upcoming due dates",
                "Keep your library activity organized",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                    <Check className="h-3 w-3" />
                  </span>

                  <span className="text-[10px] font-semibold text-slate-600">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <DashboardMockup />
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   DASHBOARD MOCKUP
============================================================ */

function DashboardMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-10 rounded-full bg-indigo-200/30 blur-[90px]" />

      <div className="relative overflow-hidden rounded-[30px] border border-white bg-white/80 p-4 shadow-[0_40px_100px_rgba(15,23,42,.13)] backdrop-blur-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Student dashboard
            </p>

            <h3 className="mt-2 text-sm font-bold text-slate-900">
              Good evening.
            </h3>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Library className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <DashboardMetric value="04" label="Loans" />

          <DashboardMetric value="02" label="Reserved" />

          <DashboardMetric value="12" label="History" />
        </div>

        <div className="mt-4 rounded-2xl bg-slate-950 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[7px] uppercase tracking-[0.18em] text-white/30">
                Current loan
              </p>

              <p className="mt-2 text-[10px] font-bold text-white">
                Your reading journey
              </p>
            </div>

            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1.5 text-[7px] font-bold text-emerald-300">
              Active
            </span>
          </div>

          <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{
                width: 0,
              }}
              whileInView={{
                width: "72%",
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 1.3,
              }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
            />
          </div>

          <div className="mt-2 flex justify-between text-[7px] text-white/25">
            <span>Reading progress</span>
            <span>72%</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookMarked className="h-4 w-4" />
            </span>

            <div>
              <p className="text-[9px] font-bold text-slate-800">
                Reservation ready
              </p>

              <p className="mt-1 text-[7px] text-slate-400">
                Your book is ready for pickup.
              </p>
            </div>

            <ArrowRight className="ml-auto h-3 w-3 text-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD METRIC
============================================================ */

function DashboardMetric({ value, label }) {
  return (
    <div className="rounded-xl bg-slate-100 p-3">
      <p className="text-lg font-bold tracking-[-0.05em] text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-[7px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

/* ============================================================
   STATS
============================================================ */

function StatsSection() {
  const stats = [
    ["1.2K+", "Books"],
    ["846", "Students"],
    ["98%", "On-time returns"],
    ["24/7", "Access"],
  ];

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
        {stats.map(([value, label], index) => (
          <Reveal key={label} delay={index * 0.05}>
            <div className="px-5 py-10 text-center sm:py-12">
              <p className="text-3xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-4xl">
                {value}
              </p>

              <p className="mt-2 text-[7px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   COLLECTION
============================================================ */

function BookShelf({ books, navigate }) {
  const [start, setStart] = useState(0);

  const visible = useMemo(() => {
    const count =
      typeof window !== "undefined" && window.innerWidth < 640 ? 2 : 4;

    return Array.from(
      {
        length: Math.min(count, books.length),
      },
      (_, index) => books[(start + index) % books.length],
    );
  }, [books, start]);

  function previous() {
    setStart((current) => (current - 1 + books.length) % books.length);
  }

  function next() {
    setStart((current) => (current + 1) % books.length);
  }

  return (
    <div className="mt-14">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        {visible.map((book, index) => (
          <motion.button
            key={`${book._id}-${index}`}
            type="button"
            onClick={() => navigate(`/student/catalog/${book._id}`)}
            initial={{
              opacity: 0,
              y: 25,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
              delay: index * 0.06,
            }}
            whileHover={{
              y: -10,
            }}
            className="group text-left"
          >
            <div className="relative aspect-[2/3] overflow-hidden rounded-[22px] border border-white/10 bg-slate-950 shadow-[0_25px_60px_rgba(0,0,0,.4)]">
              <BookCover
                book={book}
                className="transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-white/10" />

              <div className="absolute inset-0 rounded-[22px] ring-1 ring-inset ring-white/10" />

              <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[7px] font-bold text-white backdrop-blur-xl">
                  View book
                  <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </div>
            </div>

            <p className="mt-4 line-clamp-2 text-[10px] font-bold leading-4 text-white">
              {getBookTitle(book)}
            </p>

            <p className="mt-1 line-clamp-1 text-[8px] text-white/30">
              {getBookAuthor(book)}
            </p>
          </motion.button>
        ))}
      </div>

      {books.length > visible.length && (
        <div className="mt-8 flex justify-end gap-2">
          <button
            type="button"
            onClick={previous}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-all hover:bg-indigo-500/10 hover:text-white"
            aria-label="Previous books"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={next}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-all hover:bg-indigo-500/10 hover:text-white"
            aria-label="Next books"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   FINAL CTA
============================================================ */

function FinalCTA({ navigate }) {
  return (
    <section className="relative overflow-hidden bg-[#05060b]">
      <AmbientBackground />

      <div className="relative mx-auto max-w-5xl px-5 py-28 text-center sm:px-8 sm:py-36">
        <Reveal>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.08]">
            <BookOpen className="h-5 w-5 text-indigo-200" />
          </span>

          <p className="mt-8 text-[9px] font-bold uppercase tracking-[0.25em] text-indigo-300">
            Begin your journey
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-5xl font-semibold leading-[0.88] tracking-[-0.075em] text-white sm:text-7xl">
            There is always
            <span className="block bg-gradient-to-r from-indigo-200 via-white to-violet-300 bg-clip-text text-transparent">
              another story.
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-white/30 sm:text-base">
            Your next book, your next idea, your next chapter — it starts with
            Libro.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="group inline-flex h-12 items-center gap-3 rounded-full bg-white px-7 text-[10px] font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
            >
              Create your account
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-7 text-[10px] font-semibold text-white/55 backdrop-blur-xl transition-colors hover:border-indigo-400/20 hover:text-white"
            >
              Sign in
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
============================================================ */

function Footer({ navigate }) {
  return (
    <footer className="border-t border-white/10 bg-[#05060b]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
              <BookOpen className="h-3.5 w-3.5 text-indigo-200" />
            </span>

            <div>
              <p className="text-[10px] font-bold text-white">Libro</p>

              <p className="mt-1 text-[7px] text-white/20">
                Digital library experience
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={() =>
                document.getElementById("discover")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
              className="text-[8px] font-semibold text-white/25 transition-colors hover:text-indigo-300"
            >
              Discover
            </button>

            <button
              type="button"
              onClick={() =>
                document.getElementById("collection")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
              className="text-[8px] font-semibold text-white/25 transition-colors hover:text-indigo-300"
            >
              Collection
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[8px] font-semibold text-white/25 transition-colors hover:text-indigo-300"
            >
              Sign in
            </button>
          </div>
        </div>

        <div className="mt-9 border-t border-white/10 pt-6">
          <p className="text-[7px] text-white/15">
            Libro — A smarter way to experience your university library.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   LANDING PAGE
============================================================ */

export function LandingPage() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [search, setSearch] = useState("");

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

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

        if (mountedRef.current) {
          setBooks(receivedBooks);
        }
      } catch (error) {
        console.error("Landing page books loading failed:", error);

        if (mountedRef.current) {
          setBooks([]);
        }
      } finally {
        if (mountedRef.current) {
          setLoadingBooks(false);
        }
      }
    }

    loadBooks();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const availableBooks = useMemo(() => books.filter(Boolean), [books]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05060b]">
      <main>
        {/* HERO */}

        <Hero
          books={availableBooks}
          navigate={navigate}
          search={search}
          setSearch={setSearch}
        />

        {/* DISCOVER */}

        <DiscoverySection
          books={availableBooks}
          loading={loadingBooks}
          navigate={navigate}
        />

        {/* FOLLOW YOUR CURIOSITY */}

        <SubjectsSection navigate={navigate} />

        {/* EXPERIENCE */}

        <ExperienceSection />

        {/* STUDENT EXPERIENCE */}

        <StudentExperience />

        {/* STATS */}

        <StatsSection />

        {/* COLLECTION */}

        <section id="collection" className="bg-[#070810]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
            <Reveal>
              <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-indigo-300">
                    The collection
                  </p>

                  <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.07em] text-[#F8FAFF] sm:text-6xl">
                    More to
                    <span className="text-[#A7ADBE]"> explore.</span>
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="group inline-flex h-11 w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[9px] font-bold text-white/60 backdrop-blur-xl transition-all hover:border-indigo-400/20 hover:bg-indigo-500/[0.06] hover:text-white"
                >
                  Open full catalogue
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </Reveal>

            {loadingBooks ? (
              <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="aspect-[2/3] animate-pulse rounded-[22px] bg-white/[0.04]"
                  />
                ))}
              </div>
            ) : availableBooks.length > 0 ? (
              <BookShelf books={availableBooks} navigate={navigate} />
            ) : (
              <div className="mt-14 rounded-[28px] border border-white/10 bg-white/[0.03] p-14 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-white/15" />

                <p className="mt-4 text-xs font-bold text-white/50">
                  No books available yet.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}

        <FinalCTA navigate={navigate} />
      </main>

      {/* FOOTER */}

      <Footer navigate={navigate} />
    </div>
  );
}

export default LandingPage;
