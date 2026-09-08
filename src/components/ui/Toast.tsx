'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastTone = 'info' | 'success' | 'error';

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastTone, ReactNode> = {
  info: <Info className="size-4 shrink-0" />,
  success: <CheckCircle2 className="size-4 shrink-0" />,
  error: <AlertTriangle className="size-4 shrink-0" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-[999] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'animate-fade-up flex max-w-sm items-center gap-2.5 rounded-[10px] px-4 py-3 text-sm font-medium shadow-[0_8px_28px_rgba(1,27,61,0.25)]',
              'border-l-4',
              toast.tone === 'success' && 'border-good bg-ink text-cream',
              toast.tone === 'error' && 'border-bad bg-ink text-cream',
              toast.tone === 'info' && 'border-gold bg-ink text-cream',
            )}
          >
            {ICONS[toast.tone]}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
