'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, CloudOff, Delete, Gift } from 'lucide-react';
import { Wordmark } from '@/components/Wordmark';
import { useOutbox } from '@/lib/offline/OutboxProvider';
import { newId } from '@/lib/offline/db';
import { deviceId } from '@/lib/device';
import { findByPhone, loyaltyCard, normalisePhone } from '@/lib/domain/loyalty';
import { cn } from '@/lib/cn';

/** Only the fields the kiosk needs. */
export interface KioskCustomer {
  id: string;
  name: string;
  phone: string | null;
  phone_normalised: string | null;
  stamps: number;
  visits: number;
  free_coffees: number;
  banked_drinks: number;
  last_visit: string | null;
}

type Screen =
  | { name: 'home' }
  | { name: 'card'; customerId: string }
  | { name: 'unknown'; phone: string }
  | { name: 'register'; phone: string }
  | { name: 'thanks'; message: string; detail: string };

const CACHE_KEY = 'apostello.kiosk-customers';
/** A customer tapping twice in a queue is a mistake, not two cups. */
const STAMP_COOLDOWN_MS = 90_000;

export function Kiosk({
  businessId,
  freeAt,
  slogan,
  initialCustomers,
}: {
  businessId: string;
  freeAt: number;
  slogan: string;
  initialCustomers: KioskCustomer[];
}) {
  const { submit, online, pending } = useOutbox();

  const [customers, setCustomers] = useState<KioskCustomer[]>(initialCustomers);
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [phone, setPhone] = useState('');
  const [lastStamped, setLastStamped] = useState<Record<string, number>>({});
  const [staffPrompt, setStaffPrompt] = useState(false);

  // Keep a copy on the device so a cold start with no signal still finds cards.
  useEffect(() => {
    if (initialCustomers.length > 0) {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(initialCustomers));
      return;
    }
    const cached = window.localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setCustomers(JSON.parse(cached) as KioskCustomer[]);
      } catch {
        window.localStorage.removeItem(CACHE_KEY);
      }
    }
  }, [initialCustomers]);

  const reset = useCallback(() => {
    setScreen({ name: 'home' });
    setPhone('');
  }, []);

  // Never leave someone's card on screen for the next person in the queue.
  useEffect(() => {
    if (screen.name === 'home') return;
    const delay = screen.name === 'thanks' ? 4000 : 45_000;
    const timer = window.setTimeout(reset, delay);
    return () => window.clearTimeout(timer);
  }, [screen, reset]);

  const current =
    screen.name === 'card' ? customers.find((c) => c.id === screen.customerId) ?? null : null;

  function patch(id: string, change: Partial<KioskCustomer>) {
    setCustomers((list) => list.map((c) => (c.id === id ? { ...c, ...change } : c)));
  }

  function lookUp() {
    const digits = normalisePhone(phone);
    if (digits.length < 7) return;

    const match = findByPhone(customers as never, digits);
    if (match) {
      setScreen({ name: 'card', customerId: match.id });
    } else {
      setScreen({ name: 'unknown', phone: digits });
    }
  }

  async function stamp(customer: KioskCustomer) {
    const since = Date.now() - (lastStamped[customer.id] ?? 0);
    if (since < STAMP_COOLDOWN_MS) {
      setScreen({
        name: 'thanks',
        message: 'Already stamped',
        detail: 'That cup went on the card a moment ago.',
      });
      return;
    }

    setLastStamped((current) => ({ ...current, [customer.id]: Date.now() }));

    await submit('stamp', {
      customerId: customer.id,
      source: 'kiosk',
      deviceTime: new Date().toISOString(),
    });

    const stamps = customer.stamps + 1;
    patch(customer.id, {
      stamps,
      visits: customer.visits + 1,
      last_visit: new Date().toISOString().slice(0, 10),
    });

    setScreen({
      name: 'thanks',
      message: stamps >= freeAt ? 'Your next one is free' : 'Stamped',
      detail:
        stamps >= freeAt
          ? 'Ask at the counter and we will sort you out.'
          : `${freeAt - stamps} more ${freeAt - stamps === 1 ? 'cup' : 'cups'} to a free drink.`,
    });
  }

  async function register(name: string, digits: string) {
    const id = newId();
    await submit(
      'customer_create',
      {
        id,
        businessId,
        name: name.trim(),
        phone: digits,
        phoneNormalised: digits,
        email: null,
        foundVia: 'Kiosk',
        smsOptIn: false,
        emailOptIn: false,
        notes: null,
        birthday: null,
      },
      id,
    );

    // The first cup counts, so a sign-up at the counter is not a wasted visit.
    await submit('stamp', {
      customerId: id,
      source: 'kiosk',
      deviceTime: new Date().toISOString(),
    });

    setCustomers((list) => [
      ...list,
      {
        id,
        name: name.trim(),
        phone: digits,
        phone_normalised: digits,
        stamps: 1,
        visits: 1,
        free_coffees: 0,
        banked_drinks: 0,
        last_visit: new Date().toISOString().slice(0, 10),
      },
    ]);

    setScreen({
      name: 'thanks',
      message: `Welcome, ${name.trim().split(' ')[0]}`,
      detail: `First stamp is on. ${freeAt - 1} more to a free drink.`,
    });
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mb-10">
          <Wordmark tone="cream" size="xl" />
          <p className="mt-4 text-sm text-cream/35 italic">{slogan}</p>
        </div>

        {screen.name === 'home' && (
          <HomeScreen
            phone={phone}
            onChange={setPhone}
            onSubmit={lookUp}
            onNew={() => setScreen({ name: 'register', phone: normalisePhone(phone) })}
          />
        )}

        {screen.name === 'card' && current && (
          <CardScreen
            customer={current}
            freeAt={freeAt}
            onStamp={() => void stamp(current)}
            onBack={reset}
          />
        )}

        {screen.name === 'unknown' && (
          <UnknownScreen
            onRegister={() => setScreen({ name: 'register', phone: screen.phone })}
            onBack={reset}
          />
        )}

        {screen.name === 'register' && (
          <RegisterScreen
            phone={screen.phone}
            onSubmit={(name, digits) => void register(name, digits)}
            onBack={reset}
          />
        )}

        {screen.name === 'thanks' && (
          <ThanksScreen message={screen.message} detail={screen.detail} onDone={reset} />
        )}
      </div>

      {/* ── Status + staff exit ─────────────────────────────────────── */}
      {(!online || pending > 0) && (
        <p className="absolute bottom-4 left-5 inline-flex items-center gap-1.5 text-[11px] text-cream/35">
          <CloudOff className="size-3.5" />
          {online ? `${pending} to sync` : 'Offline — stamps are being saved'}
        </p>
      )}

      <button
        type="button"
        onClick={() => setStaffPrompt(true)}
        className="absolute right-5 bottom-4 text-[11px] text-cream/20 transition-colors hover:text-cream/50"
      >
        Staff
      </button>

      {staffPrompt && <StaffExit onCancel={() => setStaffPrompt(false)} />}
    </div>
  );
}

