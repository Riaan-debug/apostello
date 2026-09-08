'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth';
import { MENU_TAG, SITE_TAG } from '@/lib/content';
import { INGREDIENT_UNITS } from '@/lib/domain/costing';
import { supabaseServer } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

const amount = z.number().min(0, 'Amounts cannot be negative').max(100_000);

const sizeSchema = z.object({
  id: z.uuid(),
  size: z.enum(['S', 'M', 'L', 'XL']),
  label: z.string().trim().min(1, 'Every size needs a label').max(40),
  price: z.number().min(0, 'Prices cannot be negative').max(100_000),
  position: z.number().int().min(0),
});

const recipeSchema = z.object({
  id: z.uuid(),
  ingredient_id: z.uuid('Pick an ingredient for every recipe line'),
  amount_s: amount,
  amount_m: amount,
  amount_l: amount,
  amount_xl: amount,
});

const menuItemSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, 'Give the drink a name').max(80),
  // Free text in the database, so a category imported from the old menu
  // survives an edit even though the picker only offers MENU_CATEGORIES.
  category: z.string().trim().min(1, 'Pick a category').max(40),
  description: z.string().trim().max(400, 'Keep the description under 400 characters'),
  active: z.boolean(),
  show_on_site: z.boolean(),
  position: z.number().int().min(0),
  sizes: z
    .array(sizeSchema)
    .min(1, 'A drink needs at least one size')
    .max(4)
    .refine(
      (rows) => new Set(rows.map((row) => row.size)).size === rows.length,
      'Each size can only be used once',
    ),
  recipe: z
    .array(recipeSchema)
    .max(40)
    .refine(
      (rows) => new Set(rows.map((row) => row.ingredient_id)).size === rows.length,
      'Each ingredient can only appear once in a recipe',
    ),
});

const ingredientSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, 'Give the ingredient a name').max(80),
  category: z.string().trim().max(40),
  unit: z
    .string()
    .trim()
    .refine((value) => INGREDIENT_UNITS.includes(value), 'Pick a unit from the list'),
  cost_per: z.number().min(0, 'Cost cannot be negative').max(1_000_000),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type IngredientInput = z.infer<typeof ingredientSchema>;

export async function saveMenuItem(input: MenuItemInput): Promise<ActionResult> {
  const { profile } = await requireStaff();

  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstMessage(parsed.error) };

  const item = parsed.data;
  const businessId = profile.business_id;

  try {
    const supabase = await supabaseServer();

    const { error: itemError } = await supabase.from('menu_items').upsert({
      id: item.id,
      business_id: businessId,
      name: item.name,
      category: item.category,
      description: item.description,
      active: item.active,
      show_on_site: item.show_on_site,
      position: item.position,
    });
    if (itemError) return fail('Could not save the drink.', itemError);

    const staleSizes = await staleIds(
      'menu_item_sizes',
      item.id,
      item.sizes.map((size) => size.id),
    );
    if (staleSizes.length > 0) {
      const { error } = await supabase.from('menu_item_sizes').delete().in('id', staleSizes);
      if (error) return fail('Could not remove the sizes you took off.', error);
    }

    const { error: sizeError } = await supabase.from('menu_item_sizes').upsert(
      item.sizes.map((size) => ({
        id: size.id,
        business_id: businessId,
        menu_item_id: item.id,
        size: size.size,
        label: size.label,
        price: size.price,
        position: size.position,
      })),
    );
    if (sizeError) return fail('Could not save the sizes.', sizeError);

    const staleLines = await staleIds(
      'recipe_lines',
      item.id,
      item.recipe.map((line) => line.id),
    );
    if (staleLines.length > 0) {
      const { error } = await supabase.from('recipe_lines').delete().in('id', staleLines);
      if (error) return fail('Could not remove the recipe lines you took off.', error);
    }

    if (item.recipe.length > 0) {
      const { error: recipeError } = await supabase.from('recipe_lines').upsert(
        item.recipe.map((line) => ({
          id: line.id,
          business_id: businessId,
          menu_item_id: item.id,
          ingredient_id: line.ingredient_id,
          amount_s: line.amount_s,
          amount_m: line.amount_m,
          amount_l: line.amount_l,
          amount_xl: line.amount_xl,
        })),
      );
      if (recipeError) return fail('Could not save the recipe.', recipeError);
    }

    refresh();
    return { ok: true };
  } catch (error) {
    return fail('Could not save the drink.', error);
  }
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  const { profile } = await requireStaff();

  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: 'That drink no longer exists.' };

  try {
    const supabase = await supabaseServer();
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', parsed.data)
      .eq('business_id', profile.business_id);
    if (error) return fail('Could not delete the drink.', error);

    refresh();
    return { ok: true };
  } catch (error) {
    return fail('Could not delete the drink.', error);
  }
}

export async function saveIngredient(input: IngredientInput): Promise<ActionResult> {
  const { profile } = await requireStaff();

  const parsed = ingredientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstMessage(parsed.error) };

  const ingredient = parsed.data;

  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.from('ingredients').upsert({
      id: ingredient.id,
      business_id: profile.business_id,
      name: ingredient.name,
      category: ingredient.category || 'Other',
      unit: ingredient.unit,
      cost_per: ingredient.cost_per,
    });
    if (error) return fail('Could not save the ingredient.', error);

    refresh();
    return { ok: true };
  } catch (error) {
    return fail('Could not save the ingredient.', error);
  }
}

/**
 * Hard delete would cascade the recipe lines that use this ingredient and
 * quietly drop those drinks' costs, so anything in use is archived instead.
 */
export async function deleteIngredient(id: string): Promise<ActionResult> {
  const { profile } = await requireStaff();

  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: 'That ingredient no longer exists.' };

  try {
    const supabase = await supabaseServer();

    const { count, error: countError } = await supabase
      .from('recipe_lines')
      .select('id', { count: 'exact', head: true })
      .eq('ingredient_id', parsed.data);
    if (countError) return fail('Could not check where the ingredient is used.', countError);

    if ((count ?? 0) > 0) {
      const { error } = await supabase
        .from('ingredients')
        .update({ archived: true })
        .eq('id', parsed.data)
        .eq('business_id', profile.business_id);
      if (error) return fail('Could not archive the ingredient.', error);
    } else {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', parsed.data)
        .eq('business_id', profile.business_id);
      if (error) return fail('Could not delete the ingredient.', error);
    }

    refresh();
    return { ok: true };
  } catch (error) {
    return fail('Could not delete the ingredient.', error);
  }
}

async function staleIds(
  table: 'menu_item_sizes' | 'recipe_lines',
  menuItemId: string,
  keep: string[],
): Promise<string[]> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from(table).select('id').eq('menu_item_id', menuItemId);
  return (data ?? []).map((row) => row.id).filter((id) => !keep.includes(id));
}

function refresh(): void {
  revalidatePath('/hub/menu');
  revalidateTag(MENU_TAG);
  revalidateTag(SITE_TAG);
}

function firstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Something in that form does not look right.';
}

function fail(message: string, cause: unknown): ActionResult {
  console.error(message, cause);
  return { ok: false, error: `${message} Nothing else was changed.` };
}
