-- ═══════════════════════════════════════════════════════════════════════════
-- Apostellō — 0007 home offerings
--
-- Food and coffee photo bands on the public home page. Bjorn edits these in
-- Hub → Website. Files still live in the site-images bucket.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.site_content
  add column if not exists food_heading text not null default '';

alter table public.site_content
  add column if not exists food_body text not null default '';

alter table public.site_content
  add column if not exists food_photos jsonb not null default '[]'::jsonb;

alter table public.site_content
  add column if not exists coffee_heading text not null default '';

alter table public.site_content
  add column if not exists coffee_body text not null default '';

alter table public.site_content
  add column if not exists coffee_photos jsonb not null default '[]'::jsonb;

-- Seed the first photos only while both bands are still empty, so a later
-- push does not overwrite anything Bjorn has already swapped in the hub.
update public.site_content
set
  food_heading = 'What''s cooking',
  food_body = 'Bites from the trailer — ask what is on today.',
  food_photos = '[
    {"path":"/site/food-hot-dog.jpg","alt":"Loaded hot dog from the Apostellō trailer"}
  ]'::jsonb,
  coffee_heading = 'Home Blend',
  coffee_body = 'Roasted for the park. Cups at the trailer, bags to take home.',
  coffee_photos = '[
    {"path":"/site/coffee-home-blend.jpg","alt":"Apostellō Home Blend bag on roasted beans"},
    {"path":"/site/coffee-roast.jpg","alt":"Roasting Home Blend at the machine"}
  ]'::jsonb
where food_photos = '[]'::jsonb
  and coffee_photos = '[]'::jsonb;

