import type { Metadata } from 'next';
import { MapPin, Navigation } from 'lucide-react';
import { getSiteData, openStatus, sortedHours } from '@/lib/content';
import { FALLBACK_MAPS_URL } from '@/lib/fallback-site';
import { Hours } from '@/components/site/Hours';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Hours & location',
  description:
    'Apostellō Coffee Co. trades at CMV Business Park, weekdays from 06:30. Opening hours, directions and contact details.',
  alternates: { canonical: '/visit' },
};

export default async function VisitPage() {
  const { content } = await getSiteData();
  const status = openStatus(content);
  const hours = sortedHours(content);
  const mapsUrl = content?.maps_url || FALLBACK_MAPS_URL;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <header className="mb-14">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-steel uppercase">
          Find the trailer
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">
          {content?.address_line || 'CMV Business Park'}
        </h1>
        <p className="mt-4 text-lg font-semibold text-ink">{status.label}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="order-2 lg:order-1">
          {content?.maps_embed_url ? (
            <iframe
              title="Map to Apostellō Coffee Co."
              src={content.maps_embed_url}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-4/3 w-full rounded-[14px] border border-line bg-ink-wash"
            />
          ) : (
            <div className="flex aspect-4/3 w-full flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-line bg-white text-center">
              <MapPin className="size-8 text-steel-light" />
              <p className="max-w-xs text-sm text-steel">
                Use Get directions below. An embedded map can be added in the hub once the Google
                listing is claimed.
              </p>
            </div>
          )}

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-cream transition-colors hover:bg-ink-soft"
            >
              <Navigation className="size-4" />
              Get directions
            </a>
          )}
        </div>

        <aside className="order-1 space-y-8 lg:order-2">
          <div className="rounded-[14px] border border-line bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Opening hours</h2>
            <div className="mt-4">
              <Hours hours={hours} note={content?.hours_note} />
            </div>
          </div>

          {(content?.phone || content?.email || content?.whatsapp_url) && (
            <div className="rounded-[14px] border border-line bg-white p-6">
              <h2 className="text-lg font-semibold text-ink">Contact</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {content.phone && (
                  <li>
                    <a
                      href={`tel:${content.phone.replace(/\s/g, '')}`}
                      className="font-medium text-ink underline-offset-4 hover:underline"
                    >
                      {content.phone}
                    </a>
                  </li>
                )}
                {content.email && (
                  <li>
                    <a
                      href={`mailto:${content.email}`}
                      className="font-medium text-ink underline-offset-4 hover:underline"
                    >
                      {content.email}
                    </a>
                  </li>
                )}
                {content.whatsapp_url && (
                  <li>
                    <a
                      href={content.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-ink underline-offset-4 hover:underline"
                    >
                      Message us on WhatsApp
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="rounded-[14px] bg-ink p-6 text-cream">
            <h2 className="text-lg font-semibold">Catering &amp; events</h2>
            <p className="mt-2 text-sm text-cream/70">
              The trailer travels. Get in touch about markets, office mornings and private events.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
