'use client';

import { supabaseBrowser } from '@/lib/supabase/client';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const BUCKET = 'site-images';

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);

export type UploadResult = { path: string } | { error: string };

function safeFileName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'file';
}

/**
 * Returns the storage path, never the public URL: the database keeps paths so
 * the project can move behind a CDN without rewriting every row.
 */
export async function uploadSiteImage(folder: string, file: File): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) {
    return { error: `${file.name} is not an image.` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `${file.name} is bigger than 5 MB. Please shrink it and try again.` };
  }

  return uploadToBucket(folder, file);
}

export async function uploadSiteVideo(folder: string, file: File): Promise<UploadResult> {
  if (!VIDEO_TYPES.has(file.type)) {
    return {
      error: `${file.name} needs to be an MP4 or WebM. iPhone clips: Share → Save to Files as MP4, or export from Photos.`,
    };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return {
      error: `${file.name} is bigger than 50 MB. Compress it to 1080p MP4 and try again.`,
    };
  }

  return uploadToBucket(folder, file);
}

async function uploadToBucket(folder: string, file: File): Promise<UploadResult> {
  const path = `${folder}/${Date.now()}-${safeFileName(file.name)}`;

  const { error } = await supabaseBrowser()
    .storage.from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) {
    return { error: 'That upload did not go through. Check your signal and try again.' };
  }

  return { path };
}
