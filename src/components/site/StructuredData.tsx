import type { Business, OpeningHour, SiteContent } from '@/lib/db/types';
import type { PublicMenuGroup } from '@/lib/content';

const DAY_SCHEMA: Record<string, string> = {
  Monday: 'Monday',
  Tuesday: 'Tuesday',
  Wednesday: 'Wednesday',
  Thursday: 'Thursday',
  Friday: 'Friday',
  Saturday: 'Saturday',
  Sunday: 'Sunday',
};

/**
 * schema.org CafeOrCoffeeShop. This is what lets Google show the hours, the
 * address and the price range in search — the "Google page" half of the job
 * that code can actually do. Claiming the Business Profile is still a manual
 * checklist item; see docs/HANDOVER.md.
 */
export function StructuredData({
  business,
  content,
  menu,
  siteUrl,
}: {
  business: Business | null;
  content: SiteContent | null;
  menu: PublicMenuGroup[];
  siteUrl: string;
}) {
  const hours: OpeningHour[] = Array.isArray(content?.hours) ? content.hours : [];
  const prices = menu.flatMap((g) => g.items.flatMap((i) => i.sizes.map((s) => Number(s.price))));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: business?.name ?? 'Apostellō Coffee Co.',
    slogan: business?.slogan ?? undefined,
    url: siteUrl,
    image: `${siteUrl}/og-image.png`,
    servesCuisine: 'Coffee',
    priceRange: prices.length > 0 ? `R${Math.min(...prices)}–R${Math.max(...prices)}` : undefined,
    currenciesAccepted: 'ZAR',
    paymentAccepted: 'Card, Cash',
    telephone: content?.phone || undefined,
    email: content?.email || undefined,
    address: content?.address_line
      ? {
          '@type': 'PostalAddress',
          streetAddress: content.address_line,
          addressCountry: 'ZA',
        }
      : undefined,
    hasMap: content?.maps_url || undefined,
    sameAs: [content?.instagram_url, content?.facebook_url].filter(Boolean),
    openingHoursSpecification: hours
      .filter((h) => !h.closed && h.open)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${DAY_SCHEMA[h.day] ?? h.day}`,
        opens: h.open,
        closes: h.close,
      })),
    hasMenu: {
      '@type': 'Menu',
      url: `${siteUrl}/menu`,
      hasMenuSection: menu.map((group) => ({
        '@type': 'MenuSection',
        name: group.category,
        hasMenuItem: group.items.map((item) => ({
          '@type': 'MenuItem',
          name: item.name,
          description: item.description || undefined,
          offers: item.sizes.map((size) => ({
            '@type': 'Offer',
            name: size.label,
            price: Number(size.price).toFixed(2),
            priceCurrency: 'ZAR',
          })),
        })),
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      // Values come from our own database, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
