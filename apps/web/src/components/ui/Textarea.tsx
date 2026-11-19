import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ClayTone } from './ClayTile';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  tone?: ClayTone;
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ tone = 'paper', hasError = false, className, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full min-h-[96px] p-3 text-sm font-semibold text-ink-1 rounded-control',
          'placeholder:text-ink-3/70 placeholder:font-normal',
          'clay-inset border border-line/10 transition-all resize-y',
          `clay-${tone}`,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:border-primary/50',
          hasError && 'border-err/60 ring-2 ring-err/30',
          disabled && 'opacity-50 cursor-not-allowed bg-black/5',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
