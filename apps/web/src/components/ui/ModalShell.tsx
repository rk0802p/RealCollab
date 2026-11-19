import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { IconButton } from './IconButton';
import { ClayTone } from './ClayTile';

export interface ModalShellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  iconTone?: ClayTone;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const ModalShell = forwardRef<HTMLDivElement, ModalShellProps>(
  (
    {
      isOpen,
      onClose,
      title,
      icon,
      iconTone = 'lavender',
      children,
      footer,
      maxWidth = 'max-w-md',
      className,
      ...props
    },
    ref
  ) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2B2540]/35 backdrop-none animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            'w-full clay clay-paper rounded-panel border border-line/10 p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative',
            maxWidth,
            className
          )}
          {...props}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {icon && (
                <div
                  className={cn(
                    'w-10 h-10 rounded-card flex items-center justify-center clay-card shrink-0 text-ink-1 [&_svg]:stroke-[2.25]',
                    `clay-${iconTone}`
                  )}
                >
                  {icon}
                </div>
              )}
              <h2 className="text-xl font-extrabold text-ink-1 tracking-tight">{title}</h2>
            </div>
            <IconButton
              aria-label="Close dialog"
              size="sm"
              tone="paper"
              onClick={onClose}
              className="text-ink-2 hover:text-ink-1"
            >
              <svg
                className="w-4 h-4 stroke-[2.25]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </IconButton>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col gap-4 text-ink-2">{children}</div>

          {/* Footer */}
          {footer && <div className="flex items-center justify-end gap-3 pt-2">{footer}</div>}
        </div>
      </div>
    );
  }
);

ModalShell.displayName = 'ModalShell';
