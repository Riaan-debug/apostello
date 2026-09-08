'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Badge, FilterTabs } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, Progress, SectionHeading, StatTile } from '@/components/ui/Card';
import { Table, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { cn } from '@/lib/cn';
import { count, dayDate, money, moneyBare, percent } from '@/lib/domain/format';
import type { ProfitAndLoss, TargetProgress } from '@/lib/domain/finance';

const INK = '#011b3d';
const STEEL = '#50657e';
const GRID = '#d8dfe9';

export type ReportTab = 'week' | 'month';

export interface ReportDay {
  date: string;
  cups: number;
  revenue: number;
  tips: number;
  notes: string;
  logged: boolean;
}

export interface PeriodComparison {
  revenue: number;
  cups: number;
}

export interface ReportMeta {
  cardFeeRate: number;
  vatRate: number;
  operatingDays: number;
  averageCupCost: number;
  averageCupPrice: number;
  breakEvenCupsPerDay: number | null;
  contributionPerCup: number;
  dailyFixedCost: number;
}

export interface WeekReport {
  from: string;
  label: string;
  prevHref: string;
  nextHref: string;
  currentHref: string;
  isCurrent: boolean;
  days: ReportDay[];
  tradingDays: number;
  pnl: ProfitAndLoss;
  previous: PeriodComparison;
  targets: TargetProgress[];
}

export interface MonthReport {
  param: string;
  label: string;
  prevHref: string;
  nextHref: string;
  currentHref: string;
  isCurrent: boolean;
  days: ReportDay[];
  tradingDays: number;
  pnl: ProfitAndLoss;
  previous: PeriodComparison;
  trend: { label: string; revenue: number }[];
  newMembers: number;
  membersSeen: number;
  netTarget: number;
  netTargetRatio: number;
}

export interface ReportsViewProps {
  initialTab: ReportTab;
  week: WeekReport;
  month: MonthReport;
  meta: ReportMeta;
}

export function ReportsView({ initialTab, week, month, meta }: ReportsViewProps) {
  const [tab, setTab] = useState<ReportTab>(initialTab);

  const rows = tab === 'week' ? week.days : month.days;
  const filename =
    tab === 'week' ? `apostello-week-${week.from}.csv` : `apostello-month-${month.param}.csv`;

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Reports"
        subtitle="Yoco takings measured against what the trailer actually costs to run."
        action={
          <Button variant="outline" size="sm" onClick={() => downloadCsv(rows, filename)}>
            <Download className="size-4" aria-hidden />
            Download CSV
          </Button>
        }
      />

      <FilterTabs<ReportTab>
        options={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'week' ? <WeekPanel week={week} meta={meta} /> : <MonthPanel month={month} meta={meta} />}
    </div>
  );
}

/* ── Week ─────────────────────────────────────────────────────────────── */

