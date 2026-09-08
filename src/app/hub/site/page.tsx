import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { SiteEditor } from './SiteEditor';

export const metadata: Metadata = { title: 'Website' };

export default async function SitePage() {
  const session = await requireStaff();
  const supabase = await supabaseServer();

  const { data: content } = await supabase
    .from('site_content')
    .select('*')
    .eq('business_id', session.business.id)
    .maybeSingle();

  return <SiteEditor content={content ?? null} business={session.business} />;
}
