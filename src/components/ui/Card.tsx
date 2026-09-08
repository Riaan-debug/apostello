import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({
  children,
  className,
  padded = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-[12px] border border-line bg-white shadow-[0_1px_2px_rgba(1,27,61,0.04),0_8px_24px_rgba(1,27,61,0.05)]',
        padded && 'p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[15px] leading-tight font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-steel">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-steel">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

type Tone = 'default' | 'good' | 'bad' | 'warn' | 'ink';

const TONE_ACCENT: Record<Tone, string> = {
  default: 'before:bg-ink',
  good: 'before:bg-good',
  bad: 'before:bg-bad',
  warn: 'before:bg-warn',
  ink: 'before:bg-gold',
};

export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
  dark = false,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  dark?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[12px] border p-4 pt-5',
        'before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:content-[""]',
        TONE_ACCENT[tone],
        dark ? 'border-ink-soft bg-ink text-cream' : 'border-line bg-white text-ink',
      )}
    >
      {icon && (
        <span className={cn('absolute top-4 right-4', dark ? 'text-cream/25' : 'text-ink/10')}>
          {icon}
        </span>
      )}
      <p
        className={cn(
          'text-[10.5px] font-semibold tracking-[0.09em] uppercase',
          dark ? 'text-cream/60' : 'text-steel',
        )}
      >
        {label}
      </p>
      <p className="tabular mt-1.5 text-2xl leading-none font-bold">{value}</p>
      {hint && (
        <p className={cn('mt-2 text-[11px]', dark ? 'text-cream/50' : 'text-steel')}>{hint}</p>
      )}
    </div>
  );
}

export function Progress({
  value,
  tone = 'default',
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const fill: Record<Tone, string> = {
    default: 'bg-ink',
    good: 'bg-good',
    bad: 'bg-bad',
    warn: 'bg-warn',
    ink: 'bg-gold',
  };
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-ink-wash', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', fill[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-3 text-steel-light">{icon}</div>}
      <p className="font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-steel">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