function WeekPanel({ week, meta }: { week: WeekReport; meta: ReportMeta }) {
  const { pnl, previous } = week;

  return (
    <div className="space-y-5">
      <PeriodNav
        label={week.label}
        prevHref={week.prevHref}
        nextHref={week.nextHref}
        currentHref={week.currentHref}
        isCurrent={week.isCurrent}
        currentLabel="This week"
      />

      <Tiles pnl={pnl} previous={previous} priorLabel="last week" />

      <Notes lines={weekNotes(week, meta)} />

      <Card>
        <CardHeader
          title="Day by day"
          subtitle={`${count(week.tradingDays)} of 7 days traded`}
        />
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th align="right">Cups</Th>
                <Th align="right">Revenue</Th>
                <Th align="right">R / cup</Th>
              </tr>
            </thead>
            <tbody>
              {week.days.map((day) => (
                <Tr key={day.date}>
                  <Td className={cn(!day.logged && 'text-steel-light')}>{dayDate(day.date)}</Td>
                  <Td align="right">{day.logged ? count(day.cups) : '—'}</Td>
                  <Td align="right">{day.logged ? moneyBare(day.revenue) : '—'}</Td>
                  <Td align="right">
                    {day.logged && day.cups > 0 ? moneyBare(day.revenue / day.cups) : '—'}
                  </Td>
                </Tr>
              ))}
              <Tr className="bg-cream font-semibold">
                <Td>Week total</Td>
                <Td align="right">{count(pnl.cups)}</Td>
                <Td align="right">{moneyBare(pnl.revenue)}</Td>
                <Td align="right">{moneyBare(pnl.revenuePerCup)}</Td>
              </Tr>
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      <PnlCard pnl={pnl} meta={meta} fixedLabel="Less fixed costs (weekly share)" />

      <Card>
        <CardHeader title="Against target" />
        <CardBody className="space-y-4">
          {week.targets.map((target) => (
            <TargetBar key={target.label} target={target} />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

/* ── Month ────────────────────────────────────────────────────────────── */

function MonthPanel({ month, meta }: { month: MonthReport; meta: ReportMeta }) {
  const { pnl, previous } = month;
  const cupsPerDay = month.days.map((day) => ({
    day: String(Number(day.date.slice(8, 10))),
    cups: day.cups,
  }));
  const actualCupsPerDay = month.tradingDays > 0 ? pnl.cups / month.tradingDays : 0;

  return (
    <div className="space-y-5">
      <PeriodNav
        label={month.label}
        prevHref={month.prevHref}
        nextHref={month.nextHref}
        currentHref={month.currentHref}
        isCurrent={month.isCurrent}
        currentLabel="This month"
      />

      <Tiles pnl={pnl} previous={previous} priorLabel="last month" />

      <Notes lines={monthNotes(month, meta, actualCupsPerDay)} />

      <PnlCard pnl={pnl} meta={meta} fixedLabel="Less fixed costs (full month)" />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Break-even" subtitle={`${count(meta.operatingDays)} trading days a week`} />
          <CardBody>
            {meta.breakEvenCupsPerDay === null ? (
              <p className="text-sm leading-relaxed text-steel">
                At the current average price a cup contributes nothing once ingredients and card
                fees are paid, so there is no break-even point to show. Prices or recipe costs need
                to change before this figure means anything.
              </p>
            ) : (
              <div className="space-y-3">
                <Figure
                  label="Cups needed a trading day"
                  value={count(meta.breakEvenCupsPerDay)}
                  hint={`Selling about ${count(actualCupsPerDay)} a day this month`}
                />
                <Figure
                  label="Profit per cup after fees"
                  value={money(meta.contributionPerCup)}
                  hint={`Average price ${money(meta.averageCupPrice)}, recipe cost ${money(meta.averageCupCost)}`}
                />
                <Figure label="Fixed costs per trading day" value={money(meta.dailyFixedCost)} />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Loyalty" subtitle="Members attached to this month" />
          <CardBody>
            <div className="space-y-3">
              <Figure label="New members this month" value={count(month.newMembers)} />
              <Figure label="Members who visited this month" value={count(month.membersSeen)} />
              <Figure
                label="Net profit target"
                value={month.netTarget > 0 ? money(month.netTarget, 0) : 'Not set'}
                hint={month.netTarget > 0 ? `${percent(month.netTargetRatio, 0)} reached` : undefined}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Revenue by month" subtitle="Last twelve months" />
        <CardBody>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={month.trend} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: STEEL }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: STEEL }}
                tickLine={false}
                axisLine={false}
                width={54}
                tickFormatter={(value) => moneyBare(Number(value), 0)}
              />
              <Tooltip
                cursor={{ fill: '#eef1f6' }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: STEEL }}
                formatter={(value) => money(Number(value))}
              />
              <Bar name="Revenue" dataKey="revenue" fill={INK} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Cups a day" subtitle={month.label} />
        <CardBody>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cupsPerDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: STEEL }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 10, fill: STEEL }}
                tickLine={false}
                axisLine={false}
                width={44}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: '#eef1f6' }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: STEEL }}
                labelFormatter={(label) => `Day ${String(label)}`}
                formatter={(value) => count(Number(value))}
              />
              <Bar name="Cups" dataKey="cups" fill={STEEL} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}

/* ── Shared pieces ────────────────────────────────────────────────────── */

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: `1px solid ${GRID}`,
  fontSize: 12,
  color: INK,
};

function Tiles({
  pnl,
  previous,
  priorLabel,
}: {
  pnl: ProfitAndLoss;
  previous: PeriodComparison;
  priorLabel: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Revenue"
        value={money(pnl.revenue, 0)}
        hint={delta(pnl.revenue, previous.revenue, priorLabel)}
      />
      <StatTile
        label="Cups"
        value={count(pnl.cups)}
        hint={delta(pnl.cups, previous.cups, priorLabel)}
      />
      <StatTile
        label="Gross profit"
        value={money(pnl.grossProfit, 0)}
        hint={`${percent(pnl.grossMargin)} of revenue`}
      />
      <StatTile
        label="Net profit"
        value={money(pnl.netProfit, 0)}
        tone={pnl.netProfit >= 0 ? 'good' : 'bad'}
        hint={`${percent(pnl.netMargin)} of revenue`}
      />
    </div>
  );
}

