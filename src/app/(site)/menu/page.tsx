import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSiteData, openStatus } from '@/lib/content';
import { MenuGroups } from '@/components/site/MenuGroups';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'The full Apostellō Coffee Co. menu with current prices — espresso, cappuccino, flat white, mocha, hot chocolate and cold brew.',
  alternates: { canonical: '/menu' },
};

export default async function MenuPage() {
  const { content, menu } = await getSiteData();
  const status = openStatus(content);

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
      <header className="mb-14">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-steel uppercase">
          {status.label}
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">Menu</h1>
        <p className="mt-4 max-w-prose text-steel">
          Prices include VAT. Card and cash both welcome. Swap to oat milk on any drink at no extra
          charge.
        </p>
      </header>

      <MenuGroups groups={menu} withAnchors />

      <div className="mt-16 rounded-[14px] border border-line bg-white p-7">
        <h2 className="text-lg font-semibold text-ink">Every tenth cup is on us</h2>
        <p className="mt-2 max-w-prose text-sm text-steel">
          Give your number once at the trailer and the card lives on our side — nothing to lose out
          of your wallet.
        </p>
        <Link
          href="/join"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          Join the loyalty card
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
