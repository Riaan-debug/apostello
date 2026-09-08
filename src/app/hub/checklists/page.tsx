import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { addDays, today } from '@/lib/domain/dates';
import { Checklists } from './Checklists';

export const metadata: Metadata = { title: 'Checklists' };

export default async function ChecklistsPage() {
  const { business } = await requireStaff();
  const supabase = await supabaseServer();
  const day = today();

  const [itemsRes, runsRes] = await Promise.all([
    supabase
      .from('checklist_items')
      .select('*')
      .eq('business_id', business.id)
      .eq('archived', false)
      .order('position'),
    supabase
      .from('checklist_runs')
      .select('*')
      .eq('business_id', business.id)
      .gte('run_date', addDays(day, -13))
      .order('run_date', { ascending: false }),
  ]);

  return (
    <Checklists
      businessId={business.id}
      runDate={day}
      items={itemsRes.data ?? []}
      runs={runsRes.data ?? []}
    />
  );
}
