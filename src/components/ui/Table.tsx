import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('-mx-px overflow-x-auto', className)}>{children}</div>;
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn('w-full border-collapse text-sm', className)}>{children}</table>;
}

export function Th({
  children,
  align = 'left',
  className,
}: {
  children?: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  return (
    <th
      className={cn(
        'bg-ink px-3 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] text-cream uppercase whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = 'left',
  className,
  colSpan,
}: {
  children?: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'border-b border-line px-3 py-2.5 align-middle',
        align === 'right' && 'tabular text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  tone,
  onClick,
  className,
}: {
  children: ReactNode;
  tone?: 'bad' | 'warn';
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors',
        tone === 'bad' && 'bg-bad/[0.04]',
        tone === 'warn' && 'bg-warn/[0.06]',
        onClick && 'cursor-pointer hover:bg-cream',
        !onClick && 'hover:bg-cream/70',
        className,
      )}
    >
      {children}
    </tr>
  );
}
