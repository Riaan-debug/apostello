'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Delete, KeyRound, Mail } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { hasSupabaseEnv } from '@/lib/env';
import { deviceId } from '@/lib/device';
import { cn } from '@/lib/cn';

type Mode = 'pin' | 'email';

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>('pin');

  if (!hasSupabaseEnv()) {
    return (
      <div className="rounded-[16px] border border-cream/12 bg-cream/[0.04] p-7 text-center">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-cream/40 uppercase">
          Local preview
        </p>
        <p className="mt-3 text-sm text-cream/80">
          Sample trailer data, not the live café. Connect Supabase when you want stamps to stick.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={next && next.startsWith('/') ? next : '/hub'}
            className="inline-flex h-12 items-center justify-center rounded-[10px] bg-cream font-bold text-ink"
          >
            Open the staff hub
          </a>
          <a
            href="/kiosk"
            className="inline-flex h-12 items-center justify-center rounded-[10px] border border-cream/20 font-semibold text-cream/80 hover:border-cream/50"
          >
            Open the loyalty kiosk
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-cream/12 bg-cream/[0.04] p-7 backdrop-blur-sm">
      <div className="mb-6 flex gap-1 rounded-full bg-ink-deep/60 p-1">
        {(
          [
            { id: 'pin' as Mode, label: 'Staff PIN', Icon: KeyRound },
            { id: 'email' as Mode, label: 'Owner', Icon: Mail },
          ] satisfies { id: Mode; label: string; Icon: typeof KeyRound }[]
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-colors',
              mode === id ? 'bg-cream text-ink' : 'text-cream/50 hover:text-cream/80',
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {mode === 'pin' ? <PinPad next={next} /> : <EmailForm next={next} />}
    </div>
  );
}

/* ── Staff PIN ─────────────────────────────────────────────────────────── */

function PinPad({ next }: { next?: string }) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  async function submit(value: string) {
    if (value.length < 4) {
      setError('A PIN is at least 4 digits.');
      return;
    }

    setBusy(true);
    setError(null);

    const response = await fetch('/api/auth/pin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin: value, deviceId: deviceId() }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      redirect?: string;
    };

    if (!response.ok) {
      setBusy(false);
      setPin('');
      setError(body.error ?? 'That did not work.');
      setShake(true);
      window.setTimeout(() => setShake(false), 450);
      return;
    }

    // A full reload rather than router.push: the layout needs to re-read the
    // session cookie that this request just set.
    window.location.assign(next ?? body.redirect ?? '/hub');
  }

  function press(digit: string) {
    if (busy) return;
    const value = `${pin}${digit}`.slice(0, 8);
    setPin(value);
    setError(null);
  }

  return (
    <div className={cn(shake && 'animate-shake')}>
      <p className="mb-4 text-center text-xs text-cream/45">Enter your PIN to open the hub</p>

      <div className="mb-6 flex justify-center gap-2.5" aria-live="polite">
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'size-2.5 rounded-full transition-colors',
              index < pin.length ? 'bg-cream' : 'bg-cream/15',
            )}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <PadKey key={digit} onClick={() => press(digit)}>
            {digit}
          </PadKey>
        ))}
        <PadKey onClick={() => setPin('')} muted>
          Clear
        </PadKey>
        <PadKey onClick={() => press('0')}>0</PadKey>
        <PadKey onClick={() => setPin((p) => p.slice(0, -1))} muted>
          <Delete className="size-5" />
        </PadKey>
      </div>

      <button
        type="button"
        disabled={busy || pin.length < 4}
        onClick={() => void submit(pin)}
        className="mt-4 h-14 w-full rounded-[12px] bg-cream text-base font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy ? 'Checking…' : 'Sign in'}
      </button>

      <p className="mt-3 min-h-[18px] text-center text-xs font-medium text-[#ff9d94]">{error}</p>
    </div>
  );
}

function PadKey({
  children,
  onClick,
  muted,
}: {
  children: React.ReactNode;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'touch-surface grid h-14 place-items-center rounded-[12px] text-xl font-semibold transition-colors active:scale-[0.97]',
        muted
          ? 'bg-transparent text-cream/40 hover:text-cream/70'
          : 'bg-cream/[0.07] text-cream hover:bg-cream/15',
        muted && 'text-sm',
      )}
    >
      {children}
    </button>
  );
}

/* ── Owner email ───────────────────────────────────────────────────────── */

function EmailForm({ next }: { next?: string }) {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    window.location.assign(next ?? '/hub');
  }

  const inputClass =
    'w-full rounded-[10px] border border-cream/20 bg-cream/[0.06] px-4 py-3 text-sm text-cream ' +
    'placeholder:text-cream/30 focus:border-cream/60 focus:outline-none';

  return (
    <form onSubmit={submit}>
      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="username"
          required
          className={inputClass}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 h-12 w-full rounded-[10px] bg-cream font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="mt-3 min-h-[18px] text-center text-xs font-medium text-[#ff9d94]">{error}</p>
    </form>
  );
}
