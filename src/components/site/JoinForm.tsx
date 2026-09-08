'use client';

import { useState } from 'react';
import { CheckCircle2, Coffee } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input } from '@/components/ui/form';
import { normalisePhone } from '@/lib/domain/loyalty';

type Outcome = 'created' | 'already_registered' | null;

const MESSAGES: Record<string, string> = {
  invalid_name: 'Please give us a name we can put on the card.',
  invalid_phone: 'That does not look like a South African cell number.',
  invalid_business: 'Something is wrong on our side. Please ask at the trailer.',
};

/**
 * The sign-up page we own, replacing "Google Form → paste into the CRM by
 * hand". Writes straight into `customers` through a security-definer function,
 * so anonymous visitors can create their own card and nothing else.
 */
export function JoinForm({ businessId, freeAt }: { businessId: string; freeAt: number }) {
  const supabase = supabaseBrowser();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError(MESSAGES.invalid_name);
      return;
    }
    if (normalisePhone(phone).length < 9) {
      setError(MESSAGES.invalid_phone);
      return;
    }

    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc('public_loyalty_signup', {
      p_business_id: businessId,
      p_name: name.trim(),
      p_phone: phone.trim(),
      p_email: email.trim() || null,
      p_sms_opt_in: smsOptIn,
      p_email_opt_in: emailOptIn,
      p_found_via: 'QR sign-up',
    });
    setBusy(false);

    if (rpcError) {
      setError('We could not save that. Please try again, or ask at the trailer.');
      return;
    }

    if (data === 'created' || data === 'already_registered') {
      setOutcome(data);
      return;
    }

    setError(MESSAGES[String(data)] ?? 'Please check the details and try again.');
  }

  if (outcome) {
    return (
      <div className="rounded-[14px] border border-line bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-good" />
        <h2 className="mt-4 text-2xl font-semibold text-ink">
          {outcome === 'created' ? "You're on the card" : 'You already have a card'}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-steel">
          {outcome === 'created'
            ? `Give your number at the trailer and we will stamp it. Every ${freeAt}th cup is on us.`
            : 'That number is already signed up. Just give it at the trailer and we will stamp your card.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[14px] border border-line bg-white p-7">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-ink text-cream">
          <Coffee className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-ink">Every {freeAt}th cup is free</h2>
          <p className="text-xs text-steel">No card to carry. We keep the count.</p>
        </div>
      </div>

      <div className="space-y-4">
        <Field label="First name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
            placeholder="What should we call you?"
            required
          />
        </Field>

        <Field label="Cell number" required hint="This is how we find your card at the trailer.">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="082 123 4567"
            required
          />
        </Field>

        <Field label="Email" hint="Optional. Only if you want the occasional note.">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>

        <div className="space-y-2.5 rounded-[10px] bg-cream p-4">
          <Checkbox
            checked={smsOptIn}
            onChange={(e) => setSmsOptIn(e.target.checked)}
            label="Text me when there is a free drink waiting"
          />
          <Checkbox
            checked={emailOptIn}
            onChange={(e) => setEmailOptIn(e.target.checked)}
            label="Email me about specials now and then"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-bad">{error}</p>}

      <Button type="submit" size="lg" block loading={busy} className="mt-6">
        Start my card
      </Button>

      <p className="mt-4 text-[11px] leading-relaxed text-steel">
        We keep your name, number and stamp count so the card works. Nothing is sold or shared, and
        you can ask us to delete it at any time.
      </p>
    </form>
  );
}
