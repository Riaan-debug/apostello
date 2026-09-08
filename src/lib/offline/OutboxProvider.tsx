'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { countJobs, deleteJob, listJobs, newId, putJob, type OutboxKind } from './db';
import { runJob, type PayloadMap } from './mutations';

interface OutboxState {
  online: boolean;
  pending: number;
  syncing: boolean;
  lastError: string | null;
  /** Fire and forget. Returns the job id, which doubles as the new row id for
   *  loyalty events and customer sign-ups. */
  submit: <K extends OutboxKind>(kind: K, payload: PayloadMap[K], id?: string) => Promise<string>;
  flush: () => Promise<void>;
}

const OutboxContext = createContext<OutboxState | null>(null);

const RETRY_MS = 15_000;
const MAX_ATTEMPTS = 25;

export function OutboxProvider({ children }: { children: ReactNode }) {
  const supabase = supabaseBrowser();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const busy = useRef(false);

  const refreshCount = useCallback(async () => {
    setPending(await countJobs());
  }, []);

  const flush = useCallback(async () => {
    if (busy.current || typeof navigator === 'undefined' || !navigator.onLine) return;
    busy.current = true;
    setSyncing(true);

    try {
      const jobs = await listJobs();
      for (const job of jobs) {
        try {
          await runJob(supabase, job);
          await deleteJob(job.id);
          setLastError(null);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sync failed';

          // A rejection the server will never accept (a redeem for a card that
          // is no longer full, a customer that was deleted) must not block the
          // queue behind it forever.
          const permanent = /not found|not authorised|not full|no banked/i.test(message);
          if (permanent || job.attempts + 1 >= MAX_ATTEMPTS) {
            await deleteJob(job.id);
            setLastError(`Dropped a ${job.kind.replace('_', ' ')}: ${message}`);
          } else {
            await putJob({ ...job, attempts: job.attempts + 1, lastError: message });
            setLastError(message);
            break;
          }
        }
      }
    } finally {
      busy.current = false;
      setSyncing(false);
      await refreshCount();
    }
  }, [supabase, refreshCount]);

  const submit = useCallback<OutboxState['submit']>(
    async (kind, payload, id) => {
      const job = {
        id: id ?? newId(),
        kind,
        payload,
        createdAt: Date.now(),
        attempts: 0,
      };

      // Queue first, then try to send. If the tab is closed mid-request the
      // job survives; if the request succeeded the replay is a no-op.
      await putJob(job);
      await refreshCount();
      void flush();
      return job.id;
    },
    [flush, refreshCount],
  );

  useEffect(() => {
    setOnline(navigator.onLine);
    void refreshCount();

    const goOnline = () => {
      setOnline(true);
      void flush();
    };
    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    const timer = window.setInterval(() => void flush(), RETRY_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void flush();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [flush, refreshCount]);

  const value = useMemo<OutboxState>(
    () => ({ online, pending, syncing, lastError, submit, flush }),
    [online, pending, syncing, lastError, submit, flush],
  );

  return <OutboxContext.Provider value={value}>{children}</OutboxContext.Provider>;
}

export function useOutbox(): OutboxState {
  const context = useContext(OutboxContext);
  if (!context) throw new Error('useOutbox must be used inside <OutboxProvider>');
  return context;
}
