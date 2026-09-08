import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { MenuManager } from './MenuManager';

export const metadata: Metadata = { title: 'Menu & costing' };

export default async function HubMenuPage() {
  const { profile } = await requireStaff();
  const supabase = await supabaseServer();

  const [items, sizes, recipes, ingredients] = await Promise.all([
    supabase.from('menu_items').select('*').order('position'),
    supabase.from('menu_item_sizes').select('*').order('position'),
    supabase.from('recipe_lines').select('*'),
    supabase.from('ingredients').select('*').order('category').order('name'),
  ]);

  return (
    <MenuManager
      businessId={profile.business_id}
      items={items.data ?? []}
      sizes={sizes.data ?? []}
      recipes={recipes.data ?? []}
      ingredients={ingredients.data ?? []}
    />
  );
}
