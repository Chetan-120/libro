import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Home,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function BottomNav() {
  const location = useLocation();
  const { role } = useAuth();

  const isAppArea =
    location.pathname.startsWith('/student') ||
    location.pathname.startsWith('/librarian') ||
    location.pathname.startsWith('/notifications') ||
    location.pathname.startsWith('/settings');

  if (!isAppArea) return null;

  const isLibrarian = role === 'librarian';

  const items = isLibrarian
    ? [
        {
          label: 'Home',
          icon: Home,
          path: '/librarian/dashboard',
        },
        {
          label: 'Books',
          icon: BookOpen,
          path: '/librarian/inventory',
        },
        {
          label: 'Students',
          icon: Users,
          path: '/librarian/students',
        },
        {
          label: 'Fines',
          icon: Bell,
          path: '/librarian/fines',
        },
      ]
    : [
        {
          label: 'Home',
          icon: Home,
          path: '/student/dashboard',
        },
        {
          label: 'Browse',
          icon: BookOpen,
          path: '/student/catalog',
        },
        {
          label: 'My Books',
          icon: BookMarked,
          path: '/student/loans',
        },
        {
          label: 'Profile',
          icon: User,
          path: '/student/profile',
        },
      ];

  return (
    <nav
      className={[
        'fixed inset-x-0 bottom-0 z-50 lg:hidden',
        'border-t border-slate-200/80',
        'bg-white/95 backdrop-blur-xl',
        'pb-[env(safe-area-inset-bottom)]',
        'shadow-[0_-8px_24px_rgba(15,23,42,0.06)]',
      ].join(' ')}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4 px-2">
        {items.map((item) => {
          const Icon = item.icon;

          const isActive =
            location.pathname === item.path ||
            (item.path !== '/student/dashboard' &&
              item.path !== '/librarian/dashboard' &&
              location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex min-w-0 flex-col items-center justify-center gap-1',
                'rounded-xl px-1 text-[10px] font-medium',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                isActive
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-700'
              )}
            >
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-indigo-600" />
              )}

              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl',
                  'transition-colors duration-150',
                  isActive
                    ? 'bg-indigo-50'
                    : 'bg-transparent'
                )}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  strokeWidth={isActive ? 2.2 : 1.8}
                  aria-hidden="true"
                />
              </span>

              <span className="max-w-full truncate">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}