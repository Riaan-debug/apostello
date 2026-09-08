import type { Business, DailyLog, Expense } from '@/lib/db/types';

/** A month is not four weeks. 52 / 12 = 4.333… */
export const WEEKS_PER_MONTH = 52 / 12;

export interface PeriodTotals {
  revenue: number;
  cups: number;
  tips: number;
  days: number;
  tradingDays: number;
}

export function totalsFor(logs: DailyLog[]): PeriodTotals {
  const revenue = sum(logs.map((l) => Number(l.revenue)));
  const cups = sum(logs.map((l) => l.cups));
  const tips = sum(logs.map((l) => Number(l.tips)));
  return {
    revenue,
    cups,
    tips,
    days: logs.length,
    tradingDays: logs.filter((l) => l.cups > 0 || Number(l.revenue) > 0).length,
  };
}

export function activeExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((e) => e.active);
}

export function monthlyFixedCosts(expenses: Expense[]): number {
  return sum(activeExpenses(expenses).map((e) => Number(e.monthly_amount)));
}

export function weeklyFixedCosts(expenses: Expense[]): number {
  return monthlyFixedCosts(expenses) / WEEKS_PER_MONTH;
}

export interface ProfitAndLoss {
  revenue: number;
  cups: number;
  tips: number;
  /** Ingredients, cup, lid, sleeve. */
  costOfSales: number;
  /** Yoco's cut. */
  cardFees: number;
  fixedCosts: number;
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  /** VAT already inside the takings, at the business's own rate. */
  vatPortion: number;
  revenueExVat: number;
  revenuePerCup: number;
}

/**
 * Cost of sales is cups x the average recipe cost, because Yoco gives us the
 * money but not the line items. Fixed costs must already be scaled to the
 * period being reported: `weeklyFixedCosts` for a week, `monthlyFixedCosts`
 * for a month. The prototype used the weekly figure in the monthly view and
 * quietly understated monthly costs by roughly four fifths.
 */
export function profitAndLoss(args: {
  totals: PeriodTotals;
  averageCupCost: number;
  fixedCosts: number;
  cardFeeRate: number;
  vatRate: number;
}): ProfitAndLoss {
  const { totals, averageCupCost, fixedCosts, cardFeeRate, vatRate } = args;

  const costOfSales = totals.cups * averageCupCost;
  const cardFees = totals.revenue * (cardFeeRate / 100);
  const grossProfit = totals.revenue - costOfSales;
  const netProfit = grossProfit - fixedCosts - cardFees;
  const vatFactor = 1 + vatRate / 100;

  return {
    revenue: totals.revenue,
    cups: totals.cups,
    tips: totals.tips,
    costOfSales,
    cardFees,
    fixedCosts,
    grossProfit,
    netProfit,
    grossMargin: totals.revenue > 0 ? (grossProfit / totals.revenue) * 100 : 0,
    netMargin: totals.revenue > 0 ? (netProfit / totals.revenue) * 100 : 0,
    vatPortion: totals.revenue - totals.revenue / vatFactor,
    revenueExVat: totals.revenue / vatFactor,
    revenuePerCup: totals.cups > 0 ? totals.revenue / totals.cups : 0,
  };
}

export interface BreakEven {
  cupsPerDay: number | null;
  dailyFixedCost: number;
  contributionPerCup: number;
}

/**
 * Cups per trading day before the trailer stops losing money. Null when a cup
 * contributes nothing after card fees and ingredients — that is a pricing
 * problem, not a number to display.
 */
export function breakEven(args: {
  expenses: Expense[];
  averageCupPrice: number;
  averageCupCost: number;
  cardFeeRate: number;
  operatingDays: number;
}): BreakEven {
  const { expenses, averageCupPrice, averageCupCost, cardFeeRate, operatingDays } = args;

  const dailyFixedCost = weeklyFixedCosts(expenses) / Math.max(1, operatingDays);
  const contributionPerCup = averageCupPrice * (1 - cardFeeRate / 100) - averageCupCost;

  return {
    cupsPerDay: contributionPerCup > 0 ? Math.ceil(dailyFixedCost / contributionPerCup) : null,
    dailyFixedCost,
    contributionPerCup,
  };
}

export interface TargetProgress {
  label: string;
  actual: number;
  target: number;
  ratio: number;
  format: 'money' | 'count';
}

export function weeklyTargets(business: Business, pnl: ProfitAndLoss, totals: PeriodTotals): TargetProgress[] {
  const dailyTarget = business.daily_cup_target * business.operating_days;
  return [
    {
      label: 'Revenue this week',
      actual: pnl.revenue,
      target: Number(business.weekly_revenue_target),
      ratio: ratio(pnl.revenue, Number(business.weekly_revenue_target)),
      format: 'money',
    },
    {
      label: 'Cups this week',
      actual: totals.cups,
      target: dailyTarget,
      ratio: ratio(totals.cups, dailyTarget),
      format: 'count',
    },
  ];
}

export function ratio(actual: number, target: number): number {
  if (target <= 0) return 0;
  return (actual / target) * 100;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export const WEATHER_OPTIONS = ['Hot & sunny', 'Warm', 'Overcast', 'Cold', 'Rainy', 'Windy'];

export const EXPENSE_CATEGORIES = [
  'Labour',
  'Rent',
  'Operations',
  'Equipment',
  'Cost of Sales',
  'Marketing',
  'Other',
];
