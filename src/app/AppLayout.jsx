import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { CommandPalette } from '@/components/common/CommandPalette';

export function AppLayout() {
  const location = useLocation();

  const isStudentArea =
    location.pathname.startsWith('/student');

  const isLibrarianArea =
    location.pathname.startsWith('/librarian');

  const isSharedAppArea =
    location.pathname.startsWith('/notifications') ||
    location.pathname.startsWith('/settings');

  const isAppArea =
    isStudentArea ||
    isLibrarianArea ||
    isSharedAppArea;

  return (
    <div
      className={[
        'min-h-screen min-w-0',
        'bg-slate-50 text-slate-950',
        'antialiased',
        'selection:bg-indigo-100',
        'selection:text-indigo-900',
      ].join(' ')}
    >
      <Navbar />

      <div
        className={[
          'flex min-h-[calc(100vh-4rem)]',
          'min-w-0',
          'lg:min-h-[calc(100vh-4.5rem)]',
        ].join(' ')}
      >
        {isAppArea && <Sidebar />}

        <main
          className={[
            'min-w-0 flex-1',
            'pb-20 lg:pb-0',
          ].join(' ')}
        >
          <div
            className={[
              'libro-container',
              'min-w-0',
              'px-4 py-5',
              'sm:px-6 sm:py-6',
              'lg:px-8 lg:py-8',
            ].join(' ')}
          >
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
      <CommandPalette />
    </div>
  );
}