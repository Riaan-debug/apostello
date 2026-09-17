import { unstable_cache } from 'next/cache';
import { supabaseAnonymous } from '@/lib/supabase/server';
import type { Business, GalleryImage, MenuItem, MenuItemSize, SiteContent } from '@/lib/db/types';
import { hasSupabaseEnv } from '@/lib/env';
import {
  FALLBACK_COFFEE_BODY,
  FALLBACK_COFFEE_HEADING,
  FALLBACK_COFFEE_PHOTOS,
  FALLBACK_FOOD_BODY,
  FALLBACK_FOOD_HEADING,
  FALLBACK_FOOD_PHOTOS,
  FALLBACK_HOURS,
  FALLBACK_INSTAGRAM_URL,
  FALLBACK_MAPS_URL,
  fallbackSiteData,
} from '@/lib/fallback-site';

export const SITE_TAG = 'site-content';
export const MENU_TAG = 'public-menu';

export { imageUrl } from '@/lib/images';

export interface PublicMenuGroup {
  category: string;
  items: (MenuItem & { sizes: MenuItemSize[] })[];
}

export interface SiteData {
  business: Business | null;
  content: SiteContent | null;
  menu: PublicMenuGroup[];
}

const CATEGORY_ORDER = ['Espresso', 'Milk-based', 'Speciality', 'Cold', 'Food', 'Other'];

/** Keep the starter food shots until Hub has its own list (more than the original hot dog). */
function starterFoodPhotos(stored: GalleryImage[] | null | undefined): GalleryImage[] {
  const db = Array.isArray(stored) ? stored : [];
  const onlyOriginalHotDog =
    db.length === 1 && db[0]?.path === '/site/food-hot-dog.jpg';
  if (db.length === 0 || onlyOriginalHotDog) return FALLBACK_FOOD_PHOTOS;
  return db;
}

/**
 * Everything the public website needs, in one cached read. Tagged so the hub
 * can push a new special or price live immediately instead of waiting for the
 * revalidation window.
 */
export const getSiteData = unstable_cache(
  async (): Promise<SiteData> => {
    // The website must still build and serve if the database is unreachable or
    // the environment is not wired up yet. Café copy, hours and the menu come
    // from the fallback so Google and customers still see a real site.
    if (!hasSupabaseEnv()) {
      return fallbackSiteData();
    }

    try {
      const supabase = supabaseAnonymous();

      const [businessResult, contentResult, itemsResult, sizesResult] = await Promise.all([
        supabase.from('businesses').select('*').order('created_at').limit(1).maybeSingle(),
        supabase.from('site_content').select('*').limit(1).maybeSingle(),
        supabase
          .from('menu_items')
          .select('*')
          .eq('active', true)
          .eq('show_on_site', true)
          .order('position'),
        supabase.from('menu_item_sizes').select('*').order('position'),
      ]);

      if (businessResult.error && itemsResult.error) {
        console.warn('[site] could not reach Supabase, serving fallback copy');
        return fallbackSiteData();
      }

      const items = itemsResult.data ?? [];
      const sizes = sizesResult.data ?? [];

      const sizesByItem = new Map<string, MenuItemSize[]>();
      for (const size of sizes) {
        const list = sizesByItem.get(size.menu_item_id) ?? [];
        list.push(size);
        sizesByItem.set(size.menu_item_id, list);
      }

      const grouped = new Map<string, PublicMenuGroup>();
      for (const item of items) {
        const group = grouped.get(item.category) ?? { category: item.category, items: [] };
        group.items.push({ ...item, sizes: sizesByItem.get(item.id) ?? [] });
        grouped.set(item.category, group);
      }

      const menu = [...grouped.values()].sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.category);
        const bi = CATEGORY_ORDER.indexOf(b.category);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });

      const business = businessResult.data ?? null;
      const raw = contentResult.data ?? null;
      const content = raw
        ? {
            ...raw,
            hours: Array.isArray(raw.hours) && raw.hours.length > 0 ? raw.hours : FALLBACK_HOURS,
            maps_url: raw.maps_url || FALLBACK_MAPS_URL,
            instagram_url: raw.instagram_url || FALLBACK_INSTAGRAM_URL,
            videos: Array.isArray(raw.videos) ? raw.videos : [],
            hero_video_path: raw.hero_video_path ?? null,
            food_heading: raw.food_heading || FALLBACK_FOOD_HEADING,
            food_body: raw.food_body || FALLBACK_FOOD_BODY,
            food_photos: starterFoodPhotos(raw.food_photos),
            coffee_heading: raw.coffee_heading || FALLBACK_COFFEE_HEADING,
            coffee_body: raw.coffee_body || FALLBACK_COFFEE_BODY,
            coffee_photos: Array.isArray(raw.coffee_photos)
              ? raw.coffee_photos
              : FALLBACK_COFFEE_PHOTOS,
          }
        : null;

      if (!business && !content && menu.length === 0) {
        return fallbackSiteData();
      }

      return { business, content, menu };
    } catch (error) {
      console.warn('[site] supabase client failed, serving fallback copy', error);
      return fallbackSiteData();
    }
  },
  ['site-data'],
  { tags: [SITE_TAG, MENU_TAG], revalidate: 600 },
);

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function sortedHours(content: SiteContent | null) {
  const hours = Array.isArray(content?.hours) ? content.hours : [];
  return [...hours].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
}

/** "Open now" / "Opens 06:30" — computed in South African time. */
export function openStatus(content: SiteContent | null): { open: boolean; label: string } {
  const hours = sortedHours(content);
  if (hours.length === 0) return { open: false, label: 'Hours coming soon' };

  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
  const todayName = DAY_ORDER[(now.getDay() + 6) % 7];
  const todayHours = hours.find((h) => h.day === todayName);

  if (!todayHours || todayHours.closed || !todayHours.open) {
    const next = nextOpenDay(hours, todayName);
    return { open: false, label: next ? `Closed · opens ${next.day} ${next.open}` : 'Closed today' };
  }

  const minutes = now.getHours() * 60 + now.getMinutes();
  const from = toMinutes(todayHours.open);
  const to = toMinutes(todayHours.close);

  if (minutes < from) return { open: false, label: `Opens at ${todayHours.open}` };
  if (minutes >= to) {
    const next = nextOpenDay(hours, todayName);
    return { open: false, label: next ? `Closed · opens ${next.day} ${next.open}` : 'Closed for today' };
  }
  return { open: true, label: `Open until ${todayHours.close}` };
}

function nextOpenDay(hours: ReturnType<typeof sortedHours>, todayName: string) {
  const start = DAY_ORDER.indexOf(todayName);
  for (let step = 1; step <= 7; step += 1) {
    const day = DAY_ORDER[(start + step) % 7];
    const match = hours.find((h) => h.day === day && !h.closed && h.open);
    if (match) return match;
  }
  return null;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
