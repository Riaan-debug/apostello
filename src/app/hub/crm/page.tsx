import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { CustomerBook } from './CustomerBook';

export const metadata: Metadata = { title: 'Loyalty & customers' };

export default async function CrmPage() {
  const { business } = await requireStaff();
  const supabase = await supabaseServer();

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', business.id)
    .eq('archived', false)
    .order('last_visit', { ascending: false, nullsFirst: false })
    .order('name');

  return (
    <CustomerBook
      businessId={business.id}
      freeAt={business.loyalty_free_at}
      initialCustomers={customers ?? []}
    />
  );
}
