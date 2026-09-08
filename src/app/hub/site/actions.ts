'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { MENU_TAG, SITE_TAG } from '@/lib/content';

export type ActionResult = { ok: true } | { ok: false; error: string };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const clockTime = z
  .string()
  .trim()
  .refine((value) => value === '' || TIME.test(value), 'Opening times must look like 06:30.');

const optionalLink = z
  .string()
  .trim()
  .max(600)
  .refine(
    (value) => value === '' || /^https?:\/\/\S+$/.test(value),
    'Links must start with https:// so they open properly.',
  );

const hourSchema = z.object({
  day: z.string().trim().min(1).max(20),
  open: clockTime,
  close: clockTime,
  closed: z.boolean(),
});

const galleryImageSchema = z.object({
  path: z.string().trim().min(1).max(400),
  alt: z.string().trim().max(200),
});

const siteVideoSchema = z.object({
  path: z.string().trim().min(1).max(400),
  title: z.string().trim().max(80),
});

const siteContentSchema = z.object({
  hero_headline: z.string().trim().max(140),
  hero_subline: z.string().trim().max(220),
  hero_image_path: z.string().trim().max(400).nullable(),
  hero_video_path: z.string().trim().max(400).nullable(),
  about_heading: z.string().trim().max(80),
  about_body: z.string().trim().max(2000),
  special_title: z.string().trim().max(120),
  special_body: z.string().trim().max(1000),
  special_image_path: z.string().trim().max(400).nullable(),
  special_active: z.boolean(),
  address_line: z.string().trim().max(200),
  maps_url: optionalLink,
  maps_embed_url: optionalLink,
  phone: z.string().trim().max(40),
  email: z.string().trim().max(160),
  whatsapp_url: optionalLink,
  instagram_url: optionalLink,
  facebook_url: optionalLink,
  hours: z.array(hourSchema).max(7),
  hours_note: z.string().trim().max(300),
  gallery: z.array(galleryImageSchema).max(24),
  videos: z.array(siteVideoSchema).max(4),
});

export type SiteContentInput = z.infer<typeof siteContentSchema>;

function firstIssue(issues: { message: string }[]): string {
  return issues[0]?.message ?? 'Please check the fields and try again.';
}

export async function saveSiteContent(input: SiteContentInput): Promise<ActionResult> {
  const session = await requireStaff();

  const parsed = siteContentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error.issues) };
  }

  const content = parsed.data;

  if (content.special_active && !content.special_title) {
    return { ok: false, error: 'Give the special a title before switching it on.' };
  }
  if (content.email && !z.email().safeParse(content.email).success) {
    return { ok: false, error: 'That email address does not look right.' };
  }

  // A day with no times is a closed day, whichever way the tick box was left.
  const hours = content.hours.map((day) =>
    day.closed || (!day.open && !day.close)
      ? { ...day, closed: true, open: '', close: '' }
      : day,
  );

  for (const day of hours) {
    if (day.closed) continue;
    if (!day.open || !day.close) {
      return { ok: false, error: `${day.day} needs both an opening and a closing time.` };
    }
    if (day.close <= day.open) {
      return { ok: false, error: `${day.day} closes before it opens. Check those times.` };
    }
  }

  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.from('site_content').upsert(
      {
        ...content,
        hours,
        business_id: session.business.id,
        hero_image_path: content.hero_image_path || null,
        hero_video_path: content.hero_video_path || null,
        special_image_path: content.special_image_path || null,
      },
      { onConflict: 'business_id' },
    );

    if (error) {
      return { ok: false, error: 'The website did not save. Please try again in a moment.' };
    }
  } catch {
    return { ok: false, error: 'The website did not save. Please try again in a moment.' };
  }

  revalidateTag(SITE_TAG);
  revalidateTag(MENU_TAG);
  revalidatePath('/hub/site');

  return { ok: true };
}
