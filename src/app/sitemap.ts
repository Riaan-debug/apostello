import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://apostellocoffee.co.za';
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/menu`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/visit`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/join`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
  ];
}
