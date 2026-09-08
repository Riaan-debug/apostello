import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import type { Business, Profile } from '@/lib/db/types';
import { isHubPreview, PREVIEW_BUSINESS, PREVIEW_PROFILE } from '@/lib/preview/session';

export interface HubSession {
  profile: Profile;
  business: Business;
  isAdmin: boolean;
}

/**
 * Server-side gate for /hub and /kiosk. Row level security is the real
 * boundary; this decides what to render and where to send someone who does not
 * belong on the page they asked for.
 */
export async function requireSession(): Promise<HubSession> {
  if (isHubPreview()) {
    return { profile: PREVIEW_PROFILE, business: PREVIEW_BUSINESS, isAdmin: true };
  }

  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !profile.active) {
    redirect('/login?error=no-profile');
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', profile.business_id)
    .maybeSingle();

  if (!business) {
    redirect('/login?error=no-business');
  }

  return { profile, business, isAdmin: profile.role === 'admin' };
}

/** For pages that show wages, expenses or net profit. */
export async function requireAdmin(): Promise<HubSession> {
  const session = await requireSession();
  if (!session.isAdmin) redirect('/hub');
  return session;
}

/** A paired kiosk iPad has no business in the rest of the hub. */
export async function requireStaff(): Promise<HubSession> {
  const session = await requireSession();
  if (session.profile.role === 'kiosk') redirect('/kiosk');
  return session;
}
