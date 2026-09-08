const ZA = 'en-ZA';

/** R 1 234.56 — the format used everywhere money is shown. */
export function money(value: number | null | undefined, decimals = 2): string {
  const n = Number(value ?? 0);
  return `R ${n.toLocaleString(ZA, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Money without the R, for table cells that already have a currency header. */
export function moneyBare(value: number | null | undefined, decimals = 2): string {
  return Number(value ?? 0).toLocaleString(ZA, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function count(value: number | null | undefined): string {
  return Math.round(Number(value ?? 0)).toLocaleString(ZA);
}

export function decimal(value: number | null | undefined, places = 1): string {
  return Number(value ?? 0).toLocaleString(ZA, {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
}

export function percent(value: number | null | undefined, places = 1): string {
  return `${Number(value ?? 0).toFixed(places)}%`;
}

/** 4 Mar 2026 */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(ZA, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Mon 4 Mar */
export function dayDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(ZA, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(ZA, { month: 'long', year: 'numeric' });
}

/** "3 days ago" / "Today" — for last-visit columns. */
export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const days = daysSince(iso);
  if (days === null) return 'never';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 60) return 'over a month ago';
  return `${Math.floor(days / 30)} months ago`;
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const then = new Date(`${iso.slice(0, 10)}T00:00:00`).getTime();
  if (Number.isNaN(then)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - then) / 86_400_000));
}

/** Truncate for a table cell without cutting mid-word where avoidable. */
export function clip(text: string | null | undefined, max = 60): string {
  const value = (text ?? '').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}
