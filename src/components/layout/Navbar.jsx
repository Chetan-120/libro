import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  ChevronRight,
  Menu,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const ease = [0.22, 1, 0.36, 1];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [mobileOpen, setMobileOpen] = useState(false);

  const isAppArea =
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/librarian") ||
    location.pathname.startsWith("/notifications") ||
    location.pathname.startsWith("/settings");

  const isLanding = location.pathname === "/";
  const isLibrarian = role === "librarian";

  const dashboardPath = isLibrarian
    ? "/librarian/dashboard"
    : "/student/dashboard";

  const profilePath = isLibrarian ? "/librarian/profile" : "/student/profile";

  const settingsPath = isLibrarian
    ? "/librarian/settings"
    : "/student/settings";

  const handleLogout = () => {
    logout?.();
    setMobileOpen(false);
    navigate("/");
  };

  const openSearch = () => {
    window.dispatchEvent(new Event("libro:open-search"));
  };

  /* ---------------------------------------------------------------------- */
  /* MOBILE APP HEADER                                                      */
  /* ---------------------------------------------------------------------- */

  if (isAppArea) {
    return (
      <motion.header
        initial={
          shouldReduceMotion
            ? false
            : {
                opacity: 0,
                y: -8,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
          ease,
        }}
        className={[
          "sticky top-0 z-40 lg:hidden",
          "border-b border-slate-200/70",
          "bg-white/88 backdrop-blur-2xl",
          "supports-[backdrop-filter]:bg-white/75",
        ].join(" ")}
      >
        <div className="flex h-[64px] items-center justify-between px-4">
          {/* Logo */}

          <Link
            to={dashboardPath}
            className="group flex min-w-0 items-center gap-2.5"
          >
            <motion.span
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 1.05,
                      rotate: -2,
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.95,
                    }
              }
              transition={{
                duration: 0.18,
                ease,
              }}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-[0_5px_16px_rgba(79,70,229,0.20)]"
            >
              <BookOpen
                className="relative z-10 h-[16px] w-[16px]"
                strokeWidth={2}
              />

              <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </motion.span>

            <div className="min-w-0">
              <span className="block text-[16px] font-bold tracking-[-0.035em] text-slate-950">
                Libro
              </span>

              <span className="hidden text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-400 min-[380px]:block">
                Library
              </span>
            </div>
          </Link>

          {/* Actions */}

          <div className="flex items-center gap-1">
            <IconButton
              label="Search"
              onClick={openSearch}
              shouldReduceMotion={shouldReduceMotion}
            >
              <Search className="h-[18px] w-[18px]" />
            </IconButton>

            <motion.button
              type="button"
              onClick={() => navigate("/notifications")}
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.91,
                    }
              }
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Notifications"
            >
              <motion.span
                animate={
                  shouldReduceMotion
                    ? undefined
                    : {
                        rotate: [0, -7, 7, -4, 0],
                      }
                }
                transition={{
                  duration: 0.55,
                  delay: 1.2,
                  ease,
                }}
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </motion.span>

              <span className="absolute right-[9px] top-[8px] h-1.5 w-1.5 rounded-full bg-indigo-600 ring-2 ring-white" />
            </motion.button>

            <motion.button
              type="button"
              onClick={() => navigate(profilePath)}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 1.04,
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.94,
                    }
              }
              transition={{
                duration: 0.18,
                ease,
              }}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              aria-label="Profile"
            >
              {user?.name?.charAt(0)?.toUpperCase() || (
                <User className="h-4 w-4" aria-hidden="true" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* PUBLIC / DESKTOP HEADER                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-slate-200/70",
        "bg-white/88 backdrop-blur-2xl",
        "supports-[backdrop-filter]:bg-white/75",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8">
        {/* Logo */}

        <Link
          to="/"
          className="group flex items-center gap-2.5"
          aria-label="Libro home"
        >
          <motion.span
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    scale: 1.05,
                    rotate: -2,
                  }
            }
            whileTap={
              shouldReduceMotion
                ? undefined
                : {
                    scale: 0.95,
                  }
            }
            transition={{
              duration: 0.18,
              ease,
            }}
            className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-[0_5px_16px_rgba(79,70,229,0.20)]"
          >
            <BookOpen
              className="relative z-10 h-[16px] w-[16px]"
              strokeWidth={2}
            />

            <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </motion.span>

          <span className="text-[17px] font-bold tracking-[-0.035em] text-slate-950">
            Libro
          </span>
        </Link>

        {/* Desktop Navigation */}

        <nav className="hidden items-center gap-7 lg:flex">
          <NavItem
            to="/"
            label="Home"
            active={location.pathname === "/"}
            shouldReduceMotion={shouldReduceMotion}
          />

          <AnchorNavItem
            href="/#features"
            label="Features"
            shouldReduceMotion={shouldReduceMotion}
          />

          <AnchorNavItem
            href="/#how-it-works"
            label="How it works"
            shouldReduceMotion={shouldReduceMotion}
          />
        </nav>

        {/* Desktop Actions */}

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <IconButton
                label="Search"
                onClick={openSearch}
                shouldReduceMotion={shouldReduceMotion}
              >
                <Search className="h-[17px] w-[17px]" />
              </IconButton>

              <Link
                to="/notifications"
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Notifications"
              >
                <motion.span
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: 1.08,
                        }
                  }
                >
                  <Bell className="h-[17px] w-[17px]" strokeWidth={1.9} />
                </motion.span>

                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-indigo-600 ring-2 ring-white" />
              </Link>

              <Link
                to={settingsPath}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Settings"
              >
                <motion.span
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          rotate: 25,
                        }
                  }
                  transition={{
                    duration: 0.2,
                    ease,
                  }}
                >
                  <Settings className="h-[17px] w-[17px]" strokeWidth={1.9} />
                </motion.span>
              </Link>

              <motion.button
                type="button"
                onClick={handleLogout}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -1,
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 0.97,
                      }
                }
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Sign out
              </motion.button>

              <motion.div
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -1,
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 0.98,
                      }
                }
              >
                <Link
                  to={dashboardPath}
                  className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(79,70,229,0.16)] transition-all hover:from-indigo-700 hover:to-indigo-600 hover:shadow-[0_8px_22px_rgba(79,70,229,0.22)]"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Dashboard
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </Link>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -1,
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 0.98,
                      }
                }
              >
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                >
                  Sign in
                </Link>
              </motion.div>

              <motion.div
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -1,
                      }
                }
                whileTap={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 0.98,
                      }
                }
              >
                <Link
                  to="/register"
                  className="flex h-10 items-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 text-sm font-semibold text-white shadow-[0_5px_16px_rgba(79,70,229,0.16)] transition-all hover:from-indigo-700 hover:to-indigo-600 hover:shadow-[0_8px_22px_rgba(79,70,229,0.22)]"
                >
                  Get started
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile menu button */}

        <motion.button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          whileTap={
            shouldReduceMotion
              ? undefined
              : {
                  scale: 0.9,
                }
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileOpen ? (
              <motion.span
                key="close"
                initial={
                  shouldReduceMotion
                    ? false
                    : {
                        opacity: 0,
                        rotate: -45,
                        scale: 0.8,
                      }
                }
                animate={{
                  opacity: 1,
                  rotate: 0,
                  scale: 1,
                }}
                exit={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 0,
                        rotate: 45,
                        scale: 0.8,
                      }
                }
              >
                <X className="h-5 w-5" />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={
                  shouldReduceMotion
                    ? false
                    : {
                        opacity: 0,
                        rotate: 45,
                        scale: 0.8,
                      }
                }
                animate={{
                  opacity: 1,
                  rotate: 0,
                  scale: 1,
                }}
                exit={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 0,
                        rotate: -45,
                        scale: 0.8,
                      }
                }
              >
                <Menu className="h-5 w-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* MOBILE MENU                                                      */}
      {/* ---------------------------------------------------------------- */}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={
              shouldReduceMotion
                ? false
                : {
                    height: 0,
                    opacity: 0,
                  }
            }
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={
              shouldReduceMotion
                ? undefined
                : {
                    height: 0,
                    opacity: 0,
                  }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.28,
              ease,
            }}
            className="overflow-hidden border-t border-slate-100 bg-white lg:hidden"
          >
            <div className="px-4 py-4">
              <motion.nav
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.045,
                    },
                  },
                }}
                className="flex flex-col gap-1"
              >
                <MobileMenuLink
                  to="/"
                  label="Home"
                  onClick={() => setMobileOpen(false)}
                  shouldReduceMotion={shouldReduceMotion}
                />

                <MobileMenuAnchor
                  href="/#features"
                  label="Features"
                  onClick={() => setMobileOpen(false)}
                  shouldReduceMotion={shouldReduceMotion}
                />

                <MobileMenuAnchor
                  href="/#how-it-works"
                  label="How it works"
                  onClick={() => setMobileOpen(false)}
                  shouldReduceMotion={shouldReduceMotion}
                />
              </motion.nav>

              <div className="my-4 h-px bg-slate-100" />

              {user ? (
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 8,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.12,
                    duration: 0.3,
                    ease,
                  }}
                  className="grid grid-cols-2 gap-2"
                >
                  <MobileAction
                    to={dashboardPath}
                    label="Dashboard"
                    primary
                    onClick={() => setMobileOpen(false)}
                  />

                  <MobileAction
                    to={profilePath}
                    label="Profile"
                    icon={User}
                    onClick={() => setMobileOpen(false)}
                  />

                  <MobileAction
                    to="/notifications"
                    label="Notifications"
                    icon={Bell}
                    onClick={() => setMobileOpen(false)}
                  />

                  <MobileAction
                    to={settingsPath}
                    label="Settings"
                    icon={Settings}
                    onClick={() => setMobileOpen(false)}
                  />

                  <motion.button
                    type="button"
                    onClick={handleLogout}
                    whileTap={
                      shouldReduceMotion
                        ? undefined
                        : {
                            scale: 0.98,
                          }
                    }
                    className="col-span-2 h-11 rounded-xl border border-rose-100 bg-rose-50 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100"
                  >
                    Sign out
                  </motion.button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <MobileAction
                    to="/login"
                    label="Sign in"
                    onClick={() => setMobileOpen(false)}
                  />

                  <MobileAction
                    to="/register"
                    label="Get started"
                    primary
                    onClick={() => setMobileOpen(false)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* SMALL COMPONENTS                                                          */
/* -------------------------------------------------------------------------- */

function IconButton({ children, label, onClick, shouldReduceMotion }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              scale: 1.04,
            }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : {
              scale: 0.9,
            }
      }
      transition={{
        duration: 0.18,
        ease,
      }}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      aria-label={label}
    >
      {children}
    </motion.button>
  );
}

