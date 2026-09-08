import { cn } from '@/lib/cn';

/**
 * Typographic stand-in for the official logo: the brand guidelines describe an
 * omega mark standing in for the "o" of Apostellō, set in Montserrat. Drop the
 * supplied logo files into /public and swap this out — see README, "Brand
 * assets". Nothing else references the mark directly.
 */
export function Wordmark({
  className,
  tone = 'ink',
  size = 'md',
  withTagline = false,
}: {
  className?: string;
  tone?: 'ink' | 'cream';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withTagline?: boolean;
}) {
  const scale = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl sm:text-6xl',
  }[size];

  return (
    <span className={cn('inline-flex flex-col', className)}>
      <span
        className={cn(
          'font-display leading-none font-medium tracking-[0.02em]',
          scale,
          tone === 'cream' ? 'text-cream' : 'text-ink',
        )}
      >
        Ap<span className="font-semibold">Ω</span>stell
        <span className="tracking-normal">ō</span>
      </span>
      {withTagline && (
        <span
          className={cn(
            'mt-1.5 text-[9.5px] font-semibold tracking-[0.32em] uppercase',
            tone === 'cream' ? 'text-cream/55' : 'text-steel',
          )}
        >
          Speciality Coffee · Est. 26
        </span>
      )}
    </span>
  );
}
