import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeTone = 'neutral' | 'good' | 'bad' | 'warn' | 'ink' | 'gold';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-wash text-steel',
  good: 'bg-good/10 text-good',
  bad: 'bg-bad/10 text-bad',
  warn: 'bg-warn/12 text-warn',
  ink: 'bg-ink text-cream',
  gold: 'bg-gold/15 text-gold',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
            value === option.value
              ? 'bg-ink text-cream'
              : 'bg-white text-steel ring-1 ring-line hover:text-ink',
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={cn('ml-1.5 tabular', value === option.value ? 'text-cream/60' : 'text-steel-light')}>
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
