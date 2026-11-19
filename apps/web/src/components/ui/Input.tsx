import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ClayTone } from './ClayTile';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tone?: ClayTone;
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ tone = 'paper', hasError = false, className, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full h-11 px-3.5 text-sm font-semibold text-ink-1 rounded-control',
          'placeholder:text-ink-3/70 placeholder:font-normal',
          'clay-inset border border-line/10 transition-all',
          `clay-${tone}`,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/50',
          hasError && 'border-err/60 ring-2 ring-err/30',
          disabled && 'opacity-50 cursor-not-allowed bg-black/5',
          className
        )}
        {...props}
      >
      </input>
    );
  }
);

Input.displayName = 'Input';
