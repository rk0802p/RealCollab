import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShape = 'pill' | 'control';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      shape = 'pill',
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    }[size];

    const shapeClass = shape === 'control' ? 'rounded-control' : 'rounded-pill';

    const variantClasses = {
      primary:
        'bg-primary text-white font-bold clay-press clay-primary shadow-clay-sm hover:bg-primary-deep',
      secondary:
        'bg-paper text-ink-1 font-bold clay-card clay-press border border-line/10 hover:bg-paper/95',
      soft:
        'bg-lavender/50 text-ink-1 font-bold hover:bg-lavender/80 active:scale-[0.98] transition-all',
      danger:
        'bg-err/10 text-err font-bold hover:bg-err/20 border border-err/20 active:scale-[0.98] transition-all',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-bold tracking-tight select-none clay-focus transition-all',
          shapeClass,
          sizeClasses,
          variantClasses,
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none shadow-none transform-none',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