function PeriodNav({
  label,
  prevHref,
  nextHref,
  currentHref,
  isCurrent,
  currentLabel,
}: {
  label: string;
  prevHref: string;
  nextHref: string;
  currentHref: string;
  isCurrent: boolean;
  currentLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <NavArrow href={prevHref} label="Previous period">
        <ChevronLeft className="size-4" aria-hidden />
      </NavArrow>
      <p className="min-w-40 text-center text-sm font-semibold text-ink">{label}</p>
      <NavArrow href={nextHref} label="Next period">
        <ChevronRight className="size-4" aria-hidden />
      </NavArrow>
      {!isCurrent && (
        <Link
          href={currentHref}
          scroll={false}
          className="ml-1 text-xs font-semibold text-steel underline-offset-2 hover:text-ink hover:underline"
        >
          {currentLabel}
        </Link>
      )}
    </div>
  );
}

function NavArrow({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-[8px] border border-line bg-white text-ink transition-colors hover:border-ink hover:bg-cream"
    >
      {children}
    </Link>
  );
}

function PnlCard({
  pnl,
  meta,
  fixedLabel,
}: {
  pnl: ProfitAndLoss;
  meta: ReportMeta;
  fixedLabel: string;
}) {
  return (
    <Card>
      <CardHeader
        title="Profit and loss"
        subtitle={`Cost of sales is cups sold at ${money(meta.averageCupCost)} average recipe cost`}
        action={
          <Badge tone={pnl.netProfit >= 0 ? 'good' : 'bad'}>
            {pnl.netProfit >= 0 ? 'In profit' : 'At a loss'}
          </Badge>
        }
      />
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th>Line</Th>
              <Th align="right">Amount</Th>
              <Th align="right">Margin</Th>
            </tr>
          </thead>
          <tbody>
            <PnlRow label="Revenue (Yoco takings)" value={pnl.revenue} />
            <PnlRow label="Less cost of sales" value={-pnl.costOfSales} muted />
            <PnlRow label="Gross profit" value={pnl.grossProfit} margin={pnl.grossMargin} strong />
            <PnlRow
              label={`Less card fees (Yoco ${percent(meta.cardFeeRate)})`}
              value={-pnl.cardFees}
              muted
            />
            <PnlRow label={fixedLabel} value={-pnl.fixedCosts} muted />
            <PnlRow label="Net profit" value={pnl.netProfit} margin={pnl.netMargin} strong />
          </tbody>
        </Table>
      </TableWrap>
      <p className="px-5 py-3.5 text-xs leading-relaxed text-steel">
        VAT inside the takings at {percent(meta.vatRate)} is {money(pnl.vatPortion)}, leaving{' '}
        {money(pnl.revenueExVat)} of revenue excluding VAT. Tips of {money(pnl.tips)} are not
        counted as revenue.
      </p>
    </Card>
  );
}

function PnlRow({
  label,
  value,
  margin,
  muted,
  strong,
}: {
  label: string;
  value: number;
  margin?: number;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <Tr className={cn(strong && 'bg-cream')}>
      <Td className={cn(muted && 'text-steel', strong && 'font-semibold text-ink')}>{label}</Td>
      <Td align="right" className={cn(muted && 'text-steel', strong && 'font-semibold')}>
        {value < 0 ? `−${money(Math.abs(value))}` : money(value)}
      </Td>
      <Td align="right" className="text-steel">
        {margin === undefined ? '' : percent(margin)}
      </Td>
    </Tr>
  );
}

function TargetBar({ target }: { target: TargetProgress }) {
  const format = (value: number) => (target.format === 'money' ? money(value, 0) : count(value));

  if (target.target <= 0) {
    return (
      <div>
        <p className="text-xs font-semibold text-ink">{target.label}</p>
        <p className="mt-1 text-[11px] text-steel">
          No target set — add one in settings to track this.
        </p>
      </div>
    );
  }

  const tone = target.ratio >= 100 ? 'good' : target.ratio >= 70 ? 'default' : 'warn';

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold text-ink">{target.label}</p>
        <p className="tabular text-xs text-steel">
          {format(target.actual)} of {format(target.target)}
        </p>
      </div>
      <Progress className="mt-2" value={target.ratio} tone={tone} />
      <p className="tabular mt-1 text-[11px] text-steel">{percent(target.ratio, 0)}</p>
    </div>
  );
}

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft pb-3 last:border-0 last:pb-0">
      <div>
        <p className="text-sm text-ink">{label}</p>
        {hint && <p className="text-[11px] text-steel">{hint}</p>}
      </div>
      <p className="tabular text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function Notes({ lines }: { lines: string[] }) {
  return (
    <Card>
      <CardHeader title="What this says" />
      <CardBody className="space-y-2">
        {lines.map((line) => (
          <p key={line} className="text-sm leading-relaxed text-ink">
            {line}
          </p>
        ))}
      </CardBody>
    </Card>
  );
}

/* ── Plain-language summaries ─────────────────────────────────────────── */

