'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Coffee, Minus, Plus, Save, Share2 } from 'lucide-react';
import type { DailyLog, DailyLogTally, MenuItem, MenuItemSize } from '@/lib/db/types';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, StatTile } from '@/components/ui/Card';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Table, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { useOutbox } from '@/lib/offline/OutboxProvider';
import { count, dayDate, money, moneyBare } from '@/lib/domain/format';
import { addDays, today } from '@/lib/domain/dates';
import { WEATHER_OPTIONS } from '@/lib/domain/finance';

export function CloseOfDay({
  businessId,
  logDate,
  cupTarget,
  existing,
  existingTally,
  menuItems,
  sizes,
  recent,
}: {
  businessId: string;
  logDate: string;
  cupTarget: number;
  existing: DailyLog | null;
  existingTally: DailyLogTally[];
  menuItems: MenuItem[];
  sizes: MenuItemSize[];
  recent: DailyLog[];
}) {
  const toast = useToast();
  const { submit } = useOutbox();

  const [cups, setCups] = useState(existing ? String(existing.cups) : '');
  const [revenue, setRevenue] = useState(existing ? String(existing.revenue) : '');
  const [tips, setTips] = useState(existing ? String(existing.tips) : '');
  const [newCustomers, setNewCustomers] = useState(
    existing ? String(existing.new_customers) : '',
  );
  const [signups, setSignups] = useState(existing ? String(existing.loyalty_signups) : '');
  const [weather, setWeather] = useState(existing?.weather ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [prep, setPrep] = useState(existing?.prep_tomorrow ?? '');
  const [isEvent, setIsEvent] = useState(existing?.is_event ?? false);
  const [eventName, setEventName] = useState(existing?.event_name ?? '');
  const [saving, setSaving] = useState(false);

  const [tally, setTally] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const row of existingTally) initial[row.menu_item_size_id] = row.qty;
    return initial;
  });

  const sizesByItem = useMemo(() => {
    const map = new Map<string, MenuItemSize[]>();
    for (const size of sizes) {
      const list = map.get(size.menu_item_id) ?? [];
      list.push(size);
      map.set(size.menu_item_id, list);
    }
    return map;
  }, [sizes]);

  const tallyTotal = Object.values(tally).reduce((a, b) => a + b, 0);
  const tallyValue = Object.entries(tally).reduce((total, [sizeId, qty]) => {
    const size = sizes.find((s) => s.id === sizeId);
    return total + (size ? Number(size.price) * qty : 0);
  }, 0);

  const cupsNumber = Number(cups) || 0;
  const revenueNumber = Number(revenue) || 0;

  function bump(sizeId: string, delta: number) {
    setTally((current) => {
      const next = Math.max(0, (current[sizeId] ?? 0) + delta);
      return { ...current, [sizeId]: next };
    });
  }

  async function save() {
    setSaving(true);
    await submit('daily_log', {
      businessId,
      logDate,
      cups: cupsNumber,
      revenue: revenueNumber,
      tips: Number(tips) || 0,
      newCustomers: Number(newCustomers) || 0,
      loyaltySignups: Number(signups) || 0,
      weather: weather || null,
      notes: notes.trim() || null,
      prepTomorrow: prep.trim() || null,
      isEvent,
      eventName: isEvent ? eventName.trim() || null : null,
      tally,
    });
    setSaving(false);
    toast.success('Day saved');
  }

  /** A five-line summary the closer can paste into the owner's WhatsApp. */
  async function shareSummary() {
    const lines = [
      `Apostellō — ${dayDate(logDate)}`,
      `Cups: ${count(cupsNumber)}${cupTarget ? ` (target ${count(cupTarget)})` : ''}`,
      `Takings: ${money(revenueNumber)}`,
      Number(tips) > 0 ? `Tips: ${money(Number(tips))}` : null,
      Number(signups) > 0 ? `New loyalty sign-ups: ${count(Number(signups))}` : null,
      weather ? `Weather: ${weather}` : null,
      notes.trim() ? `Notes: ${notes.trim()}` : null,
      prep.trim() ? `For tomorrow: ${prep.trim()}` : null,
    ].filter(Boolean);

    const text = lines.join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // The user dismissed the share sheet; fall through to the clipboard.
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success('Summary copied');
  }

  const isToday = logDate === today();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Close of day</h1>
          <p className="mt-1 text-sm text-steel">
            {dayDate(logDate)}
            {isToday && ' · today'}
            {existing && ' · already saved, edits are fine'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/hub/daily?date=${addDays(logDate, -1)}`}
            className="grid size-10 place-items-center rounded-[8px] border border-line bg-white text-steel transition-colors hover:border-ink hover:text-ink"
            aria-label="Previous day"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/hub/daily?date=${addDays(logDate, 1)}`}
            className="grid size-10 place-items-center rounded-[8px] border border-line bg-white text-steel transition-colors hover:border-ink hover:text-ink"
            aria-label="Next day"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Cups"
          value={count(cupsNumber)}
          hint={`Target ${count(cupTarget)}`}
          tone={cupsNumber >= cupTarget ? 'good' : 'default'}
        />
        <StatTile label="Takings" value={money(revenueNumber, 0)} hint="From the Yoco day total" />
        <StatTile
          label="Per cup"
          value={cupsNumber > 0 ? money(revenueNumber / cupsNumber) : '—'}
        />
      </div>

      {/* ── The numbers ─────────────────────────────────────────────── */}
      <Card className="border-ink-soft bg-ink text-cream">
        <CardHeader
          title={<span className="text-cream">The numbers</span>}
          subtitle={
            <span className="text-cream/55">
              Paste the Yoco day total. We do not rebuild payments.
            </span>
          }
          className="border-cream/12"
        />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DarkField label="Cups sold" value={cups} onChange={setCups} placeholder="0" />
          <DarkField
            label="Takings (Yoco)"
            value={revenue}
            onChange={setRevenue}
            placeholder="0.00"
            prefix="R"
          />
          <DarkField label="Tips" value={tips} onChange={setTips} placeholder="0.00" prefix="R" />
          <DarkField
            label="Loyalty sign-ups"
            value={signups}
            onChange={setSignups}
            placeholder="0"
          />
        </CardBody>
      </Card>

      {/* ── The day ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader title="How the day went" subtitle="Useful when you look back in a month" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Weather">
            <Select value={weather} onChange={(e) => setWeather(e.target.value)}>
              <option value="">—</option>
              {WEATHER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="New faces" hint="People who had never bought from us before">
            <Input
              value={newCustomers}
              onChange={(e) => setNewCustomers(e.target.value)}
              type="number"
              inputMode="numeric"
              placeholder="0"
            />
          </Field>
          <Field label="Notes or problems" className="sm:col-span-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Grinder needed re-dialling after lunch"
            />
          </Field>
          <Field label="For tomorrow" className="sm:col-span-2">
            <Textarea
              value={prep}
              onChange={(e) => setPrep(e.target.value)}
              rows={2}
              placeholder="Order milk, defrost croissants"
            />
          </Field>

          <div className="sm:col-span-2">
            <Checkbox
              checked={isEvent}
              onChange={(e) => setIsEvent(e.target.checked)}
              label="This was a market or event day"
              hint="Keeps an unusual day from skewing the weekly average when you read it back"
            />
            {isEvent && (
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Which event?"
                className="mt-3"
              />
            )}
          </div>
        </CardBody>
      </Card>

      {/* ── Drink tally ─────────────────────────────────────────────── */}
      {menuItems.length > 0 && (
        <Card>
          <CardHeader
            title="Drink tally"
            subtitle="Optional. Fill it in and the reports can tell you what actually sells."
            action={
              <span className="text-xs text-steel">
                {count(tallyTotal)} cups · {money(tallyValue, 0)}
              </span>
            }
          />
          <CardBody className="space-y-5">
            {tallyTotal > 0 && cupsNumber > 0 && tallyTotal !== cupsNumber && (
              <p className="rounded-[8px] bg-warn/10 px-3.5 py-2.5 text-xs text-warn">
                The tally adds up to {count(tallyTotal)} but you entered {count(cupsNumber)} cups.
                Neither is wrong — the tally is a sample if you did not count every drink.
              </p>
            )}

            {menuItems.map((item) => {
              const itemSizes = sizesByItem.get(item.id) ?? [];
              if (itemSizes.length === 0) return null;
              return (
                <div key={item.id}>
                  <p className="mb-2 text-sm font-semibold text-ink">{item.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {itemSizes.map((size) => (
                      <div
                        key={size.id}
                        className="flex items-center gap-1 rounded-[10px] border border-line bg-cream px-2 py-1.5"
                      >
                        <span className="mr-1 text-[11px] font-semibold text-steel">
                          {size.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => bump(size.id, -1)}
                          className="grid size-7 place-items-center rounded-[6px] text-steel transition-colors hover:bg-ink hover:text-cream"
                          aria-label={`One fewer ${item.name} ${size.label}`}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="tabular w-7 text-center text-sm font-bold text-ink">
                          {tally[size.id] ?? 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => bump(size.id, 1)}
                          className="grid size-7 place-items-center rounded-[6px] text-steel transition-colors hover:bg-ink hover:text-cream"
                          aria-label={`One more ${item.name} ${size.label}`}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      <div className="sticky bottom-4 z-20 flex flex-wrap gap-2 rounded-[12px] border border-line bg-white/95 p-3 shadow-[0_8px_28px_rgba(1,27,61,0.12)] backdrop-blur-md">
        <Button size="lg" loading={saving} onClick={() => void save()}>
          <Save className="size-4" />
          Save the day
        </Button>
        <Button size="lg" variant="outline" onClick={() => void shareSummary()}>
          <Share2 className="size-4" />
          Share summary
        </Button>
      </div>

      {/* ── Recent days ─────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <Card>
          <CardHeader title="Last two weeks" />
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Day</Th>
                  <Th align="right">Cups</Th>
                  <Th align="right">Takings</Th>
                  <Th align="right">Per cup</Th>
                  <Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((log) => (
                  <Tr key={log.id}>
                    <Td>
                      <Link
                        href={`/hub/daily?date=${log.log_date}`}
                        className="font-semibold text-ink hover:underline"
                      >
                        {dayDate(log.log_date)}
                      </Link>
                      {log.is_event && (
                        <span className="ml-2 text-[10px] text-steel">{log.event_name}</span>
                      )}
                    </Td>
                    <Td align="right">{count(log.cups)}</Td>
                    <Td align="right">{moneyBare(log.revenue, 0)}</Td>
                    <Td align="right">
                      {log.cups > 0 ? moneyBare(Number(log.revenue) / log.cups) : '—'}
                    </Td>
                    <Td>
                      <span className="text-xs text-steel">{log.notes ?? ''}</span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      )}

      {recent.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-steel">
          <Coffee className="size-4" />
          Once a few days are logged, the reports start to mean something.
        </p>
      )}
    </div>
  );
}

function DarkField({
  label,
  value,
  onChange,
  placeholder,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.07em] text-cream/55 uppercase">
        {label}
      </span>
      <span className="relative block">
        {prefix && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-cream/45">
            {prefix}
          </span>
        )}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type="number"
          inputMode="decimal"
          placeholder={placeholder}
          className={`tabular w-full rounded-[8px] border border-cream/20 bg-cream/[0.07] py-2.5 text-lg font-semibold text-cream placeholder:text-cream/25 focus:border-cream/60 focus:outline-none ${
            prefix ? 'pr-3 pl-8' : 'px-3'
          }`}
        />
      </span>
    </label>
  );
}
