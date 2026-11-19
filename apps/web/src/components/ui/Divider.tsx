import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dotted';
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  ({ orientation = 'horizontal', variant = 'solid', className, ...props }, ref) => {
    const isVertical = orientation === 'vertical';

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          isVertical ? 'w-0.5 self-stretch my-1' : 'h-0.5 w-full my-2',
          variant === 'dotted'
            ? isVertical
              ? 'border-l-2 border-dotted border-line/15'
              : 'border-t-2 border-dotted border-line/15'
            : 'bg-line/10 rounded-pill',
          className
        )}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';
