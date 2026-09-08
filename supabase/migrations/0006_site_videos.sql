-- ═══════════════════════════════════════════════════════════════════════════
-- Apostellō — 0006 site videos
--
-- Café ads and trailer clips. Paths live in site_content; files live in the
-- existing public bucket. Size cap is 50 MB so a compressed 1080p MP4 fits
-- without eating the free-tier storage in one go.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.site_content
  add column if not exists hero_video_path text;

alter table public.site_content
  add column if not exists videos jsonb not null default '[]'::jsonb;

update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'video/mp4',
    'video/webm'
  ]
where id = 'site-images';
