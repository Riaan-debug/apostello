import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { addDays, today } from '@/lib/domain/dates';
import { CloseOfDay } from './CloseOfDay';

export const metadata: Metadata = { title: 'Close of day' };

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { business } = await requireStaff();
  const params = await searchParams;
  const day = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? '') ? params.date! : today();

  const supabase = await supabaseServer();

  const [logRes, itemsRes, sizesRes, recentRes] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('*')
      .eq('business_id', business.id)
      .eq('log_date', day)
      .maybeSingle(),
    supabase
      .from('menu_items')
      .select('*')
      .eq('business_id', business.id)
      .eq('active', true)
      .order('position'),
    supabase.from('menu_item_sizes').select('*').eq('business_id', business.id).order('position'),
    supabase
      .from('daily_logs')
      .select('*')
      .eq('business_id', business.id)
      .gte('log_date', addDays(day, -14))
      .lte('log_date', day)
      .order('log_date', { ascending: false }),
  ]);

  const existing = logRes.data ?? null;

  const { data: tally } = existing
    ? await supabase.from('daily_log_tally').select('*').eq('daily_log_id', existing.id)
    : { data: [] };

  return (
    <CloseOfDay
      businessId={business.id}
      logDate={day}
      cupTarget={business.daily_cup_target}
      existing={existing}
      existingTally={tally ?? []}
      menuItems={itemsRes.data ?? []}
      sizes={sizesRes.data ?? []}
      recent={recentRes.data ?? []}
    />
  );
}
