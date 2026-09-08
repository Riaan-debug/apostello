/** True when a real Supabase project is wired up, not just the example placeholders.
 *  Bracket access so Next.js cannot inline stale NEXT_PUBLIC values at compile time. */
export function hasSupabaseEnv(): boolean {
  const url = (process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '').trim();
  const key = (process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '').trim();
  if (!url || !key) return false;
  if (url.includes('your-project') || key === 'your-anon-key') return false;
  return url.startsWith('https://');
}
