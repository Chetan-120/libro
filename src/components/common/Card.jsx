import React from 'react';
import { cn } from '@/lib/utils';

export function Card({
  children,
  className,
  hoverEffect = false,
  padding = 'md',
  ...props
}) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-7 lg:p-8',
  };

  return (
    <div
      className={cn(
        'w-full min-w-0 rounded-2xl',
        'border border-slate-200/80',
        'bg-white',
        'shadow-[0_1px_2px_rgba(15,23,42,0.03)]',
        'transition-all duration-200',
        paddingStyles[padding] || paddingStyles.md,
        hoverEffect && [
          'hover:-translate-y-0.5',
          'hover:border-slate-300',
          'hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)]',
        ],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  action,
}) {
  return (
    <div
      className={cn(
        'mb-5 flex items-start justify-between gap-4',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {children}
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}) {
  return (
    <h3
      className={cn(
        'text-base font-semibold leading-6',
        'tracking-[-0.025em]',
        'text-slate-950',
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}) {
  return (
    <p
      className={cn(
        'mt-1 text-xs leading-5',
        'text-slate-500',
        className
      )}
    >
      {children}
    </p>
  );
}

export function CardFooter({
  children,
  className,
}) {
  return (
    <div
      className={cn(
        'mt-5 flex items-center gap-3',
        'border-t border-slate-100 pt-4',
        className
      )}
    >
      {children}
    </div>
  );
}