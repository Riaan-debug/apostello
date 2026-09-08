import type { Metadata, Viewport } from 'next';
import { requireSession } from '@/lib/auth';
import { OutboxProvider } from '@/lib/offline/OutboxProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ServiceWorker } from '@/components/hub/ServiceWorker';

export const metadata: Metadata = {
  title: 'Loyalty kiosk',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#011b3d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default async function KioskLayout({ children }: { children: React.ReactNode }) {
  await requireSession();

  return (
    <ToastProvider>
      <OutboxProvider>
        <ServiceWorker />
        <div className="touch-surface min-h-dvh bg-ink">{children}</div>
      </OutboxProvider>
    </ToastProvider>
  );
}
