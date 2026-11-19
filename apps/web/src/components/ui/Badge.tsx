import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ClayTone } from './ClayTile';

export type BadgeTone = ClayTone | 'ok' | 'warn' | 'err';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ tone = 'paper', size = 'md', className, children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-[11px] font-bold leading-tight',
      md: 'px-2.5 py-1 text-xs font-bold leading-none',
    }[size];

    const toneClasses: Record<BadgeTone, string> = {
      lavender: 'bg-lavender text-ink-1 border border-lavender-deep/30',
      peach: 'bg-peach text-ink-1 border border-peach-deep/30',
      mint: 'bg-mint text-ink-1 border border-mint-deep/30',
      butter: 'bg-butter text-ink-1 border border-butter-deep/30',
      sky: 'bg-sky text-ink-1 border border-sky-deep/30',
      pink: 'bg-pink text-ink-1 border border-pink-deep/30',
      paper: 'bg-paper text-ink-1 border border-line/10 shadow-sm',
      primary: 'bg-primary text-white border border-primary-deep/40 shadow-sm',
      ok: 'bg-mint text-ok font-extrabold border border-mint-deep/40',
      warn: 'bg-butter text-warn font-extrabold border border-butter-deep/40',
      err: 'bg-pink text-err font-extrabold border border-pink-deep/40',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-pill tracking-tight select-none',
          sizeClasses,
          toneClasses[tone] || toneClasses.paper,
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