/* ── Screens ───────────────────────────────────────────────────────────── */

function HomeScreen({
  phone,
  onChange,
  onSubmit,
  onNew,
}: {
  phone: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onNew: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault();
        onChange((phone + event.key).slice(0, 12));
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        onChange(phone.slice(0, -1));
        return;
      }

      if (event.key === 'Escape' || event.key === 'Delete') {
        event.preventDefault();
        onChange('');
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        onSubmit();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phone, onChange, onSubmit]);

  return (
    <div>
      <p className="mb-6 text-lg text-cream/60">Type or tap your number to stamp your card</p>

      <div
        className={cn(
          'tabular mb-5 flex h-16 items-center justify-center rounded-[14px] border-2 border-cream/25 bg-cream/[0.06] text-2xl tracking-[0.15em] text-cream',
          phone.length === 0 && 'text-cream/25',
        )}
        aria-live="polite"
      >
        {phone || '082 000 0000'}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <Key key={digit} onClick={() => onChange((phone + digit).slice(0, 12))}>
            {digit}
          </Key>
        ))}
        <Key onClick={() => onChange('')} muted>
          Clear
        </Key>
        <Key onClick={() => onChange((phone + '0').slice(0, 12))}>0</Key>
        <Key onClick={() => onChange(phone.slice(0, -1))} muted>
          <Delete className="size-6" />
        </Key>
      </div>

      <PrimaryButton onClick={onSubmit} disabled={normalisePhone(phone).length < 7} className="mt-5">
        Check in
      </PrimaryButton>

      <button
        type="button"
        onClick={onNew}
        className="mt-4 w-full py-3 text-sm font-semibold text-cream/45 transition-colors hover:text-cream"
      >
        New here? Start a card
      </button>
    </div>
  );
}

