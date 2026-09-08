import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';
import { createPreviewTables } from './data';
import { PREVIEW_PROFILE } from './session';

type Row = Record<string, unknown>;
type Filter = { col: string; op: 'eq' | 'gte' | 'lte' | 'lt'; val: unknown };
type Order = { col: string; asc: boolean; nullsFirst: boolean };

const tables: Record<string, Row[]> = createPreviewTables();

function compare(a: unknown, b: unknown, asc: boolean, nullsFirst: boolean): number {
  const aNull = a === null || a === undefined;
  const bNull = b === null || b === undefined;
  if (aNull || bNull) {
    if (aNull && bNull) return 0;
    return aNull ? (nullsFirst ? -1 : 1) : nullsFirst ? 1 : -1;
  }
  const av = String(a);
  const bv = String(b);
  if (av < bv) return asc ? -1 : 1;
  if (av > bv) return asc ? 1 : -1;
  return 0;
}

function compareValues(a: unknown, b: unknown, op: 'gte' | 'lte' | 'lt'): boolean {
  const leftN = Number(a);
  const rightN = Number(b);
  if (typeof a !== 'boolean' && typeof b !== 'boolean' && Number.isFinite(leftN) && Number.isFinite(rightN)) {
    if (op === 'gte') return leftN >= rightN;
    if (op === 'lte') return leftN <= rightN;
    return leftN < rightN;
  }
  const left = String(a ?? '');
  const right = String(b ?? '');
  if (op === 'gte') return left >= right;
  if (op === 'lte') return left <= right;
  return left < right;
}

function matches(row: Row, filters: Filter[]): boolean {
  return filters.every((filter) => {
    const value = row[filter.col];
    if (filter.op === 'eq') return value === filter.val;
    return compareValues(value, filter.val, filter.op);
  });
}

function newId(): string {
  return `preview-${Math.random().toString(36).slice(2, 10)}`;
}

class PreviewQuery implements PromiseLike<{ data: unknown; error: null; count: number | null }> {
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private limitN: number | null = null;
  private head = false;
  private wantCount = false;
  private wantSingle: 'maybe' | 'one' | null = null;
  private write: { kind: 'upsert'; rows: Row[]; conflict: string[] } | null = null;

  constructor(private table: string) {}

  select(_columns?: string, options?: { count?: 'exact'; head?: boolean }) {
    this.wantCount = options?.count === 'exact';
    this.head = options?.head === true;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, op: 'eq', val });
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push({ col, op: 'gte', val });
    return this;
  }

  lte(col: string, val: unknown) {
    this.filters.push({ col, op: 'lte', val });
    return this;
  }

  lt(col: string, val: unknown) {
    this.filters.push({ col, op: 'lt', val });
    return this;
  }

  order(col: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orders.push({
      col,
      asc: options?.ascending !== false,
      nullsFirst: options?.nullsFirst === true,
    });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  maybeSingle() {
    this.wantSingle = 'maybe';
    return this;
  }

  single() {
    this.wantSingle = 'one';
    return this;
  }

  upsert(payload: Row | Row[], options?: { onConflict?: string }) {
    this.write = {
      kind: 'upsert',
      rows: Array.isArray(payload) ? payload : [payload],
      conflict: (options?.onConflict ?? 'id')
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean),
    };
    return this;
  }

  insert(payload: Row | Row[]) {
    return this.upsert(payload);
  }

  update(payload: Row) {
    return this.upsert(payload);
  }

  then<TResult1 = { data: unknown; error: null; count: number | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: unknown; error: null; count: number | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private execute() {
    if (!tables[this.table]) tables[this.table] = [];

    if (this.write) {
      for (const incoming of this.write.rows) {
        const row = { id: incoming.id ?? newId(), ...incoming };
        const list = tables[this.table];
        const index = list.findIndex((existing) => {
          if (incoming.id && existing.id === incoming.id) return true;
          if (this.write!.conflict.length === 0) return false;
          return this.write!.conflict.every((key) => existing[key] === incoming[key]);
        });
        if (index >= 0) list[index] = { ...list[index], ...row };
        else list.push(row);
      }
    }

    let rows = tables[this.table].filter((row) => matches(row, this.filters));

    if (this.orders.length > 0) {
      rows = [...rows].sort((a, b) => {
        for (const order of this.orders) {
          const cmp = compare(a[order.col], b[order.col], order.asc, order.nullsFirst);
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    }

    const count = rows.length;
    if (this.limitN !== null) rows = rows.slice(0, this.limitN);

    if (this.head) {
      return { data: null, error: null, count };
    }

    if (this.wantSingle) {
      return { data: rows[0] ?? null, error: null, count: this.wantCount ? count : null };
    }

    return { data: rows, error: null, count: this.wantCount ? count : null };
  }
}

export function previewClient(): SupabaseClient<Database> {
  return {
    from(table: string) {
      return new PreviewQuery(table);
    },
    rpc: async () => ({ data: PREVIEW_PROFILE, error: null }),
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: PREVIEW_PROFILE.id,
            email: PREVIEW_PROFILE.email,
          },
        },
        error: null,
      }),
      signOut: async () => ({ error: null }),
    },
  } as unknown as SupabaseClient<Database>;
}
