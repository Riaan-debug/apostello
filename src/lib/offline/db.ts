'use client';

/**
 * A tiny IndexedDB queue. The trailer's Wi-Fi is the constraint the whole
 * offline story exists for: a stamp taken while the signal is gone must still
 * be a stamp five minutes later, and must not become two stamps when the
 * connection returns.
 */

const DB_NAME = 'apostello-outbox';
const DB_VERSION = 1;
const STORE = 'queue';

export type OutboxKind =
  | 'stamp'
  | 'redeem'
  | 'use_banked'
  | 'customer_create'
  | 'stock_count'
  | 'daily_log'
  | 'checklist_run';

export interface OutboxJob<P = unknown> {
  /** Generated on the device, and reused as the row id where the table allows
   *  it, so a replayed job is an upsert rather than a duplicate. */
  id: string;
  kind: OutboxKind;
  payload: P;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export function putJob(job: OutboxJob): Promise<unknown> {
  return tx('readwrite', (store) => store.put(job) as IDBRequest<unknown>);
}

export function deleteJob(id: string): Promise<unknown> {
  return tx('readwrite', (store) => store.delete(id) as IDBRequest<unknown>);
}

export async function listJobs(): Promise<OutboxJob[]> {
  const jobs = await tx<OutboxJob[]>('readonly', (store) => store.getAll() as IDBRequest<OutboxJob[]>);
  return jobs.sort((a, b) => a.createdAt - b.createdAt);
}

export async function countJobs(): Promise<number> {
  try {
    return await tx<number>('readonly', (store) => store.count() as IDBRequest<number>);
  } catch {
    return 0;
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older iPad Safari on a non-secure origin.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}
