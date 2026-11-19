import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ClayTone = 'lavender' | 'peach' | 'mint' | 'butter' | 'sky' | 'pink' | 'paper' | 'primary';
export type ClaySize = 'tile' | 'panel' | 'card' | 'inset';

export interface ClayTileProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: ClayTone;
  size?: ClaySize;
  pressable?: boolean;
  as?: React.ElementType;
}

export const ClayTile = forwardRef<HTMLDivElement, ClayTileProps>(
  (
    {
      tone = 'paper',
      size = 'tile',
      pressable = false,
      as: Component = 'div',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const toneClass = `clay-${tone}`;
    const sizeClass =
      size === 'panel'
        ? 'clay-panel'
        : size === 'card'
        ? 'clay-card'
        : size === 'inset'
        ? 'clay-inset'
        : 'clay-tile';

    return (
      <Component
        ref={ref}
        className={cn(
          'clay',
          toneClass,
          sizeClass,
          pressable && 'clay-press cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

ClayTile.displayName = 'ClayTile';
