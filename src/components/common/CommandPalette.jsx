import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  CircleDollarSign,
  Command,
  FileText,
  LayoutDashboard,
  Library,
  Search,
  Settings,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const commands = [
  {
    label: 'Student dashboard',
    description: 'Open your library overview',
    icon: LayoutDashboard,
    path: '/student/dashboard',
    role: 'student',
  },
  {
    label: 'Browse books',
    description: 'Search the library catalogue',
    icon: BookOpen,
    path: '/student/catalog',
    role: 'student',
  },
  {
    label: 'My loans',
    description: 'View your borrowed books',
    icon: BookMarked,
    path: '/student/loans',
    role: 'student',
  },
  {
    label: 'Reservations',
    description: 'Manage your reserved books',
    icon: Library,
    path: '/student/reservations',
    role: 'student',
  },
  {
    label: 'Notifications',
    description: 'View your latest library updates',
    icon: Bell,
    path: '/notifications',
    role: 'shared',
  },
  {
    label: 'Student profile',
    description: 'Manage your personal information',
    icon: UserRound,
    path: '/student/profile',
    role: 'student',
  },
  {
    label: 'Student settings',
    description: 'Manage your account preferences',
    icon: Settings,
    path: '/student/settings',
    role: 'student',
  },
  {
    label: 'Librarian dashboard',
    description: 'Open the library management overview',
    icon: LayoutDashboard,
    path: '/librarian/dashboard',
    role: 'librarian',
  },
  {
    label: 'Inventory',
    description: 'Manage the library book inventory',
    icon: BookOpen,
    path: '/librarian/inventory',
    role: 'librarian',
  },
  {
    label: 'Circulation',
    description: 'Manage book issues and returns',
    icon: BookMarked,
    path: '/librarian/circulation',
    role: 'librarian',
  },
  {
    label: 'Students',
    description: 'View and manage student records',
    icon: Users,
    path: '/librarian/students',
    role: 'librarian',
  },
  {
    label: 'Fines',
    description: 'Manage outstanding library fines',
    icon: CircleDollarSign,
    path: '/librarian/fines',
    role: 'librarian',
  },
  {
    label: 'Analytics',
    description: 'View library performance analytics',
    icon: BarChart3,
    path: '/librarian/analytics',
    role: 'librarian',
  },
  {
    label: 'Librarian profile',
    description: 'Manage your librarian profile',
    icon: UserRound,
    path: '/librarian/profile',
    role: 'librarian',
  },
  {
    label: 'Librarian settings',
    description: 'Manage library account preferences',
    icon: Settings,
    path: '/librarian/settings',
    role: 'librarian',
  },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  const { role } = useAuth();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const isLibrarian = role === 'librarian';

  useEffect(() => {
    const handleOpen = () => setOpen(true);

    window.addEventListener(
      'libro:open-search',
      handleOpen
    );

    return () => {
      window.removeEventListener(
        'libro:open-search',
        handleOpen
      );
    };
  }, []);

  useEffect(() => {
    const handleKeyboard = (event) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();
        setOpen((value) => !value);
      }

      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyboard
      );
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (!open) return null;

  const availableCommands = commands.filter((command) => {
    if (command.role === 'shared') return true;

    if (isLibrarian) {
      return command.role === 'librarian';
    }

    return command.role === 'student';
  });

  const filteredCommands = availableCommands.filter(
    (command) =>
      command.label
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      command.description
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-950/35 px-4 pt-[10vh] backdrop-blur-[3px] sm:pt-[15vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
    >
      <div
        className={[
          'w-full max-w-xl overflow-hidden',
          'rounded-2xl border border-slate-200/80',
          'bg-white',
          'shadow-[0_24px_80px_rgba(15,23,42,0.18)]',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search
            className="h-5 w-5 shrink-0 text-slate-400"
            aria-hidden="true"
          />

          <input
            ref={inputRef}
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search Libro..."
            className="h-14 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />

          <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-400 sm:flex">
            <Command className="h-3 w-3" />
            K
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            <div className="space-y-1">
              {filteredCommands.map((command) => {
                const Icon = command.icon;

                const isCurrent =
                  location.pathname === command.path;

                return (
                  <button
                    key={command.path}
                    type="button"
                    onClick={() =>
                      handleNavigate(command.path)
                    }
                    className={cn(
                      'group flex w-full items-center gap-3',
                      'rounded-xl px-3 py-3 text-left',
                      'transition-all duration-150',
                      isCurrent
                        ? 'bg-indigo-50'
                        : 'hover:bg-indigo-50',
                      'focus:bg-indigo-50 focus:outline-none'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                        isCurrent
                          ? 'bg-white text-indigo-600 shadow-[0_1px_3px_rgba(79,70,229,0.08)]'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-600'
                      )}
                    >
                      <Icon
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="block truncate text-sm font-semibold text-slate-800">
                          {command.label}
                        </span>

                        {isCurrent && (
                          <span className="shrink-0 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[7px] font-bold text-indigo-600">
                            Current
                          </span>
                        )}
                      </span>

                      <span className="mt-0.5 block truncate text-xs text-slate-400">
                        {command.description}
                      </span>
                    </span>

                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Search className="h-4 w-4" />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-800">
                No results found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try searching for a different page.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3">
          <p className="text-[10px] font-medium text-slate-400">
            Search pages and quickly navigate around Libro.
          </p>

          <span className="hidden text-[10px] font-medium text-slate-400 sm:block">
            Press{' '}
            <span className="font-semibold text-slate-500">
              Esc
            </span>{' '}
            to close
          </span>
        </div>
      </div>
    </div>
  );
}