function weekNotes(week: WeekReport, meta: ReportMeta): string[] {
  const { pnl, tradingDays, previous, targets } = week;

  if (pnl.revenue === 0 && pnl.cups === 0) {
    return ['Nothing has been logged for this week yet, so there is nothing to report.'];
  }

  const lines: string[] = [];

  lines.push(
    pnl.netProfit >= 0
      ? `The trailer covered its costs this week and kept ${money(pnl.netProfit)} after ingredients, card fees and the week's share of fixed costs.`
      : `The week did not cover its costs: it is ${money(Math.abs(pnl.netProfit))} short once ingredients, card fees and the week's share of fixed costs are paid.`,
  );

  const perDay = tradingDays > 0 ? pnl.cups / tradingDays : 0;
  lines.push(
    `${count(pnl.cups)} cups over ${count(tradingDays)} trading ${tradingDays === 1 ? 'day' : 'days'}, about ${count(perDay)} a day at ${money(pnl.revenuePerCup)} a cup.`,
  );

  if (meta.breakEvenCupsPerDay !== null) {
    lines.push(
      `Break-even sits at roughly ${count(meta.breakEvenCupsPerDay)} cups a trading day at the current average price and recipe cost.`,
    );
  }

  const revenueTarget = targets.find((target) => target.format === 'money');
  if (revenueTarget && revenueTarget.target > 0) {
    lines.push(
      revenueTarget.actual >= revenueTarget.target
        ? `Revenue beat the ${money(revenueTarget.target, 0)} weekly target by ${money(revenueTarget.actual - revenueTarget.target)}.`
        : `Revenue reached ${percent(revenueTarget.ratio, 0)} of the ${money(revenueTarget.target, 0)} weekly target.`,
    );
  } else if (previous.revenue > 0) {
    const diff = pnl.revenue - previous.revenue;
    lines.push(
      `Revenue was ${money(Math.abs(diff))} ${diff >= 0 ? 'above' : 'below'} the week before.`,
    );
  }

  return lines.slice(0, 4);
}

function monthNotes(month: MonthReport, meta: ReportMeta, cupsPerDay: number): string[] {
  const { pnl, tradingDays, previous } = month;

  if (pnl.revenue === 0 && pnl.cups === 0) {
    return ['Nothing has been logged for this month yet, so there is nothing to report.'];
  }

  const lines: string[] = [];

  lines.push(
    pnl.netProfit >= 0
      ? `${month.label} cleared its fixed costs and left ${money(pnl.netProfit)} in net profit.`
      : `${month.label} did not clear its fixed costs and is ${money(Math.abs(pnl.netProfit))} down.`,
  );

  if (meta.breakEvenCupsPerDay !== null) {
    lines.push(
      cupsPerDay >= meta.breakEvenCupsPerDay
        ? `It sold about ${count(cupsPerDay)} cups a trading day against a break-even of ${count(meta.breakEvenCupsPerDay)}.`
        : `It sold about ${count(cupsPerDay)} cups a trading day and needs ${count(meta.breakEvenCupsPerDay)} to break even — ${count(meta.breakEvenCupsPerDay - cupsPerDay)} more a day.`,
    );
  } else {
    lines.push(
      `${count(pnl.cups)} cups over ${count(tradingDays)} trading days at ${money(pnl.revenuePerCup)} a cup.`,
    );
  }

  if (previous.revenue > 0) {
    const diff = pnl.revenue - previous.revenue;
    lines.push(
      `Revenue was ${money(Math.abs(diff))} ${diff >= 0 ? 'above' : 'below'} the month before.`,
    );
  }

  lines.push(
    month.newMembers > 0
      ? `${count(month.newMembers)} new loyalty ${month.newMembers === 1 ? 'member' : 'members'} joined this month.`
      : 'No new loyalty members joined this month.',
  );

  return lines.slice(0, 4);
}

/* ── CSV export ───────────────────────────────────────────────────────── */

function delta(actual: number, prior: number, priorLabel: string): string {
  if (prior <= 0) return `nothing logged ${priorLabel}`;
  const change = ((actual - prior) / prior) * 100;
  return `${change >= 0 ? 'up' : 'down'} ${percent(Math.abs(change), 0)} on ${priorLabel}`;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function downloadCsv(rows: ReportDay[], filename: string) {
  const table = [
    ['Date', 'Cups', 'Revenue', 'Tips', 'Notes'],
    ...rows.map((row) => [
      row.date,
      String(row.cups),
      row.revenue.toFixed(2),
      row.tips.toFixed(2),
      row.notes,
    ]),
  ];

  // The BOM is what makes Excel read the file as UTF-8 rather than mangling it.
  const csv = `\uFEFF${table.map((cells) => cells.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
