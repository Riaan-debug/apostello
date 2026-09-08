import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success' | 'cream';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-cream hover:bg-ink-soft active:bg-ink-deep shadow-sm',
  outline: 'bg-white text-ink border border-line hover:border-ink hover:bg-cream',
  ghost: 'bg-transparent text-steel hover:bg-ink-wash hover:text-ink',
  danger: 'bg-bad text-white hover:brightness-110',
  success: 'bg-good text-white hover:brightness-110',
  cream: 'bg-cream text-ink border border-cream-deep hover:bg-cream-deep',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  xl: 'h-16 px-8 text-lg gap-3',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, block, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-[8px] font-semibold whitespace-nowrap',
        'transition-[background-color,border-color,color,box-shadow,transform] duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        'disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
