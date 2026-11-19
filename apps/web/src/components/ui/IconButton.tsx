import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ClayTone } from './ClayTile';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string; // Required for accessibility
  size?: IconButtonSize;
  tone?: ClayTone | 'transparent';
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      'aria-label': ariaLabel,
      size = 'md',
      tone = 'paper',
      active = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'w-7 h-7 text-xs rounded-lg',
      md: 'w-9 h-9 text-sm rounded-control', // 36px
      lg: 'w-11 h-11 text-base rounded-card',
    }[size];

    const toneClasses =
      tone === 'transparent'
        ? 'bg-transparent text-ink-2 hover:bg-black/5 hover:text-ink-1'
        : `clay-${tone} clay-card text-ink-1`;

    const activeClasses = active
      ? 'clay-lavender clay-inset text-primary-deep shadow-inner font-bold'
      : tone !== 'transparent'
      ? 'clay-press'
      : '';

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-bold select-none clay-focus transition-all [&_svg]:stroke-[2.25]',
          sizeClasses,
          toneClasses,
          activeClasses,
          disabled && 'opacity-40 cursor-not-allowed pointer-events-none shadow-none transform-none',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
