import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://apostellocoffee.co.za';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The staff hub and the kiosk are behind auth anyway, but there is no
        // reason for them to appear in search results.
        disallow: ['/hub', '/kiosk', '/login', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
