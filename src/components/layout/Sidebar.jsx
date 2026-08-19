import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  CalendarClock,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Library,
  LogOut,
  Settings,
  UserRound,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const ease = [0.22, 1, 0.36, 1];

const sidebarItemVariants = {
  hidden: {
    opacity: 0,
    x: -8,
  },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.035,
      duration: 0.35,
      ease,
    },
  }),
};

export function Sidebar() {
  const location = useLocation();
  const { role, user, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const isLibrarian = role === "librarian";

  const studentItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      path: "/student/dashboard",
    },
    {
      label: "Browse Books",
      icon: BookOpen,
      path: "/student/catalog",
    },
    {
      label: "My Loans",
      icon: BookMarked,
      path: "/student/loans",
    },
    {
      label: "Reservations",
      icon: Library,
      path: "/student/reservations",
    },
    {
      label: "Notifications",
      icon: FileText,
      path: "/notifications",
    },
  ];

  const librarianItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      path: "/librarian/dashboard",
    },
    {
      label: "Inventory",
      icon: BookOpen,
      path: "/librarian/inventory",
    },
    {
      label: "Circulation",
      icon: BookMarked,
      path: "/librarian/circulation",
    },
    {
      label: "Students",
      icon: Users,
      path: "/librarian/students",
    },
    {
      label: "Reservations",
      icon: CalendarClock,
      path: "/librarian/reservations",
    },
    {
      label: "Fines",
      icon: CircleDollarSign,
      path: "/librarian/fines",
    },
    {
      label: "Analytics",
      icon: BarChart3,
      path: "/librarian/analytics",
    },
  ];

  const items = isLibrarian ? librarianItems : studentItems;

  const profilePath = isLibrarian ? "/librarian/profile" : "/student/profile";

  const settingsPath = isLibrarian
    ? "/librarian/settings"
    : "/student/settings";

  const dashboardPath = isLibrarian
    ? "/librarian/dashboard"
    : "/student/dashboard";

  const handleLogout = () => {
    logout?.();
  };

  const isItemActive = (path) => {
    if (location.pathname === path) {
      return true;
    }

    if (path === "/student/dashboard" || path === "/librarian/dashboard") {
      return false;
    }

    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden w-[248px] shrink-0 lg:block">
      <div className="sticky top-0 flex h-screen w-[248px] flex-col border-r border-slate-200/70 bg-white/95 backdrop-blur-xl">
        {/* ------------------------------------------------------------- */}
        {/* BRAND */}
        {/* ------------------------------------------------------------- */}

        <motion.div
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
            duration: 0.45,
            ease,
          }}
          className="flex h-[72px] shrink-0 items-center border-b border-slate-100 px-5"
        >
          <NavLink to={dashboardPath} className="group flex items-center gap-3">
            <motion.span
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 1.06,
                      rotate: -2,
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.96,
                    }
              }
              transition={{
                duration: 0.2,
                ease,
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-[13px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-[0_8px_20px_rgba(79,70,229,0.22)]"
            >
              <BookOpen className="h-[18px] w-[18px]" strokeWidth={2} />

              <span className="absolute inset-0 rounded-[13px] bg-white/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </motion.span>

            <div className="min-w-0">
              <span className="block text-[16px] font-bold tracking-[-0.035em] text-slate-950">
                Libro
              </span>

              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Library system
              </span>
            </div>
          </NavLink>
        </motion.div>

        {/* ------------------------------------------------------------- */}
        {/* NAVIGATION */}
        {/* ------------------------------------------------------------- */}

        <div className="flex-1 overflow-y-auto px-3 py-6">
          <motion.div
            initial={
              shouldReduceMotion
                ? false
                : {
                    opacity: 0,
                  }
            }
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 0.4,
              delay: 0.08,
            }}
            className="mb-3 px-3"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.17em] text-slate-400">
              {isLibrarian ? "Management" : "Library"}
            </span>
          </motion.div>

          <nav className="space-y-1" aria-label="Primary navigation">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);

              return (
                <motion.div
                  key={item.path}
                  custom={index}
                  initial={shouldReduceMotion ? false : "hidden"}
                  animate="visible"
                  variants={sidebarItemVariants}
                >
                  <NavLink to={item.path} className="group relative block">
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                        className="absolute inset-0 rounded-[14px] bg-gradient-to-r from-indigo-50 to-violet-50"
                      />
                    )}

                    <motion.div
                      whileHover={
                        shouldReduceMotion
                          ? undefined
                          : {
                              x: 3,
                            }
                      }
                      whileTap={
                        shouldReduceMotion
                          ? undefined
                          : {
                              scale: 0.985,
                            }
                      }
                      transition={{
                        duration: 0.18,
                        ease,
                      }}
                      className={cn(
                        "relative flex min-h-[46px] items-center gap-3 rounded-[14px] px-3",
                        "text-sm font-medium",
                        "transition-colors duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                        isActive
                          ? "text-indigo-700"
                          : "text-slate-500 hover:text-slate-900",
                      )}
                    >
                      <motion.span
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : {
                                scale: isActive ? 1 : 0.96,
                              }
                        }
                        whileHover={
                          shouldReduceMotion
                            ? undefined
                            : {
                                scale: 1.08,
                              }
                        }
                        transition={{
                          duration: 0.2,
                          ease,
                        }}
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          "transition-all duration-200",
                          isActive
                            ? "bg-white text-indigo-600 shadow-[0_3px_10px_rgba(79,70,229,0.10)]"
                            : "text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm",
                        )}
                      >
                        <Icon
                          className="h-[17px] w-[17px]"
                          strokeWidth={isActive ? 2.15 : 1.8}
                          aria-hidden="true"
                        />
                      </motion.span>

                      <span className="relative z-10 truncate">
                        {item.label}
                      </span>

                      {isActive && (
                        <motion.span
                          layoutId="sidebar-dot"
                          transition={{
                            type: "spring",
                            stiffness: 450,
                            damping: 30,
                          }}
                          className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600 shadow-[0_0_0_3px_rgba(99,102,241,0.10)]"
                        />
                      )}
                    </motion.div>
                  </NavLink>
                </motion.div>
              );
            })}
          </nav>

          {/* ----------------------------------------------------------- */}
          {/* DIVIDER */}
          {/* ----------------------------------------------------------- */}

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* ----------------------------------------------------------- */}
          {/* ACCOUNT */}
          {/* ----------------------------------------------------------- */}

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
              duration: 0.4,
              delay: 0.3,
              ease,
            }}
          >
            <div className="mb-3 px-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.17em] text-slate-400">
                Account
              </span>
            </div>

            <nav className="space-y-1">
              <AccountNavItem
                to={profilePath}
                icon={UserRound}
                label="Profile"
                active={location.pathname === profilePath}
                shouldReduceMotion={shouldReduceMotion}
              />

              <AccountNavItem
                to={settingsPath}
                icon={Settings}
                label="Settings"
                active={location.pathname === settingsPath}
                shouldReduceMotion={shouldReduceMotion}
              />
            </nav>
          </motion.div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* USER CARD */}
        {/* ------------------------------------------------------------- */}

        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 10,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            delay: 0.35,
            ease,
          }}
          className="shrink-0 border-t border-slate-100 p-3"
        >
          <motion.div
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    y: -1,
                  }
            }
            transition={{
              duration: 0.2,
              ease,
            }}
            className="group relative overflow-hidden rounded-[16px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-bold text-indigo-700 ring-4 ring-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}

                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {user?.name || "User"}
                </p>

                <p className="mt-0.5 truncate text-[10px] font-medium capitalize text-slate-400">
                  {role || "Member"}
                </p>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-100/30 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
          </motion.div>

          <motion.button
            type="button"
            onClick={handleLogout}
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    x: 3,
                  }
            }
            whileTap={
              shouldReduceMotion
                ? undefined
                : {
                    scale: 0.98,
                  }
            }
            transition={{
              duration: 0.18,
              ease,
            }}
            className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg">
              <LogOut className="h-[17px] w-[17px]" strokeWidth={1.8} />
            </span>

            <span>Sign out</span>
          </motion.button>
        </motion.div>
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* ACCOUNT NAV ITEM */
/* -------------------------------------------------------------------------- */

function AccountNavItem({ to, icon: Icon, label, active, shouldReduceMotion }) {
  return (
    <NavLink to={to} className="group relative block">
      {active && (
        <motion.span
          layoutId="sidebar-account-active"
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 32,
          }}
          className="absolute inset-0 rounded-[14px] bg-gradient-to-r from-indigo-50 to-violet-50"
        />
      )}

      <motion.div
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                x: 3,
              }
        }
        whileTap={
          shouldReduceMotion
            ? undefined
            : {
                scale: 0.985,
              }
        }
        className={cn(
          "relative flex min-h-[46px] items-center gap-3 rounded-[14px] px-3",
          "text-sm font-medium transition-colors duration-200",
          active ? "text-indigo-700" : "text-slate-500 hover:text-slate-900",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
            active
              ? "bg-white text-indigo-600 shadow-[0_3px_10px_rgba(79,70,229,0.10)]"
              : "text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm",
          )}
        >
          <Icon
            className="h-[17px] w-[17px]"
            strokeWidth={active ? 2.15 : 1.8}
          />
        </span>

        <span>{label}</span>

        {active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600 shadow-[0_0_0_3px_rgba(99,102,241,0.10)]" />
        )}
      </motion.div>
    </NavLink>
  );
}
