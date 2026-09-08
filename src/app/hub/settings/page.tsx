import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { SettingsView, type BusinessSettings } from './SettingsView';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const session = await requireStaff();
  const supabase = await supabaseServer();
  const businessId = session.business.id;

  const [linksResult, profilesResult, expensesResult] = await Promise.all([
    supabase.from('staff_links').select('*').eq('business_id', businessId).order('position'),
    session.isAdmin
      ? supabase.from('profiles').select('*').eq('business_id', businessId).order('display_name')
      : null,
    session.isAdmin
      ? supabase.from('expenses').select('*').eq('business_id', businessId).order('name')
      : null,
  ]);

  const business = session.business;

  // Wage figures must not reach a staff browser, props included.
  const settings: BusinessSettings | null = session.isAdmin
    ? {
        name: business.name,
        slogan: business.slogan,
        operating_days: Number(business.operating_days),
        vat_rate: Number(business.vat_rate),
        card_fee_rate: Number(business.card_fee_rate),
        loyalty_free_at: Number(business.loyalty_free_at),
        daily_cup_target: Number(business.daily_cup_target),
        weekly_revenue_target: Number(business.weekly_revenue_target),
        monthly_net_target: Number(business.monthly_net_target),
      }
    : null;

  return (
    <SettingsView
      basics={{ name: business.name, slogan: business.slogan }}
      settings={settings}
      profiles={profilesResult?.data ?? null}
      expenses={expensesResult?.data ?? null}
      links={linksResult.data ?? []}
      isAdmin={session.isAdmin}
      currentProfileId={session.profile.id}
    />
  );
}
