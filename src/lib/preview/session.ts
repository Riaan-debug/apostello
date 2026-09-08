import type { Business, Profile } from '@/lib/db/types';
import { hasSupabaseEnv } from '@/lib/env';

export const PREVIEW_BUSINESS_ID = 'c0ffee00-0000-4000-8000-000000000001';
export const PREVIEW_PROFILE_ID = 'aaaaaaaa-0000-4000-8000-000000000001';

const STAMP = '2026-01-01T00:00:00.000Z';

/** Local-only: the hub is browseable without Supabase so you can see the screens. */
export function isHubPreview(): boolean {
  return !hasSupabaseEnv();
}

export const PREVIEW_BUSINESS: Business = {
  id: PREVIEW_BUSINESS_ID,
  name: 'Apostellō Coffee Co.',
  slogan: 'not just served, Sent.',
  currency: 'ZAR',
  timezone: 'Africa/Johannesburg',
  operating_days: 5,
  vat_rate: 15,
  card_fee_rate: 2.9,
  loyalty_free_at: 10,
  daily_cup_target: 100,
  weekly_revenue_target: 58968,
  monthly_net_target: 75916,
  created_at: STAMP,
  updated_at: STAMP,
};

export const PREVIEW_PROFILE: Profile = {
  id: PREVIEW_PROFILE_ID,
  business_id: PREVIEW_BUSINESS_ID,
  email: 'bjorn@apostello.local',
  display_name: 'Bjorn',
  role: 'admin',
  avatar: '☕',
  active: true,
  last_seen_at: STAMP,
  created_at: STAMP,
  updated_at: STAMP,
};
