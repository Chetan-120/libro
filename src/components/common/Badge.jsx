import React from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  children,
  variant = 'neutral',
  className,
  size = 'md',
  dot = false,
}) {
  const variants = {
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-rose-50 text-rose-700 border-rose-100',
    dark: 'bg-slate-900 text-white border-slate-900',
  };

  const dotColors = {
    neutral: 'bg-slate-400',
    primary: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    dark: 'bg-white',
  };

  const sizes = {
    sm: 'min-h-6 px-2 text-[10px] rounded-md',
    md: 'min-h-7 px-2.5 text-[11px] rounded-lg',
    lg: 'min-h-8 px-3 text-xs rounded-lg',
  };

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center justify-center gap-1.5',
        'border font-semibold leading-none',
        'tracking-[-0.005em]',
        'transition-colors',
        variants[variant] || variants.neutral,
        sizes[size] || sizes.md,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            dotColors[variant] || dotColors.neutral
          )}
          aria-hidden="true"
        />
      )}

      {children}
    </span>
  );
}