import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Coffee, MapPin, Sparkles } from 'lucide-react';
import { getSiteData, imageUrl, openStatus, sortedHours } from '@/lib/content';
import { HomeBands } from '@/components/site/HomeBands';
import { Hours } from '@/components/site/Hours';
import { MenuGroups } from '@/components/site/MenuGroups';
import { StructuredData } from '@/components/site/StructuredData';

export const revalidate = 600;

export default async function HomePage() {
  const { business, content, menu } = await getSiteData();
  const status = openStatus(content);
  const hours = sortedHours(content);
  const hero = imageUrl(content?.hero_image_path);
  const heroVideo = imageUrl(content?.hero_video_path);
  const specialImage = imageUrl(content?.special_image_path);
  const gallery = (Array.isArray(content?.gallery) ? content.gallery : []).slice(0, 6);
  const videos = (Array.isArray(content?.videos) ? content.videos : [])
    .map((clip) => ({ ...clip, src: imageUrl(clip.path) }))
    .filter((clip): clip is typeof clip & { src: string } => Boolean(clip.src));
  const foodPhotos = (Array.isArray(content?.food_photos) ? content.food_photos : [])
    .map((photo) => ({ src: imageUrl(photo.path), alt: photo.alt || '' }))
    .filter((photo): photo is { src: string; alt: string } => Boolean(photo.src));
  const coffeePhotos = (Array.isArray(content?.coffee_photos) ? content.coffee_photos : [])
    .map((photo) => ({ src: imageUrl(photo.path), alt: photo.alt || '' }))
    .filter((photo): photo is { src: string; alt: string } => Boolean(photo.src));
  const hasFoodOnMenu = menu.some((group) => group.category.toLowerCase() === 'food');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://apostellocoffee.co.za';

  // Two categories is enough of a taste on the home page; the rest is /menu.
  const highlights = menu.slice(0, 2);

  return (
    <>
      <StructuredData business={business} content={content} menu={menu} siteUrl={siteUrl} />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink text-cream">
        {heroVideo ? (
          <video
            className="absolute inset-0 size-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={hero ?? undefined}
          >
            <source src={heroVideo} />
          </video>
        ) : hero ? (
          <Image
            src={hero}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover scale-[1.02]"
          />
        ) : null}

        {(heroVideo || hero) && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0"
            style={{
              width: 'min(70vw, 56rem)',
              background:
                'linear-gradient(to right, color-mix(in srgb, var(--color-ink) 58%, transparent) 0%, color-mix(in srgb, var(--color-ink) 32%, transparent) 40%, transparent 82%)',
            }}
          />
        )}

        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <div className="relative max-w-2xl">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                status.open
                  ? 'border-good/40 bg-good/15 text-cream'
                  : 'border-cream/20 bg-cream/8 text-cream/70'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${status.open ? 'animate-pulse bg-good' : 'bg-cream/40'}`}
              />
              {status.label}
            </span>

            <h1 className="mt-6 text-4xl leading-[1.05] font-semibold sm:text-6xl">
              {content?.hero_headline || 'Speciality coffee at CMV Business Park'}
            </h1>

            <p className="mt-5 text-lg text-cream/85 italic">
              {content?.hero_subline || business?.slogan || 'not just served, Sent.'}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-cream px-6 font-semibold text-ink transition-colors hover:bg-cream-deep"
              >
                <Coffee className="size-4" />
                See the menu
              </Link>
              <Link
                href="/visit"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-cream/30 px-6 font-semibold text-cream transition-colors hover:border-cream/70"
              >
                <MapPin className="size-4" />
                Find the trailer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── This week's special ──────────────────────────────────────── */}
      {content?.special_active && content.special_title && (
        <section className="border-b border-line bg-cream-deep">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 sm:flex-row sm:items-start">
            {specialImage && (
              <div className="w-44 shrink-0 sm:w-48">
                <Image
                  src={specialImage}
                  alt={content.special_title}
                  width={800}
                  height={1200}
                  sizes="192px"
                  className="h-auto w-full rounded-[14px]"
                />
              </div>
            )}
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">
                <Sparkles className="size-3.5" />
                This week at the trailer
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">{content.special_title}</h2>
              {content.special_body && (
                <p className="mt-3 max-w-prose text-steel">{content.special_body}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <h2 className="text-3xl font-semibold text-ink">From the trailer</h2>
            <p className="mt-2 text-steel">A look at the coffee, the park, the morning rush.</p>
            <div
              className={`mt-8 grid justify-items-center gap-6 ${
                videos.length === 1 ? '' : videos.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {videos.map((clip) => (
                <figure key={clip.path} className="w-full max-w-[20rem]">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-[9/16] w-full rounded-[14px] bg-ink object-cover"
                  >
                    <source src={clip.src} />
                  </video>
                  {clip.title ? (
                    <figcaption className="mt-2.5 text-sm text-steel">{clip.title}</figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <HomeBands
        food={
          foodPhotos.length > 0
            ? {
                heading: content?.food_heading || "What's cooking",
                body: content?.food_body || '',
                photos: foodPhotos,
                href: hasFoodOnMenu ? '/menu#food' : '/menu',
                cta: hasFoodOnMenu ? 'See the food' : 'See the menu',
              }
            : null
        }
        coffee={
          coffeePhotos.length > 0
            ? {
                heading: content?.coffee_heading || 'Home Blend',
                body: content?.coffee_body || '',
                photos: coffeePhotos,
                href: '/menu#coffee',
                cta: 'See the drinks',
              }
            : null
        }
      />

      {/* ── Menu taster ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-ink">What we pour</h2>
            <p className="mt-2 text-steel">
              Dialled in every morning. Oat milk is always available at no extra charge.
            </p>
          </div>
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline"
          >
            Full menu
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <MenuGroups groups={highlights} />
      </section>

      {/* ── About + hours ────────────────────────────────────────────── */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-20 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-steel uppercase">
              {content?.about_heading || 'Est. 26'}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-ink">Small trailer, serious coffee</h2>
            <p className="mt-5 max-w-prose leading-relaxed text-steel">
              {content?.about_body ||
                'A small trailer with a serious espresso machine, parked where the working day actually happens.'}
            </p>

            <Link
              href="/join"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-cream transition-colors hover:bg-ink-soft"
            >
              Get a loyalty card
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-[14px] border border-line bg-cream p-7">
            <h3 className="text-lg font-semibold text-ink">Opening hours</h3>
            <div className="mt-4">
              <Hours hours={hours} note={content?.hours_note} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery ──────────────────────────────────────────────────── */}
      {gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="mb-8 text-3xl font-semibold text-ink">At the trailer</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((photo, index) => {
              const src = imageUrl(photo.path);
              if (!src) return null;
              return (
                <div
                  key={photo.path}
                  className="relative aspect-square overflow-hidden rounded-[12px] bg-ink-wash"
                >
                  <Image
                    src={src}
                    alt={photo.alt || ''}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    loading={index < 3 ? 'eager' : 'lazy'}
                    className="object-cover"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
