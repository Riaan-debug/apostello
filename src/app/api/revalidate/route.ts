import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';
import { MENU_TAG, SITE_TAG } from '@/lib/content';

/**
 * Pushes a hub edit onto the public website immediately instead of waiting for
 * the ten minute revalidation window. Signed-in staff only — an open endpoint
 * here would be a free cache-buster for anyone who found the URL.
 */
export async function POST() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  revalidateTag(SITE_TAG);
  revalidateTag(MENU_TAG);

  return NextResponse.json({ ok: true });
}
