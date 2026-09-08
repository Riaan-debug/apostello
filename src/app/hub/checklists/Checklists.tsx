'use client';

import { useState } from 'react';
import { Check, Moon, Sunrise } from 'lucide-react';
import type { ChecklistItem, ChecklistKind, ChecklistRun } from '@/lib/db/types';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, Progress, SectionHeading } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useOutbox } from '@/lib/offline/OutboxProvider';
import { dayDate } from '@/lib/domain/format';
import { cn } from '@/lib/cn';

const KINDS: { kind: ChecklistKind; label: string; Icon: typeof Sunrise }[] = [
  { kind: 'opening', label: 'Opening', Icon: Sunrise },
  { kind: 'closing', label: 'Closing', Icon: Moon },
];

export function Checklists({
  businessId,
  runDate,
  items,
  runs,
}: {
  businessId: string;
  runDate: string;
  items: ChecklistItem[];
  runs: ChecklistRun[];
}) {
  const toast = useToast();
  const { submit } = useOutbox();

  const [state, setState] = useState<Record<ChecklistKind, Record<string, boolean>>>(() => ({
    opening: runs.find((r) => r.run_date === runDate && r.kind === 'opening')?.completed ?? {},
    closing: runs.find((r) => r.run_date === runDate && r.kind === 'closing')?.completed ?? {},
  }));

  async function toggle(kind: ChecklistKind, itemId: string) {
    const next = { ...state[kind], [itemId]: !state[kind][itemId] };
    setState((current) => ({ ...current, [kind]: next }));

    await submit('checklist_run', { businessId, kind, runDate, completed: next });

    const listItems = items.filter((item) => item.kind === kind);
    const done = listItems.filter((item) => next[item.id]).length;
    if (done === listItems.length && listItems.length > 0) {
      toast.success(`${kind === 'opening' ? 'Opening' : 'Closing'} checklist done`);
    }
  }

  const history = runs.filter((run) => run.run_date !== runDate);

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Checklists"
        subtitle={`${dayDate(runDate)} · ticks save straight away, offline included`}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {KINDS.map(({ kind, label, Icon }) => {
          const listItems = items.filter((item) => item.kind === kind);
          const completed = state[kind];
          const done = listItems.filter((item) => completed[item.id]).length;
          const progress = listItems.length > 0 ? (done / listItems.length) * 100 : 0;

          return (
            <Card key={kind}>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 text-steel" />
                    {label}
                  </span>
                }
                subtitle={`${done} of ${listItems.length} done`}
                action={
                  <Badge tone={progress === 100 ? 'good' : progress >= 70 ? 'warn' : 'neutral'}>
                    {Math.round(progress)}%
                  </Badge>
                }
              />
              <CardBody className="space-y-1">
                <Progress
                  value={progress}
                  tone={progress === 100 ? 'good' : progress >= 70 ? 'warn' : 'bad'}
                  className="mb-3"
                />

                {listItems.length === 0 ? (
                  <p className="py-4 text-sm text-steel">
                    No {label.toLowerCase()} items yet. The owner can add them in Settings.
                  </p>
                ) : (
                  <ul>
                    {listItems.map((item) => {
                      const checked = Boolean(completed[item.id]);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => void toggle(kind, item.id)}
                            className="touch-surface flex w-full items-center gap-3 rounded-[8px] px-2 py-3 text-left transition-colors hover:bg-cream"
                          >
                            <span
                              className={cn(
                                'grid size-6 shrink-0 place-items-center rounded-[6px] border-2 transition-colors',
                                checked
                                  ? 'border-good bg-good text-white'
                                  : 'border-line bg-white',
                              )}
                            >
                              {checked && <Check className="size-4" strokeWidth={3} />}
                            </span>
                            <span
                              className={cn(
                                'text-sm',
                                checked ? 'text-steel line-through' : 'text-ink',
                              )}
                            >
                              {item.text}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {history.length > 0 && (
        <Card>
          <CardHeader title="Last two weeks" subtitle="Complete or partial, per day" />
          <CardBody>
            <ul className="divide-y divide-line">
              {history.map((run) => {
                const listItems = items.filter((item) => item.kind === run.kind);
                const done = listItems.filter((item) => run.completed?.[item.id]).length;
                const full = listItems.length > 0 && done === listItems.length;
                return (
                  <li
                    key={run.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <span className="text-ink">
                      {dayDate(run.run_date)}
                      <span className="ml-2 text-xs text-steel capitalize">{run.kind}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular text-xs text-steel">
                        {done}/{listItems.length}
                      </span>
                      <Badge tone={full ? 'good' : 'warn'}>{full ? 'Complete' : 'Partial'}</Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