function NavItem({ to, label, active, shouldReduceMotion }) {
  return (
    <Link to={to} className="relative py-2 text-sm font-medium">
      <span
        className={cn(
          "transition-colors",
          active ? "text-slate-950" : "text-slate-500 hover:text-slate-900",
        )}
      >
        {label}
      </span>

      {active && (
        <motion.span
          layoutId="public-nav-active"
          className="absolute -bottom-[9px] left-0 right-0 h-0.5 rounded-full bg-indigo-600"
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 32,
          }}
        />
      )}
    </Link>
  );
}

function AnchorNavItem({ href, label }) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
    >
      {label}
    </a>
  );
}

function MobileMenuLink({ to, label, onClick }) {
  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          x: -8,
        },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: 0.25,
            ease,
          },
        },
      }}
    >
      <Link
        to={to}
        onClick={onClick}
        className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
      >
        {label}
      </Link>
    </motion.div>
  );
}

function MobileMenuAnchor({ href, label, onClick }) {
  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          x: -8,
        },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: 0.25,
            ease,
          },
        },
      }}
    >
      <a
        href={href}
        onClick={onClick}
        className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
      >
        {label}
      </a>
    </motion.div>
  );
}

function MobileAction({ to, label, icon: Icon, primary = false, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all",
        primary
          ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_5px_16px_rgba(79,70,229,0.15)]"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Link>
  );
}
