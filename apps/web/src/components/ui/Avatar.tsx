import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string | null;
  size?: AvatarSize;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ name = '?', src, size = 'md', className, style, children, ...props }, ref) => {
    const [imageError, setImageError] = useState(false);

    const sizeClasses = {
      sm: 'w-7 h-7 text-xs ring-2',
      md: 'w-9 h-9 text-sm ring-2', // standard ~36px
      lg: 'w-12 h-12 text-base ring-[3px]',
    }[size];

    const initials = name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none font-bold text-white',
          'ring-white shadow-[0_4px_8px_rgb(43_37_64_/_0.15)] transition-transform',
          sizeClasses,
          className
        )}
        title={name}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span>{children || initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
