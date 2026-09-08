'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownToLine, Check, Package, Save } from 'lucide-react';
import type { StockCount, StockItem } from '@/lib/db/types';
import { Button } from '@/components/ui/Button';
import { Badge, FilterTabs } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, EmptyState, StatTile } from '@/components/ui/Card';
import { NumberCell, Select } from '@/components/ui/form';
import { Table, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { useOutbox } from '@/lib/offline/OutboxProvider';
import { count, decimal, dayDate } from '@/lib/domain/format';
import { LEVEL_LABEL, WASTE_REASONS, stockLevel } from '@/lib/domain/stock';

interface Draft {
  opening: string;
  used: string;
  waste: string;
  reason: string;
  dirty: boolean;
  saved: boolean;
}

type View = 'all' | 'attention' | 'uncounted';

const num = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function StockTake({
  businessId,
  countDate,
  items,
  todayCounts,
  yesterdayCounts,
}: {
  businessId: string;
  countDate: string;
  items: StockItem[];
  todayCounts: StockCount[];
  yesterdayCounts: StockCount[];
}) {
  const toast = useToast();
  const { submit } = useOutbox();
  const [view, setView] = useState<View>('all');
  const [saving, setSaving] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const initial: Record<string, Draft> = {};
    for (const item of items) {
      const existing = todayCounts.find((c) => c.stock_item_id === item.id);
      initial[item.id] = {
        opening: existing ? String(existing.opening) : '',
        used: existing ? String(existing.used) : '',
        waste: existing ? String(existing.waste) : '',
        reason: existing?.waste_reason ?? '',
        dirty: false,
        saved: Boolean(existing),
      };
    }
    return initial;
  });

  function set(id: string, change: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...change, dirty: true, saved: false },
    }));
  }

  /** Yesterday's closing is today's opening. Saves twenty numbers of typing. */
  function carryForward() {
    setDrafts((current) => {
      const next = { ...current };
      let filled = 0;
      for (const item of items) {
        if (next[item.id].opening !== '') continue;
        const yesterday = yesterdayCounts.find((c) => c.stock_item_id === item.id);
        const opening = yesterday ? Number(yesterday.closing) : Number(item.on_hand);
        next[item.id] = { ...next[item.id], opening: String(opening), dirty: true, saved: false };
        filled += 1;
      }
      if (filled === 0) toast.show('Every opening figure is already filled in');
      return next;
    });
  }

  const rows = useMemo(
    () =>
      items.map((item) => {
        const draft = drafts[item.id];
        const opening = num(draft.opening);
        const closing = Math.max(0, opening - num(draft.used) - num(draft.waste));
        const touched = draft.opening !== '' || draft.used !== '' || draft.waste !== '';
        return {
          item,
          draft,
          closing,
          touched,
          level: stockLevel(touched ? closing : Number(item.on_hand), item.reorder_level),
        };
      }),
    [items, drafts],
  );

  const visible = useMemo(() => {
    if (view === 'attention') return rows.filter((row) => row.level !== 'ok');
    if (view === 'uncounted') return rows.filter((row) => !row.touched && !row.draft.saved);
    return rows;
  }, [rows, view]);

  const counted = rows.filter((row) => row.touched || row.draft.saved).length;
  const dirty = rows.filter((row) => row.draft.dirty).length;
  const reorder = rows.filter((row) => row.level === 'reorder' || row.level === 'critical');

  async function saveAll() {
    const pending = rows.filter((row) => row.draft.dirty);
    if (pending.length === 0) {
      toast.show('Nothing changed since the last save');
      return;
    }

    setSaving(true);
    for (const row of pending) {
      await submit('stock_count', {
        businessId,
        stockItemId: row.item.id,
        countDate,
        opening: num(row.draft.opening),
        used: num(row.draft.used),
        waste: num(row.draft.waste),
        wasteReason: row.draft.reason || null,
      });
    }
    setDrafts((current) => {
      const next = { ...current };
      for (const row of pending) {
        next[row.item.id] = { ...next[row.item.id], dirty: false, saved: true };
      }
      return next;
    });
    setSaving(false);
    toast.success(`Saved ${pending.length} ${pending.length === 1 ? 'line' : 'lines'}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Stock take</h1>
          <p className="mt-1 text-sm text-steel">
            {dayDate(countDate)} · closing works itself out from opening less used and wasted
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={carryForward}>
            <ArrowDownToLine className="size-4" />
            Carry yesterday over
          </Button>
          <Button loading={saving} onClick={() => void saveAll()} disabled={dirty === 0}>
            <Save className="size-4" />
            {dirty > 0 ? `Save ${dirty}` : 'Saved'}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Counted today"
          value={`${count(counted)} / ${count(rows.length)}`}
          tone={counted === rows.length ? 'good' : 'default'}
          icon={<Check className="size-5" />}
        />
        <StatTile
          label="To reorder"
          value={count(reorder.length)}
          tone={reorder.length > 0 ? 'bad' : 'good'}
          icon={<AlertTriangle className="size-5" />}
        />
        <StatTile
          label="Unsaved changes"
          value={count(dirty)}
          hint={dirty > 0 ? 'Saved when you tap Save, even offline' : 'Everything is saved'}
          tone={dirty > 0 ? 'warn' : 'default'}
        />
      </div>

      {reorder.length > 0 && (
        <Card className="border-bad/25 bg-bad/[0.03]">
          <CardBody className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-semibold text-bad">
              <AlertTriangle className="size-4" />
              Order before tomorrow
            </span>
            {reorder.map((row) => (
              <Badge key={row.item.id} tone="bad">
                {row.item.name}
              </Badge>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Today's count"
          subtitle="Type what you can. A blank line is simply not counted yet."
        />
        <div className="border-b border-line px-5 py-3">
          <FilterTabs<View>
            value={view}
            onChange={setView}
            options={[
              { value: 'all', label: 'Everything', count: rows.length },
              { value: 'attention', label: 'Needs attention', count: rows.filter((r) => r.level !== 'ok').length },
              { value: 'uncounted', label: 'Not counted', count: rows.length - counted },
            ]}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Package className="size-7" />}
            title={view === 'uncounted' ? 'Everything is counted' : 'Nothing to show'}
            body={view === 'attention' ? 'No line is below its reorder level.' : undefined}
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th align="center">Opening</Th>
                  <Th align="center">Used</Th>
                  <Th align="center">Waste</Th>
                  <Th>Why wasted</Th>
                  <Th align="right">Closing</Th>
                  <Th>Level</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ item, draft, closing, touched, level }) => (
                  <Tr
                    key={item.id}
                    tone={level === 'critical' || level === 'reorder' ? 'bad' : level === 'low' ? 'warn' : undefined}
                  >
                    <Td>
                      <p className="font-semibold text-ink">{item.name}</p>
                      <p className="text-[11px] text-steel">
                        {item.category} · in {item.unit} · reorder at {item.reorder_level}
                      </p>
                    </Td>
                    <Td align="center">
                      <NumberCell
                        value={draft.opening}
                        onChange={(e) => set(item.id, { opening: e.target.value })}
                        placeholder="—"
                      />
                    </Td>
                    <Td align="center">
                      <NumberCell
                        value={draft.used}
                        onChange={(e) => set(item.id, { used: e.target.value })}
                        placeholder="0"
                      />
                    </Td>
                    <Td align="center">
                      <NumberCell
                        value={draft.waste}
                        onChange={(e) => set(item.id, { waste: e.target.value })}
                        placeholder="0"
                      />
                    </Td>
                    <Td>
                      <Select
                        value={draft.reason}
                        onChange={(e) => set(item.id, { reason: e.target.value })}
                        disabled={num(draft.waste) === 0}
                        className="min-w-32 py-1.5 text-xs"
                      >
                        <option value="">—</option>
                        {WASTE_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td align="right">
                      <span className={touched ? 'font-semibold text-ink' : 'text-steel-light'}>
                        {touched ? decimal(closing, closing % 1 === 0 ? 0 : 1) : '—'}
                      </span>
                    </Td>
                    <Td>
                      <Badge
                        tone={
                          level === 'ok'
                            ? 'good'
                            : level === 'low'
                              ? 'warn'
                              : 'bad'
                        }
                      >
                        {LEVEL_LABEL[level]}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
