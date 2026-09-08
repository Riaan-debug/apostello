/** Local-time YYYY-MM-DD. Never use toISOString() — that shifts to UTC and
 *  moves a 06:30 South African trading day onto the wrong date. */
export function isoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return isoDate();
}

export function parseIso(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00`);
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: string = today()): string {
  const d = parseIso(iso);
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  return isoDate(d);
}

export interface DateRange {
  from: string;
  to: string;
}

/** Monday to Sunday inclusive. */
export function weekRange(anchor: string = today()): DateRange {
  const from = startOfWeek(anchor);
  return { from, to: addDays(from, 6) };
}

export function monthRange(year: number, monthIndex: number): DateRange {
  return {
    from: isoDate(new Date(year, monthIndex, 1)),
    to: isoDate(new Date(year, monthIndex + 1, 0)),
  };
}

export function eachDay({ from, to }: DateRange): string[] {
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function weekLabel(range: DateRange): string {
  const from = parseIso(range.from);
  const to = parseIso(range.to);
  const sameMonth = from.getMonth() === to.getMonth();
  const fmt = (d: Date, withMonth: boolean) =>
    d.toLocaleDateString('en-ZA', {
      day: 'numeric',
      ...(withMonth ? { month: 'short' } : {}),
    });
  return `${fmt(from, !sameMonth)} – ${fmt(to, true)} ${to.getFullYear()}`;
}

export function inRange(iso: string, { from, to }: DateRange): boolean {
  const day = iso.slice(0, 10);
  return day >= from && day <= to;
}
