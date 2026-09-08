import type { Metadata } from 'next';
import { CloudOff } from 'lucide-react';
import { Wordmark } from '@/components/Wordmark';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6 text-center">
      <Wordmark tone="cream" size="lg" withTagline />

      <CloudOff className="mt-12 size-10 text-cream/30" />
      <h1 className="mt-5 text-2xl font-semibold text-cream">No signal at the trailer</h1>
      <p className="mt-3 max-w-sm text-sm text-cream/50">
        Anything you already tapped in is saved on this device and will sync by itself once the
        Wi-Fi is back. Nothing has been lost.
      </p>
    </main>
  );
}
