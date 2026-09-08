import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

/**
 * Service-role client. Bypasses row level security, so it is confined to
 * staff PIN login and creating people from the hub. It must never be imported
 * into a Client Component — the `server-only` import above turns that mistake
 * into a build error rather than a leaked key.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
