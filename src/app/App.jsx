import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from '@/routes';

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow:
              '0 12px 32px rgba(15, 23, 42, 0.14)',
          },
        }}
      />
    </BrowserRouter>
  );
}