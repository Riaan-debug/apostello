import Link from 'next/link';
import { Instagram, Facebook, MessageCircle, Mail, Phone } from 'lucide-react';
import { Wordmark } from '@/components/Wordmark';
import { getSiteData, openStatus } from '@/lib/content';
import { FALLBACK_MAPS_URL } from '@/lib/fallback-site';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { business, content } = await getSiteData();
  const status = openStatus(content);
  const year = new Date().getFullYear();
  const mapsUrl = content?.maps_url || FALLBACK_MAPS_URL;

  const socials = [
    { href: content?.instagram_url, label: 'Instagram', Icon: Instagram },
    { href: content?.facebook_url, label: 'Facebook', Icon: Facebook },
    { href: content?.whatsapp_url, label: 'WhatsApp', Icon: MessageCircle },
  ].filter((s) => Boolean(s.href) && !/^https?:\/\/(www\.)?(instagram|facebook)\.com\/?$/i.test(s.href!));

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" aria-label="Apostellō Coffee Co. home">
            <Wordmark size="md" />
          </Link>

          <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
            <Link
              href="/menu"
              className="rounded-full px-3 py-2 text-ink transition-colors hover:bg-ink-wash"
            >
              Menu
            </Link>
            <Link
              href="/visit"
              className="rounded-full px-3 py-2 text-ink transition-colors hover:bg-ink-wash"
            >
              Visit
            </Link>
            <Link
              href="/join"
              className="ml-1 rounded-full bg-ink px-4 py-2 text-cream transition-colors hover:bg-ink-soft"
            >
              Loyalty
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-ink text-cream">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Wordmark tone="cream" size="lg" withTagline />
            <p className="mt-4 text-sm text-cream/60 italic">
              {business?.slogan || 'not just served, Sent.'}
            </p>
          </div>

          <div>
            <h2 className="text-[11px] font-semibold tracking-[0.14em] text-cream/45 uppercase">
              Find us
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/80">
              {content?.address_line || 'CMV Business Park'}
            </p>
            <p className="mt-2 text-sm font-semibold text-cream">{status.label}</p>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-cream/70 underline underline-offset-4 hover:text-cream"
              >
                Open in Google Maps
              </a>
            )}
          </div>

          <div>
            <h2 className="text-[11px] font-semibold tracking-[0.14em] text-cream/45 uppercase">
              Get in touch
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-cream/80">
              {content?.phone && (
                <li>
                  <a
                    href={`tel:${content.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-2 hover:text-cream"
                  >
                    <Phone className="size-3.5" /> {content.phone}
                  </a>
                </li>
              )}
              {content?.email && (
                <li>
                  <a
                    href={`mailto:${content.email}`}
                    className="inline-flex items-center gap-2 hover:text-cream"
                  >
                    <Mail className="size-3.5" /> {content.email}
                  </a>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="mt-4 flex gap-2">
                {socials.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href!}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="rounded-full border border-cream/20 p-2.5 text-cream/70 transition-colors hover:border-cream/50 hover:text-cream"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[11px] font-semibold tracking-[0.14em] text-cream/45 uppercase">
              More
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-cream/80">
              <li>
                <Link href="/menu" className="hover:text-cream">
                  Full menu
                </Link>
              </li>
              <li>
                <Link href="/visit" className="hover:text-cream">
                  Hours &amp; location
                </Link>
              </li>
              <li>
                <Link href="/join" className="hover:text-cream">
                  Join the loyalty card
                </Link>
              </li>
              <li>
                <Link href="/hub" className="text-cream/45 hover:text-cream">
                  Staff hub
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/10 px-5 py-5">
          <p className="mx-auto max-w-6xl text-xs text-cream/40">
            © {year} {business?.name || 'Apostellō Coffee Co.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
