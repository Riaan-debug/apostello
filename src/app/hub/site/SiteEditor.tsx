'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Film,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Business, SiteContent } from '@/lib/db/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, SectionHeading } from '@/components/ui/Card';
import { Checkbox, Field, FormGrid, Input, Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import { imageUrl } from '@/lib/images';
import { ImagePicker } from './ImagePicker';
import { VideoPicker } from './VideoPicker';
import { saveSiteContent, type SiteContentInput } from './actions';
import { uploadSiteImage, uploadSiteVideo } from './upload';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function initialForm(content: SiteContent | null, business: Business): SiteContentInput {
  const existing = new Map(
    (Array.isArray(content?.hours) ? content.hours : []).map((hour) => [hour.day, hour]),
  );

  return {
    hero_headline: content?.hero_headline ?? '',
    hero_subline: content?.hero_subline ?? business.slogan ?? '',
    hero_image_path: content?.hero_image_path ?? null,
    hero_video_path: content?.hero_video_path ?? null,
    about_heading: content?.about_heading ?? '',
    about_body: content?.about_body ?? '',
    special_title: content?.special_title ?? '',
    special_body: content?.special_body ?? '',
    special_image_path: content?.special_image_path ?? null,
    special_active: content?.special_active ?? false,
    address_line: content?.address_line ?? '',
    maps_url: content?.maps_url ?? '',
    maps_embed_url: content?.maps_embed_url ?? '',
    phone: content?.phone ?? '',
    email: content?.email ?? '',
    whatsapp_url: content?.whatsapp_url ?? '',
    instagram_url: content?.instagram_url ?? '',
    facebook_url: content?.facebook_url ?? '',
    hours: DAYS.map((day) => {
      const row = existing.get(day);
      return {
        day,
        open: row?.open ?? '',
        close: row?.close ?? '',
        closed: row?.closed ?? false,
      };
    }),
    hours_note: content?.hours_note ?? '',
    gallery: (Array.isArray(content?.gallery) ? content.gallery : []).map((image) => ({
      path: image.path,
      alt: image.alt ?? '',
    })),
    videos: (Array.isArray(content?.videos) ? content.videos : []).map((video) => ({
      path: video.path,
      title: video.title ?? '',
    })),
  };
}

export function SiteEditor({
  content,
  business,
}: {
  content: SiteContent | null;
  business: Business;
}) {
  const toast = useToast();
  const [form, setForm] = useState<SiteContentInput>(() => initialForm(content, business));
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof SiteContentInput>(key: K, value: SiteContentInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function save() {
    startTransition(async () => {
      const result = await saveSiteContent(form);
      if (result.ok) {
        setDirty(false);
        setSavedAt(new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }));
        toast.success('Saved. The website is showing this now.');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="pb-24">
      <SectionHeading
        title="Website"
        subtitle="Everything the public sees, apart from the menu and its prices."
        action={
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-cream"
          >
            <ExternalLink className="size-4" />
            View website
          </Link>
        }
      />

      <div className="space-y-5">
        <Card>
          <CardHeader
            title="Hero"
            subtitle="The first screen. Keep the headline short enough to read from a phone."
          />
          <CardBody className="space-y-4">
            <Field
              label="Headline"
              hint="This is the line people remember. Say where you are and what you pour."
            >
              <Input
                value={form.hero_headline}
                onChange={(event) => update('hero_headline', event.target.value)}
                placeholder="Speciality coffee at CMV Business Park"
              />
            </Field>

            <Field label="Sub-line" hint="One calm sentence under the headline.">
              <Input
                value={form.hero_subline}
                onChange={(event) => update('hero_subline', event.target.value)}
                placeholder={business.slogan || 'not just served, Sent.'}
              />
            </Field>

            <Field label="Hero photo">
              <ImagePicker
                folder="hero"
                value={form.hero_image_path}
                onChange={(path) => update('hero_image_path', path)}
                hint="Sits behind the headline, darkened. A wide shot of the trailer works better than a close-up."
              />
            </Field>

            <Field
              label="Hero video"
              hint="Optional. Plays silently on a loop behind the words. If you set one, it takes the place of the still photo."
            >
              <VideoPicker
                folder="hero"
                value={form.hero_video_path}
                onChange={(path) => update('hero_video_path', path)}
                hint="Use this for a trailer clip or ad. Keep it short. Sound is off so it can autoplay on phones."
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="This week's special"
            subtitle="A single band near the top of the home page."
            action={
              form.special_active ? (
                <Badge tone="good">Showing on the site</Badge>
              ) : (
                <Badge tone="neutral">Hidden</Badge>
              )
            }
          />
          <CardBody className="space-y-4">
            <div className="rounded-[10px] bg-cream p-4">
              <Checkbox
                checked={form.special_active}
                onChange={(event) => update('special_active', event.target.checked)}
                label="Show the special on the website"
                hint="Switched off, the whole band disappears from the home page. The words below stay saved here, ready for next time."
              />
            </div>

            <Field label="Title" hint="What you want people to try this week.">
              <Input
                value={form.special_title}
                onChange={(event) => update('special_title', event.target.value)}
                placeholder="Honey oat flat white"
              />
            </Field>

            <Field label="Description" hint="Two or three lines. What it is, and why it is worth it.">
              <Textarea
                value={form.special_body}
                onChange={(event) => update('special_body', event.target.value)}
                rows={3}
              />
            </Field>

            <Field label="Special photo">
              <ImagePicker
                folder="special"
                value={form.special_image_path}
                onChange={(path) => update('special_image_path', path)}
                hint="Optional. Shown beside the words. A photo of the actual drink sells it."
              />
            </Field>

            {form.special_active && !form.special_title.trim() && (
              <p className="flex items-center gap-2 text-[11px] font-medium text-warn">
                <Sparkles className="size-3.5" />
                Add a title, or the band will not appear even though it is switched on.
              </p>
            )}
          </CardBody>
        </Card>

        <VideosEditor
          videos={form.videos}
          onChange={(videos) => update('videos', videos)}
          onError={toast.error}
        />

        <Card>
          <CardHeader title="About" subtitle="The short paragraph halfway down the home page." />
          <CardBody className="space-y-4">
            <Field label="Small heading" hint="A short label above the paragraph.">
              <Input
                value={form.about_heading}
                onChange={(event) => update('about_heading', event.target.value)}
                placeholder="Est. 26"
              />
            </Field>

            <Field
              label="Paragraph"
              hint="Written to a regular walking past, not to another coffee shop."
            >
              <Textarea
                value={form.about_body}
                onChange={(event) => update('about_body', event.target.value)}
                rows={5}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Opening hours"
            subtitle="Drives the Open now / Closed badge on the site, so keep it honest."
          />
          <CardBody className="space-y-3">
            {form.hours.map((hour, index) => (
              <div
                key={hour.day}
                className="grid items-center gap-3 border-b border-line-soft pb-3 last:border-0 last:pb-0 sm:grid-cols-[7rem_1fr_1fr_9rem]"
              >
                <span className="text-sm font-semibold text-ink">{hour.day}</span>

                <Input
                  type="time"
                  aria-label={`${hour.day} opening time`}
                  value={hour.open}
                  disabled={hour.closed}
                  onChange={(event) =>
                    update(
                      'hours',
                      form.hours.map((row, i) =>
                        i === index ? { ...row, open: event.target.value } : row,
                      ),
                    )
                  }
                />

                <Input
                  type="time"
                  aria-label={`${hour.day} closing time`}
                  value={hour.close}
                  disabled={hour.closed}
                  onChange={(event) =>
                    update(
                      'hours',
                      form.hours.map((row, i) =>
                        i === index ? { ...row, close: event.target.value } : row,
                      ),
                    )
                  }
                />

                <Checkbox
                  checked={hour.closed}
                  label="Closed"
                  onChange={(event) =>
                    update(
                      'hours',
                      form.hours.map((row, i) =>
                        i === index
                          ? event.target.checked
                            ? { ...row, closed: true, open: '', close: '' }
                            : { ...row, closed: false }
                          : row,
                      ),
                    )
                  }
                />
              </div>
            ))}

            <Field
              label="Note under the hours"
              hint="Where public holidays, month-end or private events go."
              className="pt-2"
            >
              <Input
                value={form.hours_note}
                onChange={(event) => update('hours_note', event.target.value)}
                placeholder="Public holidays vary — check Instagram."
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Location & contact"
            subtitle="Used on the Visit page, in the footer and by Google."
          />
          <CardBody className="space-y-4">
            <FormGrid>
              <Field label="Address line" hint="How you would tell someone on the phone.">
                <Input
                  value={form.address_line}
                  onChange={(event) => update('address_line', event.target.value)}
                  placeholder="CMV Business Park"
                />
              </Field>

              <Field label="Phone" hint="Shown as a tap-to-call link on phones.">
                <Input
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                  inputMode="tel"
                  placeholder="082 123 4567"
                />
              </Field>

              <Field label="Email" hint="For enquiries and event bookings.">
                <Input
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  type="email"
                  placeholder="hello@apostellocoffee.co.za"
                />
              </Field>

              <Field
                label="Google Maps link"
                hint="The Share link from Maps. Opens the app for directions."
              >
                <Input
                  value={form.maps_url}
                  onChange={(event) => update('maps_url', event.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </Field>
            </FormGrid>

            <Field
              label="Google Maps embed link"
              hint="From Maps: Share → Embed a map → copy only the src=&quot;...&quot; address. This one draws the map on the page."
            >
              <Input
                value={form.maps_embed_url}
                onChange={(event) => update('maps_embed_url', event.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
            </Field>

            <FormGrid>
              <Field label="WhatsApp link" hint="A wa.me link so people can message without saving the number.">
                <Input
                  value={form.whatsapp_url}
                  onChange={(event) => update('whatsapp_url', event.target.value)}
                  placeholder="https://wa.me/27821234567"
                />
              </Field>

              <Field label="Instagram" hint="Where the daily specials actually live.">
                <Input
                  value={form.instagram_url}
                  onChange={(event) => update('instagram_url', event.target.value)}
                  placeholder="https://www.instagram.com/..."
                />
              </Field>

              <Field label="Facebook" hint="Leave empty if you do not keep it up to date.">
                <Input
                  value={form.facebook_url}
                  onChange={(event) => update('facebook_url', event.target.value)}
                  placeholder="https://www.facebook.com/..."
                />
              </Field>
            </FormGrid>
          </CardBody>
        </Card>

        <GalleryEditor
          gallery={form.gallery}
          onChange={(gallery) => update('gallery', gallery)}
          onError={toast.error}
        />
      </div>

      <div className="sticky bottom-4 z-20 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-line bg-white/95 px-4 py-3 shadow-[0_8px_28px_rgba(1,27,61,0.12)] backdrop-blur-md">
        <p className="text-xs text-steel">
          {dirty
            ? 'Unsaved changes. The website still shows the last saved version.'
            : savedAt
              ? `Saved at ${savedAt}. The live site is updated.`
              : 'Saving publishes straight to the live website.'}
        </p>
        <Button onClick={save} loading={pending} disabled={!dirty && !!savedAt}>
          Save and publish
        </Button>
      </div>
    </div>
  );
}

function VideosEditor({
  videos,
  onChange,
  onError,
}: {
  videos: SiteContentInput['videos'];
  onChange: (videos: SiteContentInput['videos']) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (videos.length >= 4) {
      onError('Four videos is the cap. Remove one first.');
      return;
    }

    setBusy(true);
    const added: SiteContentInput['videos'] = [];
    for (const file of Array.from(files).slice(0, 4 - videos.length)) {
      const result = await uploadSiteVideo('videos', file);
      if ('error' in result) {
        onError(result.error);
        continue;
      }
      added.push({ path: result.path, title: '' });
    }
    setBusy(false);
    if (added.length > 0) onChange([...videos, ...added]);
  }

  return (
    <Card>
      <CardHeader
        title="Videos"
        subtitle="Ads and trailer clips. They sit on the home page with play controls, sound on."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={busy}
            disabled={videos.length >= 4}
            onClick={() => inputRef.current?.click()}
          >
            <Film className="size-3.5" />
            Add video
          </Button>
        }
      />
      <CardBody>
        {videos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[10px] border border-dashed border-line py-10 text-center">
            {busy ? (
              <Loader2 className="size-5 animate-spin text-steel-light" />
            ) : (
              <Film className="size-5 text-steel-light" />
            )}
            <p className="text-sm font-semibold text-ink">No videos yet</p>
            <p className="max-w-sm text-xs text-steel">
              Drop Bjorn&apos;s ads in here. MP4, under 50 MB. The section stays hidden until you
              add one and save.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {videos.map((video, index) => {
              const preview = imageUrl(video.path);
              return (
                <li
                  key={video.path}
                  className="flex flex-wrap items-start gap-3 border-b border-line-soft pb-3 last:border-0 last:pb-0"
                >
                  <div className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-line bg-cream">
                    {preview && (
                      <video src={preview} muted playsInline className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Field
                      label={`Video ${index + 1}`}
                      hint="Optional caption under the player. Leave blank if the clip speaks for itself."
                    >
                      <Input
                        value={video.title}
                        onChange={(event) =>
                          onChange(
                            videos.map((row, i) =>
                              i === index ? { ...row, title: event.target.value } : row,
                            ),
                          )
                        }
                        placeholder="Morning at the trailer"
                      />
                    </Field>
                  </div>
                  <div className="flex shrink-0 pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Remove video"
                      onClick={() => onChange(videos.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="size-4 text-bad" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={(event) => {
            void addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </CardBody>
    </Card>
  );
}

function GalleryEditor({
  gallery,
  onChange,
  onError,
}: {
  gallery: SiteContentInput['gallery'];
  onChange: (gallery: SiteContentInput['gallery']) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);

    const added: SiteContentInput['gallery'] = [];
    for (const file of Array.from(files)) {
      const result = await uploadSiteImage('gallery', file);
      if ('error' in result) {
        onError(result.error);
        continue;
      }
      added.push({ path: result.path, alt: '' });
    }

    setBusy(false);
    if (added.length > 0) onChange([...gallery, ...added].slice(0, 24));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <Card>
      <CardHeader
        title="Photo gallery"
        subtitle="The first six appear on the home page, in this order."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-3.5" />
            Add photos
          </Button>
        }
      />
      <CardBody>
        {gallery.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[10px] border border-dashed border-line py-10 text-center">
            {busy ? (
              <Loader2 className="size-5 animate-spin text-steel-light" />
            ) : (
              <ImagePlus className="size-5 text-steel-light" />
            )}
            <p className="text-sm font-semibold text-ink">No photos yet</p>
            <p className="max-w-xs text-xs text-steel">
              Six good photos beat twenty average ones. The section is hidden while this is empty.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {gallery.map((image, index) => {
              const preview = imageUrl(image.path);
              return (
                <li
                  key={image.path}
                  className="flex flex-wrap items-start gap-3 border-b border-line-soft pb-3 last:border-0 last:pb-0"
                >
                  <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-line bg-cream">
                    {preview && (
                      // eslint-disable-next-line @next/next/no-img-element -- storage host is not in next.config yet
                      <img src={preview} alt={image.alt} className="size-full object-cover" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Field
                      label={index < 6 ? `Photo ${index + 1} · on the home page` : `Photo ${index + 1}`}
                      hint="Describe the photo in a few words, for screen readers and Google."
                    >
                      <Input
                        value={image.alt}
                        onChange={(event) =>
                          onChange(
                            gallery.map((row, i) =>
                              i === index ? { ...row, alt: event.target.value } : row,
                            ),
                          )
                        }
                        placeholder="Flat white on the trailer counter"
                      />
                    </Field>
                  </div>

                  <div className="flex shrink-0 gap-1 pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Move down"
                      disabled={index === gallery.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Remove photo"
                      onClick={() => onChange(gallery.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="size-4 text-bad" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void addFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </Card>
  );
}
