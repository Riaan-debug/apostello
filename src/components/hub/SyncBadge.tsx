'use client';

import { CloudOff, RefreshCw, Wifi } from 'lucide-react';
import { useOutbox } from '@/lib/offline/OutboxProvider';
import { cn } from '@/lib/cn';

/**
 * The one piece of status a barista needs: is what I just did saved anywhere
 * other than this iPad? Silence means yes.
 */
export function SyncBadge() {
  const { online, pending, syncing, flush } = useOutbox();

  if (online && pending === 0) {
    return (
      <span className="hidden items-center gap-1.5 text-[11px] font-semibold text-good sm:inline-flex">
        <Wifi className="size-3.5" />
        Saved
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void flush()}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold',
        online ? 'bg-warn/12 text-warn' : 'bg-bad/10 text-bad',
      )}
    >
      {online ? (
        <RefreshCw className={cn('size-3.5', syncing && 'animate-spin')} />
      ) : (
        <CloudOff className="size-3.5" />
      )}
      {pending > 0
        ? `${pending} waiting to sync`
        : online
          ? 'Syncing'
          : 'Offline — work is being saved'}
    </button>
  );
}
