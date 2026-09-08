import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/db/types';
import { hasSupabaseEnv } from '@/lib/env';
import { previewClient } from '@/lib/preview/client';

/** Request-scoped client that reads and refreshes the session cookie. */
export async function supabaseServer() {
  const url = (process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '').trim();
  const key = (process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '').trim();
  if (!url || !key || !hasSupabaseEnv()) return previewClient();

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot set cookies. The middleware refresh
            // covers that case, so swallowing this is correct rather than lazy.
          }
        },
      },
    },
  );
}

/** Same client, but for reads inside `unstable_cache` / static generation. */
export function supabaseAnonymous() {
  const url = (process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '').trim();
  const key = (process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '').trim();
  if (!url || !key || !hasSupabaseEnv()) return previewClient();

  return createServerClient<Database>(url, key, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
