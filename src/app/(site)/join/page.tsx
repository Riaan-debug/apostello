import type { Metadata } from 'next';
import { getSiteData } from '@/lib/content';
import { hasSupabaseEnv } from '@/lib/env';
import { JoinForm } from '@/components/site/JoinForm';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Loyalty card',
  description:
    'Join the Apostellō Coffee Co. loyalty card. Give your number once at the trailer and every tenth cup is on us.',
  alternates: { canonical: '/join' },
};

export default async function JoinPage() {
  const { business } = await getSiteData();

  if (!hasSupabaseEnv() || !business || business.id === 'fallback') {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold text-ink">Loyalty sign-up is warming up</h1>
        <p className="mt-3 text-sm text-steel">
          Come past the trailer and we will add you to the card by hand in the meantime.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <header className="mb-8">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-steel uppercase">
          Loyalty
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-ink">Join the card</h1>
        <p className="mt-4 text-steel">
          One number, no plastic. We keep the count and tell you when a drink is waiting.
        </p>
      </header>

      <JoinForm businessId={business.id} freeAt={business.loyalty_free_at} />
    </div>
  );
}
