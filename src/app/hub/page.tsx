import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Coffee,
  ExternalLink,
  Gift,
  Package,
  Stamp,
  Target,
  Wallet,
} from 'lucide-react';
import { requireStaff } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { Card, CardBody, CardHeader, EmptyState, Progress, StatTile } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { count, money, percent, relativeDays } from '@/lib/domain/format';
import { addDays, today, weekRange } from '@/lib/domain/dates';
import { averageCupCost, averageCupPrice, costMenu } from '@/lib/domain/costing';
import { breakEven, ratio, totalsFor } from '@/lib/domain/finance';
import { LEVEL_LABEL, buildStockRows, needsAttention } from '@/lib/domain/stock';

export const metadata: Metadata = { title: 'Today' };

export default async function HubHomePage() {
  const { profile, business, isAdmin } = await requireStaff();
  const supabase = await supabaseServer();
  const day = today();
  const week = weekRange(day);

  const [
    logsRes,
    stockItemsRes,
    stockCountsRes,
    readyRes,
    itemsRes,
    sizesRes,
    recipesRes,
    ingredientsRes,
    expensesRes,
    runsRes,
    checklistItemsRes,
    linksRes,
    stampsRes,
  ] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('*')
      .eq('business_id', business.id)
      .gte('log_date', week.from)
      .lte('log_date', week.to),
    supabase.from('stock_items').select('*').eq('business_id', business.id).eq('archived', false),
    supabase.from('stock_counts').select('*').eq('business_id', business.id).eq('count_date', day),
    supabase
      .from('customers')
      .select('*')
      .eq('business_id', business.id)
      .gte('stamps', business.loyalty_free_at)
      .order('stamps', { ascending: false })
      .limit(6),
    supabase.from('menu_items').select('*').eq('business_id', business.id),
    supabase.from('menu_item_sizes').select('*').eq('business_id', business.id),
    supabase.from('recipe_lines').select('*').eq('business_id', business.id),
    supabase.from('ingredients').select('*').eq('business_id', business.id),
    supabase.from('expenses').select('*').eq('business_id', business.id),
    supabase.from('checklist_runs').select('*').eq('business_id', business.id).eq('run_date', day),
    supabase
      .from('checklist_items')
      .select('*')
      .eq('business_id', business.id)
      .eq('archived', false),
    supabase.from('staff_links').select('*').eq('business_id', business.id).order('position'),
    supabase
      .from('loyalty_events')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('kind', 'stamp')
      .gte('device_time', `${day}T00:00:00`)
      .lt('device_time', `${addDays(day, 1)}T00:00:00`),
  ]);

  const weekLogs = logsRes.data ?? [];
  const todayLog = weekLogs.find((log) => log.log_date === day) ?? null;
  const weekTotals = totalsFor(weekLogs);

  const costed = costMenu(
    itemsRes.data ?? [],
    sizesRes.data ?? [],
    recipesRes.data ?? [],
    ingredientsRes.data ?? [],
  );

  const target = breakEven({
    expenses: expensesRes.data ?? [],
    averageCupPrice: averageCupPrice(costed),
    averageCupCost: averageCupCost(costed),
    cardFeeRate: Number(business.card_fee_rate),
    operatingDays: business.operating_days,
  });

  const stockRows = buildStockRows(stockItemsRes.data ?? [], stockCountsRes.data ?? []);
  const alerts = needsAttention(stockRows);
  const uncounted = stockRows.filter((row) => !row.counted).length;

  const checklistItems = checklistItemsRes.data ?? [];
  const runs = runsRes.data ?? [];
  const checklists = (['opening', 'closing'] as const).map((kind) => {
    const items = checklistItems.filter((item) => item.kind === kind);
    const run = runs.find((r) => r.kind === kind);
    const done = items.filter((item) => run?.completed?.[item.id]).length;
    return {
      kind,
      done,
      total: items.length,
      progress: items.length > 0 ? (done / items.length) * 100 : 0,
    };
  });

  const readyCustomers = readyRes.data ?? [];
  const stampsToday = stampsRes.count ?? 0;
  const cupsToday = todayLog?.cups ?? 0;
  const cupProgress = ratio(cupsToday, business.daily_cup_target);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">
          Morning, {profile.display_name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-steel">
          {todayLog
            ? 'Today is logged. Everything below is live.'
            : 'Nothing logged for today yet — do that at close of day.'}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Cups today"
          value={count(cupsToday)}
          hint={`Target ${count(business.daily_cup_target)}`}
          tone={cupProgress >= 100 ? 'good' : 'default'}
          icon={<Coffee className="size-5" />}
        />
        <StatTile
          label="Takings today"
          value={money(todayLog?.revenue ?? 0, 0)}
          hint={todayLog ? 'From the Yoco day total' : 'Not entered yet'}
          icon={<Wallet className="size-5" />}
        />
        <StatTile
          label="Break-even"
          value={target.cupsPerDay === null ? '—' : `${count(target.cupsPerDay)} cups`}
          hint={
            target.cupsPerDay === null
              ? 'Prices do not cover costs yet'
              : `Then the day is in profit`
          }
          tone={
            target.cupsPerDay !== null && cupsToday >= target.cupsPerDay ? 'good' : 'warn'
          }
          icon={<Target className="size-5" />}
        />
        <StatTile
          label="Stamps today"
          value={count(stampsToday)}
          hint={`${count(readyCustomers.length)} free drinks ready`}
          dark
          tone="ink"
          icon={<Stamp className="size-5" />}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Free drinks waiting ─────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Free drinks ready"
            subtitle={`A full card is ${business.loyalty_free_at} stamps`}
            action={
              <Link
                href="/hub/crm"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:underline"
              >
                All customers
                <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {readyCustomers.length === 0 ? (
            <EmptyState
              icon={<Gift className="size-7" />}
              title="Nobody has a full card"
              body="Cards fill up as stamps go on at the kiosk."
            />
          ) : (
            <ul className="divide-y divide-line">
              {readyCustomers.map((customer) => (
                <li key={customer.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{customer.name}</p>
                    <p className="text-[11px] text-steel">
                      Last in {relativeDays(customer.last_visit)}
                    </p>
                  </div>
                  <Badge tone="gold">
                    {customer.stamps}/{business.loyalty_free_at}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* ── Stock alerts ────────────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Stock to watch"
            subtitle={
              uncounted === stockRows.length
                ? 'Today has not been counted yet'
                : `${count(stockRows.length - uncounted)} of ${count(stockRows.length)} counted`
            }
            action={
              <Link
                href="/hub/stock"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:underline"
              >
                Stock take
                <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {alerts.length === 0 ? (
            <EmptyState
              icon={<Package className="size-7" />}
              title="Nothing running low"
              body="Everything is above its reorder level."
            />
          ) : (
            <ul className="divide-y divide-line">
              {alerts.slice(0, 6).map((row) => (
                <li key={row.item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{row.item.name}</p>
                    <p className="tabular text-[11px] text-steel">
                      {row.onHand} {row.item.unit} left · reorder at {row.item.reorder_level}
                    </p>
                  </div>
                  <Badge tone={row.level === 'low' ? 'warn' : 'bad'}>
                    {row.level === 'critical' && <AlertTriangle className="size-3" />}
                    {LEVEL_LABEL[row.level]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Checklists + week ───────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Today's checklists" subtitle="Opening and closing" />
          <CardBody className="space-y-4">
            {checklists.map((list) => (
              <Link key={list.kind} href="/hub/checklists" className="block">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-ink capitalize">{list.kind}</span>
                  <span className="tabular text-xs text-steel">
                    {list.done} of {list.total}
                  </span>
                </div>
                <Progress
                  value={list.progress}
                  tone={list.progress === 100 ? 'good' : list.progress >= 70 ? 'warn' : 'bad'}
                />
              </Link>
            ))}

            <Link
              href="/hub/daily"
              className="mt-2 flex items-center justify-between gap-3 rounded-[10px] bg-cream px-4 py-3 transition-colors hover:bg-cream-deep"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <ClipboardCheck className="size-4" />
                {todayLog ? 'Update the close of day' : 'Do the close of day'}
              </span>
              <ArrowRight className="size-4 text-steel" />
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="This week" subtitle={`${count(weekTotals.cups)} cups so far`} />
          <CardBody className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold text-steel">Takings</span>
                <span className="tabular text-sm font-semibold text-ink">
                  {money(weekTotals.revenue, 0)}
                </span>
              </div>
              <Progress
                value={ratio(weekTotals.revenue, Number(business.weekly_revenue_target))}
              />
              <p className="mt-1.5 text-[11px] text-steel">
                {percent(ratio(weekTotals.revenue, Number(business.weekly_revenue_target)), 0)} of
                the {money(business.weekly_revenue_target, 0)} target
              </p>
            </div>

            {isAdmin && (
              <Link
                href="/hub/reports"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:underline"
              >
                Full report
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Shortcuts ───────────────────────────────────────────────── */}
      {(linksRes.data ?? []).length > 0 && (
        <Card>
          <CardHeader title="Shortcuts" subtitle="Tools we link to rather than rebuild" />
          <CardBody>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {(linksRes.data ?? []).map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1.5 rounded-[10px] border border-line bg-cream px-3 py-4 text-center text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
                >
                  <ExternalLink className="size-4" />
                  {link.label}
                </a>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
