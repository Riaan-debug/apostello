import type { DrinkSize, Ingredient, MenuItem, MenuItemSize, RecipeLine } from '@/lib/db/types';

const AMOUNT_FIELD: Record<DrinkSize, keyof Pick<RecipeLine, 'amount_s' | 'amount_m' | 'amount_l' | 'amount_xl'>> = {
  S: 'amount_s',
  M: 'amount_m',
  L: 'amount_l',
  XL: 'amount_xl',
};

export function recipeAmount(line: RecipeLine, size: DrinkSize): number {
  return Number(line[AMOUNT_FIELD[size]] ?? 0);
}

/** What one cup of this size costs in ingredients, cup, lid and sleeve. */
export function sizeCost(
  lines: RecipeLine[],
  ingredientsById: Map<string, Ingredient>,
  size: DrinkSize,
): number {
  return lines.reduce((total, line) => {
    const ingredient = ingredientsById.get(line.ingredient_id);
    if (!ingredient) return total;
    return total + recipeAmount(line, size) * Number(ingredient.cost_per);
  }, 0);
}

export function grossMargin(price: number, cost: number): number {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

export interface CostedSize {
  size: MenuItemSize;
  cost: number;
  profit: number;
  margin: number;
}

export interface CostedItem {
  item: MenuItem;
  sizes: CostedSize[];
  averageCost: number;
  averagePrice: number;
  averageMargin: number;
}

export function costMenu(
  items: MenuItem[],
  sizes: MenuItemSize[],
  recipes: RecipeLine[],
  ingredients: Ingredient[],
): CostedItem[] {
  const ingredientsById = new Map(ingredients.map((i) => [i.id, i]));

  const sizesByItem = new Map<string, MenuItemSize[]>();
  for (const size of sizes) {
    const list = sizesByItem.get(size.menu_item_id) ?? [];
    list.push(size);
    sizesByItem.set(size.menu_item_id, list);
  }

  const recipesByItem = new Map<string, RecipeLine[]>();
  for (const line of recipes) {
    const list = recipesByItem.get(line.menu_item_id) ?? [];
    list.push(line);
    recipesByItem.set(line.menu_item_id, list);
  }

  return items.map((item) => {
    const lines = recipesByItem.get(item.id) ?? [];
    const itemSizes = (sizesByItem.get(item.id) ?? []).sort((a, b) => a.position - b.position);

    const costed = itemSizes.map<CostedSize>((size) => {
      const cost = sizeCost(lines, ingredientsById, size.size);
      const price = Number(size.price);
      return { size, cost, profit: price - cost, margin: grossMargin(price, cost) };
    });

    const averageCost = mean(costed.map((c) => c.cost));
    const averagePrice = mean(costed.map((c) => Number(c.size.price)));

    return {
      item,
      sizes: costed,
      averageCost,
      averagePrice,
      averageMargin: grossMargin(averagePrice, averageCost),
    };
  });
}

/**
 * Average ingredient cost of a cup across the live menu. Feeds cost of sales
 * in the weekly report and the break-even line on the hub.
 */
export function averageCupCost(costed: CostedItem[]): number {
  const live = costed.filter((c) => c.item.active);
  return mean(live.flatMap((c) => c.sizes.map((s) => s.cost)));
}

/** Average shelf price of a cup across the live menu. */
export function averageCupPrice(costed: CostedItem[]): number {
  const live = costed.filter((c) => c.item.active);
  return mean(live.flatMap((c) => c.sizes.map((s) => Number(s.size.price))));
}

export function marginBand(margin: number): 'good' | 'ok' | 'thin' {
  if (margin >= 60) return 'good';
  if (margin >= 40) return 'ok';
  return 'thin';
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export const MENU_CATEGORIES = [
  'Espresso',
  'Milk-based',
  'Speciality',
  'Cold',
  'Food',
  'Other',
];

export const INGREDIENT_UNITS = ['g', 'ml', 'each', 'kg', 'L', 'cyl'];
