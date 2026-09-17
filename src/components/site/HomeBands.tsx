import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type BandPhoto = { src: string; alt: string };

type Band = {
  heading: string;
  body: string;
  photos: BandPhoto[];
  href: string;
  cta: string;
};

function OfferingBand({ band, tone }: { band: Band; tone: 'cream' | 'white' }) {
  return (
    <article
      className={`flex flex-col px-5 py-16 sm:px-8 ${tone === 'white' ? 'bg-white' : 'bg-cream'}`}
    >
      <p className="text-[11px] font-semibold tracking-[0.16em] text-steel uppercase">
        From the trailer
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-ink">{band.heading}</h2>
      {band.body ? <p className="mt-3 max-w-prose text-steel">{band.body}</p> : null}

      <div
        className={`mt-8 grid flex-1 items-start gap-4 ${
          band.photos.length > 1 ? 'grid-cols-2' : 'justify-items-start'
        }`}
      >
        {band.photos.map((photo) => (
          <figure
            key={photo.src}
            className={band.photos.length > 1 ? 'min-w-0' : undefined}
            style={band.photos.length > 1 ? undefined : { width: 'min(100%, 16rem)' }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={900}
              height={1200}
              sizes={band.photos.length > 1 ? '(max-width: 1024px) 50vw, 28vw' : '288px'}
              className="h-auto w-full rounded-[14px]"
            />
          </figure>
        ))}
      </div>

      <Link
        href={band.href}
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline"
      >
        {band.cta}
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

export function HomeBands({
  food,
  coffee,
}: {
  food: Band | null;
  coffee: Band | null;
}) {
  if (!food && !coffee) return null;

  const both = Boolean(food && coffee);

  return (
    <section className="border-b border-line">
      <div
        className={`mx-auto max-w-6xl ${
          both ? 'grid lg:grid-cols-2 lg:divide-x lg:divide-line' : ''
        }`}
      >
        {food ? (
          <div className={both ? 'border-b border-line lg:border-b-0' : ''}>
            <OfferingBand band={food} tone="cream" />
          </div>
        ) : null}
        {coffee ? <OfferingBand band={coffee} tone="white" /> : null}
      </div>
    </section>
  );
}