function CardScreen({
  customer,
  freeAt,
  onStamp,
  onBack,
}: {
  customer: KioskCustomer;
  freeAt: number;
  onStamp: () => void;
  onBack: () => void;
}) {
  const card = loyaltyCard(customer.stamps, customer.banked_drinks, freeAt);
  const firstName = customer.name.split(' ')[0];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-cream">
        Hello, <span className="text-[#e8c94a]">{firstName}</span>
      </h1>

      {(card.rewardReady || card.bankedDrinks > 0) && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e8c94a]/40 bg-[#e8c94a]/15 px-4 py-2 text-sm font-bold text-[#e8c94a]">
          <Gift className="size-4" />
          {card.rewardReady ? 'Your next drink is free' : `${card.bankedDrinks} free drink waiting`}
        </p>
      )}

      <div className="mt-7 rounded-[18px] border border-cream/12 bg-cream/[0.06] p-6">
        <div className="flex flex-wrap justify-center gap-2.5">
          {Array.from({ length: card.needed }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'grid size-10 place-items-center rounded-full border-2 text-sm font-bold transition-colors',
                index < card.progress
                  ? 'border-cream/80 bg-cream/15 text-cream'
                  : 'border-cream/20 text-cream/25',
              )}
            >
              {index < card.progress ? <Check className="size-5" strokeWidth={3} /> : index + 1}
            </span>
          ))}
        </div>

        <p className="mt-5 text-sm text-cream/50">
          {card.rewardReady
            ? 'Full card'
            : `${card.needed - card.progress} to go · ${customer.visits} visits so far`}
        </p>
      </div>

      <PrimaryButton onClick={onStamp} className="mt-6">
        Stamp this cup
      </PrimaryButton>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 py-3 text-sm font-semibold text-cream/40 transition-colors hover:text-cream"
      >
        <ArrowLeft className="size-4" />
        Not you? Go back
      </button>
    </div>
  );
}

function UnknownScreen({ onRegister, onBack }: { onRegister: () => void; onBack: () => void }) {
  return (
    <div>
      <p className="text-xl text-cream/70">No card on that number yet</p>
      <p className="mt-3 text-sm text-cream/40">
        Takes ten seconds, and this cup counts as your first stamp.
      </p>

      <PrimaryButton onClick={onRegister} className="mt-8">
        Start a card
      </PrimaryButton>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 w-full py-3 text-sm font-semibold text-cream/40 transition-colors hover:text-cream"
      >
        Try another number
      </button>
    </div>
  );
}

