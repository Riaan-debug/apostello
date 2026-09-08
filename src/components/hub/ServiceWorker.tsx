'use client';

import { useEffect } from 'react';

/** Registers the app-shell cache so the hub and kiosk still open with no signal. */
export function ServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[sw] registration failed', error);
    });
  }, []);

  return null;
}
