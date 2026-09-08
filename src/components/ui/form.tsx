'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-[8px] border border-line bg-white px-3 py-2.5 text-sm text-ink ' +
  'placeholder:text-steel-light transition-[border-color,box-shadow] ' +
  'focus:border-ink focus:ring-[3px] focus:ring-ink/10 focus:outline-none ' +
  'disabled:bg-line-soft disabled:text-steel';

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.06em] text-ink uppercase">
          {label}
          {required && <span className="ml-0.5 text-bad">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] font-medium text-bad">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-[11px] text-steel">{hint}</span>
      )}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(CONTROL, className)} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, ...rest }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(CONTROL, 'resize-y', className)} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cn(CONTROL, 'appearance-none pr-8', className)} {...rest}>
        {children}
      </select>
    );
  },
);

export function Checkbox({
  label,
  hint,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: string }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5', className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-ink)]"
        {...rest}
      />
      <span className="text-sm leading-snug text-ink">
        {label}
        {hint && <span className="mt-0.5 block text-[11px] text-steel">{hint}</span>}
      </span>
    </label>
  );
}

/** Numeric cell used across the stock take and drink tally grids. */
export const NumberCell = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function NumberCell({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        className={cn(
          'tabular w-20 rounded-[6px] border border-line bg-white px-2 py-1.5 text-center text-sm',
          'focus:border-ink focus:ring-[3px] focus:ring-ink/10 focus:outline-none',
          className,
        )}
        {...rest}
      />
    );
  },
);

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>{children}</div>
  );
}