function RegisterScreen({
  phone,
  onSubmit,
  onBack,
}: {
  phone: string;
  onSubmit: (name: string, digits: string) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState(phone);

  const ready = name.trim().length >= 2 && normalisePhone(number).length >= 9;

  const field =
    'w-full rounded-[14px] border-2 border-cream/25 bg-cream/[0.06] px-5 py-4 text-center text-xl ' +
    'text-cream placeholder:text-cream/25 focus:border-cream/60 focus:outline-none';

  return (
    <div>
      <p className="mb-6 text-lg text-cream/60">Just a name and a number</p>

      <div className="space-y-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="First name"
          autoComplete="off"
          autoFocus
          className={field}
        />
        <input
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="Cell number"
          type="tel"
          inputMode="tel"
          className={`${field} tabular tracking-[0.1em]`}
        />
      </div>

      <PrimaryButton
        onClick={() => onSubmit(name, normalisePhone(number))}
        disabled={!ready}
        className="mt-6"
      >
        Start my card
      </PrimaryButton>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 w-full py-3 text-sm font-semibold text-cream/40 transition-colors hover:text-cream"
      >
        Cancel
      </button>
    </div>
  );
}

function ThanksScreen({
  message,
  detail,
  onDone,
}: {
  message: string;
  detail: string;
  onDone: () => void;
}) {
  return (
    <button type="button" onClick={onDone} className="w-full">
      <span className="mx-auto grid size-20 place-items-center rounded-full bg-cream/12">
        <Check className="size-10 text-cream" strokeWidth={2.5} />
      </span>
      <span className="mt-6 block text-3xl font-semibold text-cream">{message}</span>
      <span className="mt-3 block text-cream/50">{detail}</span>
      <span className="mt-8 block text-xs text-cream/25">Tap anywhere to carry on</span>
    </button>
  );
}

/* ── Staff exit ────────────────────────────────────────────────────────── */

function StaffExit({ onCancel }: { onCancel: () => void }) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
    setBusy(true);
    setError(null);

    const response = await fetch('/api/auth/pin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin, deviceId: deviceId() }),
    });

    const body = (await response.json().catch(() => ({}))) as { error?: string; role?: string };
    setBusy(false);

    if (!response.ok) {
      setPin('');
      setError(body.error ?? 'PIN not recognised.');
      return;
    }

    if (body.role === 'kiosk') {
      setError('That PIN belongs to the kiosk itself. Use a staff PIN.');
      return;
    }

    window.location.assign('/hub');
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-deep/80 p-6">
      <div className="w-full max-w-xs rounded-[18px] border border-cream/15 bg-ink p-7 text-center">
        <p className="text-sm font-semibold text-cream">Staff PIN to leave kiosk mode</p>

        <input
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
          type="password"
          inputMode="numeric"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter' && pin.length >= 4) void unlock();
          }}
          className="tabular mt-5 w-full rounded-[10px] border-2 border-cream/25 bg-cream/[0.06] py-3 text-center text-xl tracking-[0.35em] text-cream focus:border-cream/60 focus:outline-none"
        />

        <button
          type="button"
          disabled={busy || pin.length < 4}
          onClick={() => void unlock()}
          className="mt-4 h-12 w-full rounded-[10px] bg-cream font-bold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? 'Checking…' : 'Unlock'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full py-2 text-sm text-cream/40 hover:text-cream"
        >
          Cancel
        </button>

        <p className="mt-2 min-h-[16px] text-xs text-[#ff9d94]">{error}</p>
      </div>
    </div>
  );
}

/* ── Bits ──────────────────────────────────────────────────────────────── */

function Key({
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
        'grid h-16 place-items-center rounded-[14px] font-semibold transition-colors active:scale-[0.97]',
        muted
          ? 'bg-transparent text-sm text-cream/40 hover:text-cream/70'
          : 'bg-cream/[0.07] text-2xl text-cream hover:bg-cream/15',
      )}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-16 w-full rounded-[14px] bg-cream text-lg font-bold text-ink transition-opacity active:scale-[0.98] disabled:opacity-30',
        className,
      )}
    >
      {children}
    </button>
  );
}
