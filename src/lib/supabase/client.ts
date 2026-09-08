'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/db/types';
import { hasSupabaseEnv } from '@/lib/env';
import { previewClient } from '@/lib/preview/client';

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser client. Safe to ship: it only ever holds the anon key, and every
 * table is behind row level security.
 */
export function supabaseBrowser() {
  if (!hasSupabaseEnv()) return previewClient();

  if (!cached) {
    cached = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return cached;
}
