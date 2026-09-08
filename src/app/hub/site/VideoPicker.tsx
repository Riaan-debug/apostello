'use client';

import { useRef, useState } from 'react';
import { Film, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { imageUrl } from '@/lib/images';
import { uploadSiteVideo } from './upload';

export function VideoPicker({
  folder,
  value,
  onChange,
  hint,
}: {
  folder: string;
  value: string | null;
  onChange: (path: string | null) => void;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = imageUrl(value);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    const result = await uploadSiteVideo(folder, file);
    setBusy(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    onChange(result.path);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid h-28 w-40 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-line bg-cream">
          {preview ? (
            <video src={preview} muted playsInline className="size-full object-cover" />
          ) : busy ? (
            <Loader2 className="size-5 animate-spin text-steel-light" />
          ) : (
            <Film className="size-5 text-steel-light" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={busy}
              onClick={() => inputRef.current?.click()}
            >
              {value ? 'Replace video' : 'Choose video'}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-steel">{hint}</p>
          <p className="mt-1 text-[11px] text-steel-light">
            MP4 or WebM, up to 50 MB. 1080p is plenty. iPhone videos must be saved as MP4, not
            Live Photos or .MOV.
          </p>
          {error && <p className="mt-1 text-[11px] font-medium text-bad">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        onChange={(event) => {
          void pick(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}
