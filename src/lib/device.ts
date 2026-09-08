'use client';

const KEY = 'apostello.device-id';

/**
 * Stable per-device id. Used to key PIN lockouts so a barista fumbling a PIN
 * on the iPad cannot lock the owner out of their laptop.
 */
export function deviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
