import { requireSession } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { Kiosk } from './Kiosk';

export default async function KioskPage() {
  const { business } = await requireSession();
  const supabase = await supabaseServer();

  // The whole card list goes to the device on purpose: the trailer loses Wi-Fi
  // and a lookup must still work. It is a few hundred rows, not a data set.
  const { data: customers } = await supabase
    .from('customers')
    .select(
      'id, name, phone, phone_normalised, stamps, visits, free_coffees, banked_drinks, last_visit',
    )
    .eq('business_id', business.id)
    .eq('archived', false);

  return (
    <Kiosk
      businessId={business.id}
      freeAt={business.loyalty_free_at}
      slogan={business.slogan}
      initialCustomers={customers ?? []}
    />
  );
}
