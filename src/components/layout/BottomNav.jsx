import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { Bell, BookMarked, BookOpen, Home, User, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const ease = [0.22, 1, 0.36, 1];

export function BottomNav() {
  const location = useLocation();
  const { role } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const isAppArea =
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/librarian") ||
    location.pathname.startsWith("/notifications") ||
    location.pathname.startsWith("/settings");

  if (!isAppArea) return null;

  const isLibrarian = role === "librarian";

  const items = isLibrarian
    ? [
        {
          label: "Home",
          icon: Home,
          path: "/librarian/dashboard",
        },
        {
          label: "Books",
          icon: BookOpen,
          path: "/librarian/inventory",
        },
        {
          label: "Students",
          icon: Users,
          path: "/librarian/students",
        },
        {
          label: "Fines",
          icon: Bell,
          path: "/librarian/fines",
        },
      ]
    : [
        {
          label: "Home",
          icon: Home,
          path: "/student/dashboard",
        },
        {
          label: "Browse",
          icon: BookOpen,
          path: "/student/catalog",
        },
        {
          label: "My Books",
          icon: BookMarked,
          path: "/student/loans",
        },
        {
          label: "Profile",
          icon: User,
          path: "/student/profile",
        },
      ];

  const isItemActive = (path) => {
    if (location.pathname === path) return true;

    if (path === "/student/dashboard" || path === "/librarian/dashboard") {
      return false;
    }

    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={[
        "fixed inset-x-0 bottom-0 z-50 lg:hidden",
        "border-t border-slate-200/70",
        "bg-white/88 backdrop-blur-2xl",
        "pb-[env(safe-area-inset-bottom)]",
        "shadow-[0_-12px_35px_rgba(15,23,42,0.08)]",
      ].join(" ")}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid h-[68px] max-w-lg grid-cols-4 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex min-w-0 items-center justify-center"
            >
              <motion.div
                className="relative flex h-14 w-full max-w-[82px] flex-col items-center justify-center gap-1 rounded-2xl"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                transition={{
                  duration: 0.18,
                  ease,
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-1 rounded-2xl bg-indigo-50"
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 30,
                    }}
                  />
                )}

                <motion.span
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-xl",
                    isActive ? "text-indigo-600" : "text-slate-400",
                  )}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: isActive ? 1 : 0.96,
                        }
                  }
                  transition={{
                    duration: 0.22,
                    ease,
                  }}
                >
                  <Icon
                    className="h-[19px] w-[19px]"
                    strokeWidth={isActive ? 2.25 : 1.8}
                  />

                  {isActive && (
                    <motion.span
                      layoutId="mobile-nav-dot"
                      className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-indigo-600 ring-2 ring-indigo-50"
                    />
                  )}
                </motion.span>

                <span
                  className={cn(
                    "relative z-10 max-w-full truncate px-1 text-[10px] font-semibold",
                    isActive ? "text-indigo-700" : "text-slate-400",
                  )}
                >
                  {item.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
