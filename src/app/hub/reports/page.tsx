import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { averageCupCost, averageCupPrice, costMenu } from '@/lib/domain/costing';
import {
  addDays,
  eachDay,
  inRange,
  monthRange,
  today,
  weekLabel,
  weekRange,
  type DateRange,
} from '@/lib/domain/dates';
import { monthLabel } from '@/lib/domain/format';
import {
  breakEven,
  monthlyFixedCosts,
  profitAndLoss,
  ratio,
  totalsFor,
  weeklyFixedCosts,
  weeklyTargets,
} from '@/lib/domain/finance';
import type {
  Customer,
  DailyLog,
  Expense,
  Ingredient,
  MenuItem,
  MenuItemSize,
  RecipeLine,
} from '@/lib/db/types';
import { ReportsView, type ReportDay } from './ReportsView';

export const metadata: Metadata = { title: 'Reports' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type MemberDates = Pick<Customer, 'joined_on' | 'last_visit'>;

function rows<T>(result: { data: T[] | null }): T[] {
  return result.data ?? [];
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function weekAnchor(value: string | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return today();
  return Number.isNaN(new Date(`${value}T00:00:00`).getTime()) ? today() : value;
}

function monthParamOf(year: number, monthIndex: number): string {
  const date = new Date(year, monthIndex, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Prev/next links carry every parameter so the other tab keeps its place. */
function href(tab: 'week' | 'month', weekFrom: string, monthKey: string): string {
  return `?tab=${tab}&week=${weekFrom}&month=${monthKey}`;
}

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const { business } = await requireAdmin();
  const params = await searchParams;

  const week = weekRange(weekAnchor(first(params.week)));
  const previousWeek = weekRange(addDays(week.from, -7));

  const requestedMonth = first(params.month);
  const monthParam = requestedMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)
    ? requestedMonth
    : today().slice(0, 7);
  const year = Number(monthParam.slice(0, 4));
  const monthIndex = Number(monthParam.slice(5, 7)) - 1;
  const month = monthRange(year, monthIndex);
  const previousMonth = monthRange(year, monthIndex - 1);

  // Twelve months of trend plus whichever older period was asked for.
  const windowStart = [addDays(today(), -400), previousWeek.from, previousMonth.from].sort()[0];

  const supabase = await supabaseServer();
  const [logsRes, expensesRes, itemsRes, sizesRes, recipesRes, ingredientsRes, customersRes] =
    await Promise.all([
      supabase
        .from('daily_logs')
        .select('*')
        .eq('business_id', business.id)
        .gte('log_date', windowStart)
        .order('log_date'),
      supabase.from('expenses').select('*').eq('business_id', business.id),
      supabase.from('menu_items').select('*').eq('business_id', business.id),
      supabase.from('menu_item_sizes').select('*').eq('business_id', business.id),
      supabase.from('recipe_lines').select('*').eq('business_id', business.id),
      supabase.from('ingredients').select('*').eq('business_id', business.id),
      supabase.from('customers').select('joined_on, last_visit').eq('business_id', business.id),
    ]);

  const logs = rows<DailyLog>(logsRes);
  const expenses = rows<Expense>(expensesRes);
  const customers = rows<MemberDates>(customersRes);

  const costed = costMenu(
    rows<MenuItem>(itemsRes),
    rows<MenuItemSize>(sizesRes),
    rows<RecipeLine>(recipesRes),
    rows<Ingredient>(ingredientsRes),
  );
  const cupCost = averageCupCost(costed);
  const cupPrice = averageCupPrice(costed);

  const cardFeeRate = Number(business.card_fee_rate);
  const vatRate = Number(business.vat_rate);

  const logsByDate = new Map(logs.map((log) => [log.log_date.slice(0, 10), log]));
  const logsIn = (range: DateRange) => logs.filter((log) => inRange(log.log_date, range));

  const daysIn = (range: DateRange): ReportDay[] =>
    eachDay(range).map((date) => {
      const log = logsByDate.get(date);
      return {
        date,
        cups: log?.cups ?? 0,
        revenue: Number(log?.revenue ?? 0),
        tips: Number(log?.tips ?? 0),
        notes: log?.notes ?? '',
        logged: Boolean(log),
      };
    });

  const weekTotals = totalsFor(logsIn(week));
  const weekPnl = profitAndLoss({
    totals: weekTotals,
    averageCupCost: cupCost,
    fixedCosts: weeklyFixedCosts(expenses),
    cardFeeRate,
    vatRate,
  });
  const previousWeekTotals = totalsFor(logsIn(previousWeek));

  const monthTotals = totalsFor(logsIn(month));
  const monthPnl = profitAndLoss({
    totals: monthTotals,
    averageCupCost: cupCost,
    fixedCosts: monthlyFixedCosts(expenses),
    cardFeeRate,
    vatRate,
  });
  const previousMonthTotals = totalsFor(logsIn(previousMonth));

  const trend = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, monthIndex - 11 + index, 1);
    const range = monthRange(date.getFullYear(), date.getMonth());
    return {
      label: date.toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' }),
      revenue: totalsFor(logsIn(range)).revenue,
    };
  });

  const cover = breakEven({
    expenses,
    averageCupPrice: cupPrice,
    averageCupCost: cupCost,
    cardFeeRate,
    operatingDays: business.operating_days,
  });

  const currentWeek = weekRange();
  const currentMonth = today().slice(0, 7);
  const netTarget = Number(business.monthly_net_target);
  const tab = first(params.tab) === 'month' ? 'month' : 'week';

  return (
    <ReportsView
      key={tab}
      initialTab={tab}
      meta={{
        cardFeeRate,
        vatRate,
        operatingDays: business.operating_days,
        averageCupCost: cupCost,
        averageCupPrice: cupPrice,
        breakEvenCupsPerDay: cover.cupsPerDay,
        contributionPerCup: cover.contributionPerCup,
        dailyFixedCost: cover.dailyFixedCost,
      }}
      week={{
        from: week.from,
        label: weekLabel(week),
        prevHref: href('week', previousWeek.from, monthParam),
        nextHref: href('week', addDays(week.from, 7), monthParam),
        currentHref: href('week', currentWeek.from, monthParam),
        isCurrent: week.from === currentWeek.from,
        days: daysIn(week),
        tradingDays: weekTotals.tradingDays,
        pnl: weekPnl,
        previous: { revenue: previousWeekTotals.revenue, cups: previousWeekTotals.cups },
        targets: weeklyTargets(business, weekPnl, weekTotals),
      }}
      month={{
        param: monthParam,
        label: monthLabel(year, monthIndex),
        prevHref: href('month', week.from, monthParamOf(year, monthIndex - 1)),
        nextHref: href('month', week.from, monthParamOf(year, monthIndex + 1)),
        currentHref: href('month', week.from, currentMonth),
        isCurrent: monthParam === currentMonth,
        days: daysIn(month),
        tradingDays: monthTotals.tradingDays,
        pnl: monthPnl,
        previous: { revenue: previousMonthTotals.revenue, cups: previousMonthTotals.cups },
        trend,
        newMembers: customers.filter((customer) => inRange(customer.joined_on, month)).length,
        membersSeen: customers.filter(
          (customer) => customer.last_visit !== null && inRange(customer.last_visit, month),
        ).length,
        netTarget,
        netTargetRatio: ratio(monthPnl.netProfit, netTarget),
      }}
    />
  );
}
