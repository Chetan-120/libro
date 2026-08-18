import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  BookMarked,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Library,
  LogOut,
  Settings,
  UserRound,
  Users,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function Sidebar() {
  const location = useLocation();
  const { role, user, logout } = useAuth();

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

  const handleLogout = () => {
    logout?.();
  };

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-0 flex h-screen w-60 flex-col border-r border-slate-200/70 bg-white">
        {/* Brand */}
        <div className="flex h-[72px] shrink-0 items-center border-b border-slate-100 px-5">
          <NavLink
            to={isLibrarian ? "/librarian/dashboard" : "/student/dashboard"}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.16)]">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <span className="block text-[16px] font-bold tracking-[-0.03em] text-slate-950">
                Libro
              </span>

              <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                Library system
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-3 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {isLibrarian ? "Management" : "Library"}
            </span>
          </div>

          <nav className="space-y-1" aria-label="Primary navigation">
            {items.map((item) => {
              const Icon = item.icon;

              const isActive =
                location.pathname === item.path ||
                (item.path !== "/student/dashboard" &&
                  item.path !== "/librarian/dashboard" &&
                  location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-xl px-3",
                    "text-sm font-medium transition-all duration-150",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-white text-indigo-600 shadow-[0_1px_3px_rgba(79,70,229,0.08)]"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                  >
                    <Icon
                      className="h-[17px] w-[17px]"
                      strokeWidth={isActive ? 2.2 : 1.8}
                      aria-hidden="true"
                    />
                  </span>

                  <span className="truncate">{item.label}</span>

                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="my-5 h-px bg-slate-100" />

          {/* Account */}
          <div className="mb-3 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Account
            </span>
          </div>

          <nav className="space-y-1">
            {/* Profile */}
            <NavLink
              to={profilePath}
              className={({ isActive }) =>
                cn(
                  "group flex min-h-11 items-center gap-3 rounded-xl px-3",
                  "text-sm font-medium transition-all duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-white text-indigo-600 shadow-[0_1px_3px_rgba(79,70,229,0.08)]"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                  >
                    <UserRound
                      className="h-[17px] w-[17px]"
                      strokeWidth={isActive ? 2.2 : 1.8}
                      aria-hidden="true"
                    />
                  </span>

                  <span>Profile</span>

                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  )}
                </>
              )}
            </NavLink>

            {/* Settings */}
            <NavLink
              to={settingsPath}
              className={({ isActive }) =>
                cn(
                  "group flex min-h-11 items-center gap-3 rounded-xl px-3",
                  "text-sm font-medium transition-all duration-150",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-white text-indigo-600 shadow-[0_1px_3px_rgba(79,70,229,0.08)]"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                  >
                    <Settings
                      className="h-[17px] w-[17px]"
                      strokeWidth={isActive ? 2.2 : 1.8}
                      aria-hidden="true"
                    />
                  </span>

                  <span>Settings</span>

                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  )}
                </>
              )}
            </NavLink>
          </nav>
        </div>

        {/* User / Logout */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.name || "User"}
              </p>

              <p className="truncate text-[11px] capitalize text-slate-400">
                {role || "Member"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg">
              <LogOut
                className="h-[17px] w-[17px]"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </span>
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
