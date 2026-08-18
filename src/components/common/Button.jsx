import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Button = React.forwardRef(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center',
      'select-none whitespace-nowrap',
      'font-semibold tracking-[-0.01em]',
      'rounded-xl',
      'transition-all duration-200 ease-out',
      'focus:outline-none focus-visible:ring-4',
      'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
      'active:scale-[0.98]',
    ].join(' ');

    const variants = {
      primary: [
        'bg-indigo-600 text-white',
        'border border-indigo-600',
        'shadow-[0_4px_12px_rgba(79,70,229,0.14)]',
        'hover:-translate-y-px hover:bg-indigo-700',
        'hover:shadow-[0_8px_20px_rgba(79,70,229,0.20)]',
        'focus-visible:ring-indigo-500/15',
      ].join(' '),

      secondary: [
        'bg-indigo-50 text-indigo-700',
        'border border-indigo-100',
        'hover:bg-indigo-100 hover:border-indigo-200',
        'focus-visible:ring-indigo-500/10',
      ].join(' '),

      outline: [
        'bg-white text-slate-700',
        'border border-slate-200',
        'shadow-[0_1px_2px_rgba(15,23,42,0.03)]',
        'hover:border-slate-300 hover:bg-slate-50',
        'hover:text-slate-950',
        'focus-visible:ring-indigo-500/10',
      ].join(' '),

      ghost: [
        'bg-transparent text-slate-600',
        'hover:bg-slate-100 hover:text-slate-950',
        'focus-visible:ring-indigo-500/10',
      ].join(' '),

      dark: [
        'bg-slate-950 text-white',
        'border border-slate-950',
        'shadow-[0_4px_12px_rgba(15,23,42,0.12)]',
        'hover:-translate-y-px hover:bg-slate-800',
        'hover:shadow-[0_8px_20px_rgba(15,23,42,0.16)]',
        'focus-visible:ring-slate-900/10',
      ].join(' '),

      danger: [
        'bg-rose-600 text-white',
        'border border-rose-600',
        'shadow-[0_4px_12px_rgba(225,29,72,0.12)]',
        'hover:bg-rose-700',
        'focus-visible:ring-rose-500/15',
      ].join(' '),
    };

    const sizes = {
      sm: 'h-9 gap-1.5 rounded-lg px-3 text-xs',
      md: 'h-10 gap-2 px-4 text-sm',
      lg: 'h-12 gap-2.5 px-5 text-sm sm:text-base',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin"
            aria-hidden="true"
          />
        )}

        <span className={isLoading ? 'opacity-90' : ''}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';