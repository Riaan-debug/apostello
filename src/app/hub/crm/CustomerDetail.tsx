'use client';

import { useEffect, useState } from 'react';
import { Coffee, Gift, PiggyBank, Plus } from 'lucide-react';
import type { Customer, LoyaltyEvent } from '@/lib/db/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useOutbox } from '@/lib/offline/OutboxProvider';
import { count, relativeDays, shortDate } from '@/lib/domain/format';
import { STATUS_LABEL, customerStatus, loyaltyCard } from '@/lib/domain/loyalty';
import { cn } from '@/lib/cn';

const EVENT_LABEL: Record<LoyaltyEvent['kind'], string> = {
  stamp: 'Stamp',
  redeem: 'Free drink used',
  bank: 'Free drink banked',
  use_banked: 'Banked drink used',
  adjust: 'Adjusted by hand',
};

export function CustomerDetail({
  customer,
  freeAt,
  onClose,
  onPatch,
}: {
  customer: Customer;
  freeAt: number;
  onClose: () => void;
  onPatch: (id: string, change: Partial<Customer>) => void;
}) {
  const toast = useToast();
  const { submit } = useOutbox();
  const supabase = supabaseBrowser();

  const [history, setHistory] = useState<LoyaltyEvent[] | null>(null);
  const [busy, setBusy] = useState(false);

  const card = loyaltyCard(customer.stamps, customer.banked_drinks, freeAt);
  const status = customerStatus(customer);

  useEffect(() => {
    let cancelled = false;
    void supabase
      .from('loyalty_events')
      .select('*')
      .eq('customer_id', customer.id)
      .order('device_time', { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (!cancelled) setHistory(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, customer.id]);

  async function stamp() {
    setBusy(true);
    await submit('stamp', {
      customerId: customer.id,
      source: 'hub',
      deviceTime: new Date().toISOString(),
    });
    onPatch(customer.id, {
      stamps: customer.stamps + 1,
      visits: customer.visits + 1,
      last_visit: new Date().toISOString().slice(0, 10),
    });
    setBusy(false);
    toast.success('Stamped');
  }

  async function redeem(bank: boolean) {
    if (!card.rewardReady) return;
    setBusy(true);
    await submit('redeem', {
      customerId: customer.id,
      bank,
      source: 'hub',
      deviceTime: new Date().toISOString(),
    });
    onPatch(customer.id, {
      stamps: customer.stamps - freeAt,
      free_coffees: bank ? customer.free_coffees : customer.free_coffees + 1,
      banked_drinks: bank ? customer.banked_drinks + 1 : customer.banked_drinks,
    });
    setBusy(false);
    toast.success(bank ? 'Banked for later' : 'Free drink given');
  }

  async function useBanked() {
    if (customer.banked_drinks < 1) return;
    setBusy(true);
    await submit('use_banked', {
      customerId: customer.id,
      source: 'hub',
      deviceTime: new Date().toISOString(),
    });
    onPatch(customer.id, {
      banked_drinks: customer.banked_drinks - 1,
      free_coffees: customer.free_coffees + 1,
    });
    setBusy(false);
    toast.success('Banked drink used');
  }

  return (
    <Modal open onClose={onClose} title={customer.name} subtitle={customer.phone ?? undefined} wide>
      {/* ── Card ────────────────────────────────────────────────────── */}
      <div className="rounded-[12px] bg-ink p-5 text-cream">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-cream/50 uppercase">
            Loyalty card
          </p>
          <Badge tone={status === 'active' ? 'good' : status === 'lapsed' ? 'bad' : 'neutral'}>
            {STATUS_LABEL[status]}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: card.needed }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'grid size-8 place-items-center rounded-full border-2 text-xs font-bold',
                index < card.progress
                  ? 'border-cream/70 bg-cream/15 text-cream'
                  : 'border-cream/20 text-cream/25',
              )}
            >
              {index < card.progress ? '✓' : index + 1}
            </span>
          ))}
        </div>

        <p className="mt-4 text-sm">
          {card.rewardReady ? (
            <span className="font-semibold text-[#e8c94a]">
              Full card — a free drink is ready
              {card.overflow > 0 && ` (plus ${card.overflow} toward the next one)`}
            </span>
          ) : (
            <span className="text-cream/70">
              {card.needed - card.progress} more{' '}
              {card.needed - card.progress === 1 ? 'cup' : 'cups'} to a free drink
            </span>
          )}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Visits', value: count(customer.visits) },
            { label: 'Free drinks had', value: count(customer.free_coffees) },
            { label: 'Banked', value: count(customer.banked_drinks) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[10px] bg-cream/[0.08] px-3 py-2.5">
              <dt className="text-[10px] tracking-wide text-cream/45 uppercase">{stat.label}</dt>
              <dd className="tabular mt-0.5 text-lg font-bold">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => void stamp()} loading={busy}>
          <Plus className="size-4" />
          Add a stamp
        </Button>
        <Button
          variant="success"
          disabled={!card.rewardReady || busy}
          onClick={() => void redeem(false)}
        >
          <Coffee className="size-4" />
          Give the free drink
        </Button>
        <Button
          variant="outline"
          disabled={!card.rewardReady || busy}
          onClick={() => void redeem(true)}
        >
          <PiggyBank className="size-4" />
          Bank it for later
        </Button>
        {customer.banked_drinks > 0 && (
          <Button variant="outline" disabled={busy} onClick={() => void useBanked()}>
            <Gift className="size-4" />
            Use a banked drink
          </Button>
        )}
      </div>

      {/* ── Details ─────────────────────────────────────────────────── */}
      <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-line pt-5 sm:grid-cols-2">
        {[
          { label: 'Email', value: customer.email || '—' },
          { label: 'Joined', value: shortDate(customer.joined_on) },
          { label: 'Last in', value: relativeDays(customer.last_visit) },
          { label: 'Found us via', value: customer.found_via || '—' },
          { label: 'Birthday', value: customer.birthday ? shortDate(customer.birthday) : '—' },
          {
            label: 'Contact preferences',
            value:
              [customer.sms_opt_in && 'SMS', customer.email_opt_in && 'Email']
                .filter(Boolean)
                .join(', ') || 'None',
          },
        ].map((row) => (
          <div key={row.label}>
            <dt className="text-[10.5px] font-semibold tracking-[0.06em] text-steel uppercase">
              {row.label}
            </dt>
            <dd className="mt-0.5 text-sm text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>

      {customer.notes && (
        <div className="mt-4 rounded-[10px] bg-cream p-4">
          <p className="text-[10.5px] font-semibold tracking-[0.06em] text-steel uppercase">
            Notes
          </p>
          <p className="mt-1 text-sm text-ink">{customer.notes}</p>
        </div>
      )}

      {/* ── History ─────────────────────────────────────────────────── */}
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-sm font-bold text-ink">Recent activity</h3>
        {history === null ? (
          <p className="mt-2 text-xs text-steel">Loading…</p>
        ) : history.length === 0 ? (
          <p className="mt-2 text-xs text-steel">
            Nothing yet. Stamps and free drinks show up here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((event) => (
              <li key={event.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-ink">
                  {EVENT_LABEL[event.kind]}
                  <span className="ml-2 text-[11px] text-steel-light capitalize">
                    {event.source}
                  </span>
                </span>
                <span className="text-xs text-steel">{shortDate(event.device_time)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
