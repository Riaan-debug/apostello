import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { addDays, today } from '@/lib/domain/dates';
import { StockTake } from './StockTake';

export const metadata: Metadata = { title: 'Stock take' };

export default async function StockPage() {
  const { business } = await requireStaff();
  const supabase = await supabaseServer();
  const day = today();

  const [itemsRes, todayRes, yesterdayRes] = await Promise.all([
    supabase
      .from('stock_items')
      .select('*')
      .eq('business_id', business.id)
      .eq('archived', false)
      .order('position'),
    supabase.from('stock_counts').select('*').eq('business_id', business.id).eq('count_date', day),
    supabase
      .from('stock_counts')
      .select('*')
      .eq('business_id', business.id)
      .eq('count_date', addDays(day, -1)),
  ]);

  return (
    <StockTake
      businessId={business.id}
      countDate={day}
      items={itemsRes.data ?? []}
      todayCounts={todayRes.data ?? []}
      yesterdayCounts={yesterdayRes.data ?? []}
    />
  );
}
