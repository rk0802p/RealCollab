import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ClayTone } from './ClayTile';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  tone?: ClayTone;
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ tone = 'paper', hasError = false, className, disabled, children, ...props }, ref) => {
    return (
      <div className="relative inline-block w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-11 px-3.5 pr-8 text-sm font-semibold text-ink-1 rounded-control appearance-none cursor-pointer',
            'clay-inset border border-line/10 transition-all bg-no-repeat',
            `clay-${tone}`,
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/50',
            '[&>option]:bg-white [&>option]:text-ink-1 [&>option]:py-1',
            hasError && 'border-err/60 ring-2 ring-err/30',
            disabled && 'opacity-50 cursor-not-allowed bg-black/5',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-ink-2">
          <svg
            className="w-4 h-4 stroke-[2.25]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
