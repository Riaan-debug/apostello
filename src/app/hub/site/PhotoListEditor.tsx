'use client';

import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/form';
import { imageUrl } from '@/lib/images';
import { uploadSiteImage } from './upload';

export type SitePhoto = { path: string; alt: string };

export function PhotoListEditor({
  title,
  subtitle,
  folder,
  photos,
  onChange,
  onError,
  max = 8,
  emptyTitle,
  emptyHint,
  altPlaceholder,
}: {
  title: string;
  subtitle: string;
  folder: string;
  photos: SitePhoto[];
  onChange: (photos: SitePhoto[]) => void;
  onError: (message: string) => void;
  max?: number;
  emptyTitle: string;
  emptyHint: string;
  altPlaceholder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (photos.length >= max) {
      onError(`${max} photos is the cap. Remove one first.`);
      return;
    }

    setBusy(true);
    const added: SitePhoto[] = [];
    for (const file of Array.from(files).slice(0, max - photos.length)) {
      const result = await uploadSiteImage(folder, file);
      if ('error' in result) {
        onError(result.error);
        continue;
      }
      added.push({ path: result.path, alt: '' });
    }
    setBusy(false);
    if (added.length > 0) onChange([...photos, ...added].slice(0, max));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={busy}
            disabled={photos.length >= max}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-3.5" />
            Add photos
          </Button>
        }
      />
      <CardBody>
        {photos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[10px] border border-dashed border-line py-10 text-center">
            {busy ? (
              <Loader2 className="size-5 animate-spin text-steel-light" />
            ) : (
              <ImagePlus className="size-5 text-steel-light" />
            )}
            <p className="text-sm font-semibold text-ink">{emptyTitle}</p>
            <p className="max-w-sm text-xs text-steel">{emptyHint}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {photos.map((image, index) => {
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
                      label={`Photo ${index + 1}`}
                      hint="Describe the photo in a few words, for screen readers and Google."
                    >
                      <Input
                        value={image.alt}
                        onChange={(event) =>
                          onChange(
                            photos.map((row, i) =>
                              i === index ? { ...row, alt: event.target.value } : row,
                            ),
                          )
                        }
                        placeholder={altPlaceholder}
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
                      disabled={index === photos.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label="Remove photo"
                      onClick={() => onChange(photos.filter((_, i) => i !== index))}
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
