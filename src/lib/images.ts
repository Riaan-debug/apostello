/**
 * Kept apart from `@/lib/content` so client components can build image URLs
 * without dragging the server-only Supabase client into the browser bundle.
 */

const BUCKET = 'site-images';

/** Public URL for a path stored in the site-images bucket. */
export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;

  return `${base}/storage/v1/object/public/${BUCKET}/${path.replace(/^\/+/, '')}`;
}

export const SITE_IMAGE_BUCKET = BUCKET;
