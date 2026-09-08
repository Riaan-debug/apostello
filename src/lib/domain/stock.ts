import type { StockCount, StockItem } from '@/lib/db/types';

export type StockLevel = 'ok' | 'low' | 'reorder' | 'critical';

export const WASTE_REASONS = [
  'Expired',
  'Dropped',
  'Wrong order',
  'Over-steamed',
  'Spillage',
  'Other',
];

export interface StockRow {
  item: StockItem;
  /** Today's count, if it has been done. */
  count: StockCount | null;
  /** Closing from today's count, otherwise the last known on-hand figure. */
  onHand: number;
  level: StockLevel;
  counted: boolean;
}

export function stockLevel(onHand: number, reorderLevel: number): StockLevel {
  const reorder = Number(reorderLevel);
  if (reorder <= 0) return 'ok';
  if (onHand <= reorder * 0.5) return 'critical';
  if (onHand <= reorder) return 'reorder';
  if (onHand <= reorder * 1.5) return 'low';
  return 'ok';
}

export const LEVEL_LABEL: Record<StockLevel, string> = {
  ok: 'OK',
  low: 'Getting low',
  reorder: 'Reorder',
  critical: 'Critical',
};

export function buildStockRows(items: StockItem[], counts: StockCount[]): StockRow[] {
  const byItem = new Map(counts.map((c) => [c.stock_item_id, c]));

  return items
    .filter((item) => !item.archived)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
    .map((item) => {
      const count = byItem.get(item.id) ?? null;
      const onHand = count ? Number(count.closing) : Number(item.on_hand);
      return {
        item,
        count,
        onHand,
        level: stockLevel(onHand, item.reorder_level),
        counted: Boolean(count),
      };
    });
}

export function needsAttention(rows: StockRow[]): StockRow[] {
  const rank: Record<StockLevel, number> = { critical: 0, reorder: 1, low: 2, ok: 3 };
  return rows
    .filter((r) => r.level !== 'ok')
    .sort((a, b) => rank[a.level] - rank[b.level] || a.item.name.localeCompare(b.item.name));
}

/**
 * How much of each stock line the day's drink tally consumed. Recipes are in
 * the small unit (ml of milk); stock is counted in the purchase unit (litres),
 * so conv_factor divides one into the other.
 */
export function usageFromIngredients(
  items: StockItem[],
  ingredientUsage: Map<string, number>,
): Map<string, number> {
  const usage = new Map<string, number>();
  for (const item of items) {
    if (!item.ingredient_id) continue;
    const consumed = ingredientUsage.get(item.ingredient_id);
    if (!consumed) continue;
    usage.set(item.id, consumed / Number(item.conv_factor || 1));
  }
  return usage;
}
