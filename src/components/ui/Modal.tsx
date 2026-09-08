'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-deep/55 p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'animate-fade-up flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[16px] bg-white shadow-[0_16px_60px_rgba(1,27,61,0.28)] sm:rounded-[14px]',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-steel">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mt-1 -mr-1 rounded-md p-1.5 text-steel transition-colors hover:bg-ink-wash hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-cream/60 px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
