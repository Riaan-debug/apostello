import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { HubShell } from '@/components/hub/HubShell';

export const metadata: Metadata = {
  title: 'Staff hub',
  robots: { index: false, follow: false },
};

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const { profile, business, isAdmin } = await requireStaff();

  return (
    <HubShell
      displayName={profile.display_name}
      role={profile.role}
      businessName={business.name}
      isAdmin={isAdmin}
    >
      {children}
    </HubShell>
  );
}
