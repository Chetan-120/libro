import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Menu,
  Search,
  Settings,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  const isAppArea =
    location.pathname.startsWith('/student') ||
    location.pathname.startsWith('/librarian') ||
    location.pathname.startsWith('/notifications') ||
    location.pathname.startsWith('/settings');

  const isLanding = location.pathname === '/';

  const isLibrarian = role === 'librarian';

  const dashboardPath = isLibrarian
    ? '/librarian/dashboard'
    : '/student/dashboard';

  const profilePath = isLibrarian
    ? '/librarian/profile'
    : '/student/profile';

  const settingsPath = isLibrarian
    ? '/librarian/settings'
    : '/student/settings';

  const handleLogout = () => {
    logout?.();
    setMobileOpen(false);
    navigate('/');
  };

  const openSearch = () => {
    window.dispatchEvent(new Event('libro:open-search'));
  };

  if (isAppArea) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link
            to={dashboardPath}
            className="flex min-w-0 items-center gap-2.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.18)]">
              <BookOpen
                className="h-4 w-4"
                aria-hidden="true"
              />
            </span>

            <span className="text-base font-bold tracking-[-0.025em] text-slate-950">
              Libro
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Search"
              onClick={openSearch}
            >
              <Search
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Notifications"
              onClick={() => navigate('/notifications')}
            >
              <Bell
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              />

              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-indigo-600 ring-2 ring-white" />
            </button>

            <button
              type="button"
              onClick={() => navigate(profilePath)}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              aria-label="Profile"
            >
              {user?.name?.charAt(0)?.toUpperCase() || (
                <User
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl',
        isLanding &&
          'supports-[backdrop-filter]:bg-white/75'
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-[72px] lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5"
          aria-label="Libro home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.18)]">
            <BookOpen
              className="h-4 w-4"
              aria-hidden="true"
            />
          </span>

          <span className="text-[17px] font-bold tracking-[-0.03em] text-slate-950">
            Libro
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-7 lg:flex">
          <Link
            to="/"
            className={cn(
              'text-sm font-medium transition-colors',
              location.pathname === '/'
                ? 'text-slate-950'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            Home
          </Link>

          <a
            href="/#features"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            Features
          </a>

          <a
            href="/#how-it-works"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            How it works
          </a>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {user ? (
            <>
              <button
                type="button"
                onClick={openSearch}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              <Link
                to="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />

                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-indigo-600 ring-2 ring-white" />
              </Link>

              <Link
                to={settingsPath}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Sign out
              </button>

              <Link
                to={dashboardPath}
                className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition-all hover:bg-indigo-700 hover:shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
              >
                <User
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition-all hover:bg-indigo-700 hover:shadow-[0_4px_12px_rgba(79,70,229,0.2)]"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() =>
            setMobileOpen((value) => !value)
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 lg:hidden"
          aria-label={
            mobileOpen ? 'Close menu' : 'Open menu'
          }
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X
              className="h-5 w-5"
              aria-hidden="true"
            />
          ) : (
            <Menu
              className="h-5 w-5"
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Home
            </Link>

            <a
              href="/#features"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Features
            </a>

            <a
              href="/#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              How it works
            </a>
          </nav>

          <div className="mt-3 border-t border-slate-100 pt-3">
            {user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white"
                >
                  Dashboard
                </Link>

                <Link
                  to={profilePath}
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>

                <Link
                  to="/notifications"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                </Link>

                <Link
                  to={settingsPath}
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="col-span-2 h-11 rounded-xl border border-rose-100 bg-rose-50 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}