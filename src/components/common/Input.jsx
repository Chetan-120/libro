import React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef(
  (
    {
      className,
      type = 'text',
      label,
      error,
      icon: Icon,
      rightIcon: RightIcon,
      onRightIconClick,
      helperText,
      id,
      required = false,
      ...props
    },
    ref
  ) => {
    const inputId =
      id ||
      (label
        ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : undefined);

    return (
      <div className="flex w-full flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center gap-1 text-xs font-semibold tracking-[-0.01em] text-slate-700"
          >
            {label}

            {required && (
              <span className="text-indigo-600" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <span
              className="pointer-events-none absolute left-3.5 z-10 flex items-center justify-center text-slate-400"
              aria-hidden="true"
            >
              <Icon className="h-[17px] w-[17px]" />
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            aria-invalid={Boolean(error)}
            className={cn(
              'h-11 w-full rounded-xl',
              'border bg-white',
              'text-sm font-medium text-slate-900',
              'placeholder:text-slate-400',
              'shadow-[0_1px_2px_rgba(15,23,42,0.02)]',
              'transition-all duration-200',
              'outline-none',
              'focus:border-indigo-300',
              'focus:ring-4 focus:ring-indigo-500/10',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
              Icon && 'pl-10',
              RightIcon && 'pr-10',
              error
                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
                : 'border-slate-200 hover:border-slate-300',
              className
            )}
            {...props}
          />

          {RightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className={[
                'absolute right-2 flex h-8 w-8 items-center justify-center',
                'rounded-lg text-slate-400',
                'transition-colors',
                'hover:bg-slate-100 hover:text-slate-700',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
              ].join(' ')}
              aria-label="Toggle input visibility"
            >
              <RightIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {error ? (
          <span className="text-xs font-medium leading-5 text-rose-600">
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs leading-5 text-slate-400">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';