import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  variant = 'default',
  ...props
}) {
  const variants = {
    default: 'rounded-xl',
    text: 'rounded-md',
    circle: 'rounded-full',
    card: 'rounded-2xl',
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-slate-200/80',
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}