'use client';

import { useMemo, useState, useTransition } from 'react';
import { Coffee, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  SectionHeading,
  StatTile,
} from '@/components/ui/Card';
import {
  Checkbox,
  Field,
  FormGrid,
  Input,
  NumberCell,
  Select,
  Textarea,
} from '@/components/ui/form';
import { Modal } from '@/components/ui/Modal';
import { Table, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import {
  DRINK_SIZES,
  type DrinkSize,
  type Ingredient,
  type MenuItem,
  type MenuItemSize,
  type RecipeLine,
} from '@/lib/db/types';
import {
  INGREDIENT_UNITS,
  MENU_CATEGORIES,
  averageCupCost,
  averageCupPrice,
  costMenu,
  grossMargin,
  marginBand,
  sizeCost,
} from '@/lib/domain/costing';
import { count as countFmt, money, moneyBare, percent } from '@/lib/domain/format';
import { deleteIngredient, deleteMenuItem, saveIngredient, saveMenuItem } from './actions';
import type { MenuItemInput } from './actions';

type IngredientRow = Ingredient & { cost: string };

interface DraftSize {
  id: string;
  size: DrinkSize;
  label: string;
  price: string;
}

interface DraftLine {
  id: string;
  ingredient_id: string;
  amounts: Record<DrinkSize, string>;
}

interface Draft {
  id: string;
  isNew: boolean;
  name: string;
  category: string;
  description: string;
  active: boolean;
  show_on_site: boolean;
  position: number;
  sizes: DraftSize[];
  lines: DraftLine[];
}

const SIZE_NAMES: Record<DrinkSize, string> = {
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  XL: 'Extra large',
};

const MARGIN_TEXT: Record<'good' | 'ok' | 'thin', string> = {
  good: 'text-good',
  ok: 'text-warn',
  thin: 'text-bad',
};

const MARGIN_TONE: Record<'good' | 'ok' | 'thin', 'good' | 'warn' | 'bad'> = {
  good: 'good',
  ok: 'warn',
  thin: 'bad',
};

export function MenuManager({
  businessId,
  items: initialItems,
  sizes: initialSizes,
  recipes: initialRecipes,
  ingredients: initialIngredients,
}: {
  businessId: string;
  items: MenuItem[];
  sizes: MenuItemSize[];
  recipes: RecipeLine[];
  ingredients: Ingredient[];
}) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [sizes, setSizes] = useState<MenuItemSize[]>(initialSizes);
  const [recipes, setRecipes] = useState<RecipeLine[]>(initialRecipes);
  const [ingredients, setIngredients] = useState<IngredientRow[]>(() =>
    initialIngredients.map((row) => ({ ...row, cost: String(row.cost_per) })),
  );
  const [unsaved, setUnsaved] = useState<Record<string, boolean>>({});
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const costed = useMemo(
    () => costMenu(items, sizes, recipes, ingredients),
    [items, sizes, recipes, ingredients],
  );

  const liveCount = items.filter((item) => item.active).length;
  const offMenu = items.length - liveCount;
  const avgCost = averageCupCost(costed);
  const avgPrice = averageCupPrice(costed);
  const avgMargin = grossMargin(avgPrice, avgCost);

  const usageByIngredient = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of recipes) {
      map.set(line.ingredient_id, (map.get(line.ingredient_id) ?? 0) + 1);
    }
    return map;
  }, [recipes]);

  function openNew() {
    setDraft({
      id: crypto.randomUUID(),
      isNew: true,
      name: '',
      category: MENU_CATEGORIES[0],
      description: '',
      active: true,
      show_on_site: true,
      position: items.length,
      sizes: [{ id: crypto.randomUUID(), size: 'M', label: SIZE_NAMES.M, price: '' }],
      lines: [],
    });
  }

  function openEdit(item: MenuItem) {
    setDraft({
      id: item.id,
      isNew: false,
      name: item.name,
      category: item.category,
      description: item.description,
      active: item.active,
      show_on_site: item.show_on_site,
      position: item.position,
      sizes: sizes
        .filter((size) => size.menu_item_id === item.id)
        .sort((a, b) => a.position - b.position)
        .map((size) => ({
          id: size.id,
          size: size.size,
          label: size.label,
          price: String(size.price),
        })),
      lines: recipes
        .filter((line) => line.menu_item_id === item.id)
        .map((line) => ({
          id: line.id,
          ingredient_id: line.ingredient_id,
          amounts: {
            S: String(line.amount_s),
            M: String(line.amount_m),
            L: String(line.amount_l),
            XL: String(line.amount_xl),
          },
        })),
    });
  }

  function handleSaveItem(next: Draft) {
    const input = toInput(next);

    startTransition(async () => {
      const result = await saveMenuItem(input);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const existing = items.find((item) => item.id === input.id);
      const now = new Date().toISOString();
      const row: MenuItem = {
        id: input.id,
        business_id: businessId,
        name: input.name,
        category: input.category,
        description: input.description,
        active: input.active,
        show_on_site: input.show_on_site,
        position: input.position,
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };

      setItems((prev) =>
        existing ? prev.map((item) => (item.id === row.id ? row : item)) : [...prev, row],
      );
      setSizes((prev) => [
        ...prev.filter((size) => size.menu_item_id !== input.id),
        ...input.sizes.map((size) => ({
          id: size.id,
          business_id: businessId,
          menu_item_id: input.id,
          size: size.size,
          label: size.label,
          price: size.price,
          position: size.position,
        })),
      ]);
      setRecipes((prev) => [
        ...prev.filter((line) => line.menu_item_id !== input.id),
        ...input.recipe.map((line) => ({
          id: line.id,
          business_id: businessId,
          menu_item_id: input.id,
          ingredient_id: line.ingredient_id,
          amount_s: line.amount_s,
          amount_m: line.amount_m,
          amount_l: line.amount_l,
          amount_xl: line.amount_xl,
        })),
      ]);

      setDraft(null);
      toast.success(existing ? `${row.name} saved.` : `${row.name} added.`);
    });
  }

  function handleDeleteItem(id: string) {
    startTransition(async () => {
      const result = await deleteMenuItem(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      setSizes((prev) => prev.filter((size) => size.menu_item_id !== id));
      setRecipes((prev) => prev.filter((line) => line.menu_item_id !== id));
      setDraft(null);
      toast.success('Drink deleted.');
    });
  }

  function patchIngredient(id: string, patch: Partial<IngredientRow>) {
    setIngredients((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patch };
        return patch.cost === undefined ? next : { ...next, cost_per: toNumber(patch.cost) };
      }),
    );
    setUnsaved((prev) => ({ ...prev, [id]: true }));
  }

  function handleAddIngredient() {
    const now = new Date().toISOString();
    const row: IngredientRow = {
      id: crypto.randomUUID(),
      business_id: businessId,
      name: '',
      category: 'Other',
      unit: 'g',
      cost_per: 0,
      cost: '',
      archived: false,
      created_at: now,
      updated_at: now,
    };
    setIngredients((prev) => [...prev, row]);
    setUnsaved((prev) => ({ ...prev, [row.id]: true }));
  }

  function handleSaveIngredient(row: IngredientRow) {
    startTransition(async () => {
      const result = await saveIngredient({
        id: row.id,
        name: row.name.trim(),
        category: row.category.trim(),
        unit: row.unit,
        cost_per: toNumber(row.cost),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setUnsaved((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      toast.success(`${row.name.trim()} saved.`);
    });
  }

  function handleDeleteIngredient(row: IngredientRow) {
    const used = (usageByIngredient.get(row.id) ?? 0) > 0;
    setConfirmRemove(null);

    startTransition(async () => {
      const result = await deleteIngredient(row.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (used) {
        setIngredients((prev) =>
          prev.map((item) => (item.id === row.id ? { ...item, archived: true } : item)),
        );
        toast.success('Archived — it is still part of a recipe.');
      } else {
        setIngredients((prev) => prev.filter((item) => item.id !== row.id));
        toast.success('Ingredient removed.');
      }

      setUnsaved((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    });
  }

  return (
    <>
      <SectionHeading
        title="Menu & costing"
        subtitle="What each cup sells for, what it costs to make, and what is left over."
        action={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Add drink
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Drinks on the menu"
          value={countFmt(liveCount)}
          hint={offMenu > 0 ? `${countFmt(offMenu)} off menu` : 'All live'}
          icon={<Coffee className="size-5" />}
        />
        <StatTile label="Average cup cost" value={money(avgCost)} hint="Beans, milk, cup and lid" />
        <StatTile label="Average shelf price" value={money(avgPrice)} hint="Across every live size" />
        <StatTile
          label="Average gross margin"
          value={percent(avgMargin, 0)}
          hint="60% or better is healthy"
          tone={MARGIN_TONE[marginBand(avgMargin)]}
        />
      </div>

      {costed.length === 0 ? (
        <Card className="mb-6">
          <EmptyState
            icon={<Coffee className="size-8" />}
            title="No drinks yet"
            body="Add a drink with its sizes and recipe to see what a cup really costs you."
            action={
              <Button onClick={openNew}>
                <Plus className="size-4" />
                Add drink
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="mb-6 grid gap-4 xl:grid-cols-2">
          {costed.map(({ item, sizes: costedSizes, averageMargin }) => (
            <Card key={item.id}>
              <CardHeader
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {item.name}
                    {!item.active && <Badge tone="bad">Off menu</Badge>}
                    {item.active && !item.show_on_site && (
                      <Badge tone="warn">Hidden from website</Badge>
                    )}
                  </span>
                }
                subtitle={`${item.category} · ${percent(averageMargin, 0)} average margin`}
                action={
                  <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                }
              />
              {costedSizes.length === 0 ? (
                <CardBody>
                  <p className="text-sm text-steel">No sizes yet — add one to price this drink.</p>
                </CardBody>
              ) : (
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Size</Th>
                        <Th align="right">Price R</Th>
                        <Th align="right">Cost R</Th>
                        <Th align="right">Profit R</Th>
                        <Th align="right">Margin</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {costedSizes.map((row) => (
                        <Tr key={row.size.id}>
                          <Td>
                            {row.size.label}
                            <span className="ml-1.5 text-xs text-steel-light">{row.size.size}</span>
                          </Td>
                          <Td align="right">{moneyBare(row.size.price)}</Td>
                          <Td align="right">{moneyBare(row.cost)}</Td>
                          <Td align="right">{moneyBare(row.profit)}</Td>
                          <Td
                            align="right"
                            className={cn('font-semibold', MARGIN_TEXT[marginBand(row.margin)])}
                          >
                            {percent(row.margin, 0)}
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          title="Ingredients"
          subtitle="Change a cost here and every margin above moves with it."
          action={
            <Button size="sm" variant="outline" onClick={handleAddIngredient}>
              <Plus className="size-3.5" />
              Add ingredient
            </Button>
          }
        />
        {ingredients.length === 0 ? (
          <CardBody>
            <p className="text-sm text-steel">
              Nothing here yet. Add milk, beans, cups and syrups with what one unit costs you.
            </p>
          </CardBody>
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Ingredient</Th>
                  <Th>Group</Th>
                  <Th>Unit</Th>
                  <Th align="right">Cost per unit R</Th>
                  <Th align="center">Drinks</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {ingredients.map((row) => (
                  <Tr key={row.id} tone={row.archived ? 'warn' : undefined}>
                    <Td>
                      <div className="min-w-40">
                        <Input
                          value={row.name}
                          placeholder="Milk"
                          aria-label="Ingredient name"
                          onChange={(event) => patchIngredient(row.id, { name: event.target.value })}
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="min-w-28">
                        <Input
                          value={row.category}
                          placeholder="Dairy"
                          aria-label="Ingredient group"
                          onChange={(event) =>
                            patchIngredient(row.id, { category: event.target.value })
                          }
                        />
                      </div>
                    </Td>
                    <Td>
                      <div className="w-24">
                        <Select
                          value={row.unit}
                          aria-label="Unit"
                          onChange={(event) => patchIngredient(row.id, { unit: event.target.value })}
                        >
                          {INGREDIENT_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </Td>
                    <Td align="right">
                      <NumberCell
                        value={row.cost}
                        min="0"
                        step="0.0001"
                        aria-label="Cost per unit"
                        onChange={(event) => patchIngredient(row.id, { cost: event.target.value })}
                      />
                    </Td>
                    <Td align="center" className="tabular text-steel">
                      {countFmt(usageByIngredient.get(row.id) ?? 0)}
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.archived && <Badge tone="warn">Archived</Badge>}
                        {unsaved[row.id] && (
                          <Button
                            size="sm"
                            disabled={pending}
                            onClick={() => handleSaveIngredient(row)}
                          >
                            Save
                          </Button>
                        )}
                        {!row.archived && (
                          <Button
                            size="sm"
                            variant={confirmRemove === row.id ? 'danger' : 'ghost'}
                            disabled={pending}
                            aria-label={`Remove ${row.name || 'ingredient'}`}
                            onClick={() =>
                              confirmRemove === row.id
                                ? handleDeleteIngredient(row)
                                : setConfirmRemove(row.id)
                            }
                          >
                            {confirmRemove === row.id ? 'Sure?' : <Trash2 className="size-4" />}
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      {draft && (
        <ItemEditor
          key={draft.id}
          businessId={businessId}
          initial={draft}
          ingredients={ingredients}
          saving={pending}
          onClose={() => setDraft(null)}
          onSave={handleSaveItem}
          onDelete={draft.isNew ? null : handleDeleteItem}
        />
      )}
    </>
  );
}

function ItemEditor({
  businessId,
  initial,
  ingredients,
  saving,
  onClose,
  onSave,
  onDelete,
}: {
  businessId: string;
  initial: Draft;
  ingredients: IngredientRow[];
  saving: boolean;
  onClose: () => void;
  onSave: (draft: Draft) => void;
  onDelete: ((id: string) => void) | null;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const ingredientsById = useMemo(
    () => new Map<string, Ingredient>(ingredients.map((row) => [row.id, row])),
    [ingredients],
  );

  const draftLines = useMemo<RecipeLine[]>(
    () =>
      draft.lines.map((line) => ({
        id: line.id,
        business_id: businessId,
        menu_item_id: draft.id,
        ingredient_id: line.ingredient_id,
        amount_s: toNumber(line.amounts.S),
        amount_m: toNumber(line.amounts.M),
        amount_l: toNumber(line.amounts.L),
        amount_xl: toNumber(line.amounts.XL),
      })),
    [businessId, draft.id, draft.lines],
  );

  const categoryOptions = MENU_CATEGORIES.includes(draft.category)
    ? MENU_CATEGORIES
    : [...MENU_CATEGORIES, draft.category];

  const usedSizes = new Set(draft.sizes.map((row) => row.size));
  const usedIngredients = new Set(draft.lines.map((line) => line.ingredient_id));
  const freeSize = DRINK_SIZES.find((size) => !usedSizes.has(size));
  const freeIngredient = ingredients.find((row) => !row.archived && !usedIngredients.has(row.id));
  const amountSizes = draft.sizes.length > 0 ? DRINK_SIZES.filter((s) => usedSizes.has(s)) : [];

  function patch(changes: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...changes }));
  }

  function patchSize(id: string, changes: Partial<DraftSize>) {
    patch({
      sizes: draft.sizes.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    });
  }

  function patchAmount(id: string, size: DrinkSize, value: string) {
    patch({
      lines: draft.lines.map((line) =>
        line.id === id ? { ...line, amounts: { ...line.amounts, [size]: value } } : line,
      ),
    });
  }

  function addSize() {
    if (!freeSize) return;
    patch({
      sizes: [
        ...draft.sizes,
        { id: crypto.randomUUID(), size: freeSize, label: SIZE_NAMES[freeSize], price: '' },
      ],
    });
  }

  function addLine() {
    if (!freeIngredient) return;
    patch({
      lines: [
        ...draft.lines,
        {
          id: crypto.randomUUID(),
          ingredient_id: freeIngredient.id,
          amounts: { S: '', M: '', L: '', XL: '' },
        },
      ],
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      wide
      title={draft.isNew ? 'Add drink' : draft.name.trim() || 'Edit drink'}
      subtitle="Price is what the customer pays. Cost comes from the recipe below."
      footer={
        <>
          {onDelete && (
            <Button
              variant="danger"
              className="mr-auto"
              disabled={saving}
              onClick={() =>
                confirmingDelete ? onDelete(draft.id) : setConfirmingDelete(true)
              }
            >
              <Trash2 className="size-4" />
              {confirmingDelete ? 'Tap again to delete' : 'Delete'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button loading={saving} onClick={() => onSave(draft)}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <FormGrid>
          <Field label="Name" required>
            <Input
              value={draft.name}
              placeholder="Cappuccino"
              onChange={(event) => patch({ name: event.target.value })}
            />
          </Field>
          <Field label="Category">
            <Select
              value={draft.category}
              onChange={(event) => patch({ category: event.target.value })}
            >
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
        </FormGrid>

        <Field label="Description" hint="This is the line customers read on the website menu.">
          <Textarea
            rows={2}
            value={draft.description}
            placeholder="Double shot, steamed milk, thin layer of foam."
            onChange={(event) => patch({ description: event.target.value })}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox
            label="On the menu"
            hint="Untick to stop selling it without losing the recipe."
            checked={draft.active}
            onChange={(event) => patch({ active: event.target.checked })}
          />
          <Checkbox
            label="Show on the website"
            hint="Untick for staff drinks and trials."
            checked={draft.show_on_site}
            onChange={(event) => patch({ show_on_site: event.target.checked })}
          />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[11px] font-semibold tracking-[0.06em] text-ink uppercase">
              Sizes and prices
            </h3>
            <Button size="sm" variant="outline" onClick={addSize} disabled={!freeSize}>
              <Plus className="size-3.5" />
              Add size
            </Button>
          </div>

          {draft.sizes.length === 0 ? (
            <p className="rounded-[8px] border border-line bg-cream px-3 py-2.5 text-sm text-steel">
              A drink needs at least one size before it can be priced.
            </p>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Size</Th>
                    <Th>Label</Th>
                    <Th align="right">Price R</Th>
                    <Th align="right">Cost R</Th>
                    <Th align="right">Margin</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {draft.sizes.map((row) => {
                    const cost = sizeCost(draftLines, ingredientsById, row.size);
                    const price = toNumber(row.price);
                    const margin = grossMargin(price, cost);
                    return (
                      <Tr key={row.id}>
                        <Td>
                          <div className="w-20">
                            <Select
                              value={row.size}
                              aria-label="Size"
                              onChange={(event) =>
                                patchSize(row.id, { size: event.target.value as DrinkSize })
                              }
                            >
                              {DRINK_SIZES.filter(
                                (size) => size === row.size || !usedSizes.has(size),
                              ).map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </Td>
                        <Td>
                          <div className="min-w-32">
                            <Input
                              value={row.label}
                              placeholder={SIZE_NAMES[row.size]}
                              aria-label="Size label"
                              onChange={(event) => patchSize(row.id, { label: event.target.value })}
                            />
                          </div>
                        </Td>
                        <Td align="right">
                          <NumberCell
                            value={row.price}
                            min="0"
                            step="0.5"
                            aria-label="Price"
                            onChange={(event) => patchSize(row.id, { price: event.target.value })}
                          />
                        </Td>
                        <Td align="right" className="text-steel">
                          {moneyBare(cost)}
                        </Td>
                        <Td
                          align="right"
                          className={cn('font-semibold', MARGIN_TEXT[marginBand(margin)])}
                        >
                          {percent(margin, 0)}
                        </Td>
                        <Td align="right">
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Remove ${row.label || row.size}`}
                            onClick={() =>
                              patch({ sizes: draft.sizes.filter((s) => s.id !== row.id) })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[11px] font-semibold tracking-[0.06em] text-ink uppercase">
              Recipe
            </h3>
            <Button size="sm" variant="outline" onClick={addLine} disabled={!freeIngredient}>
              <Plus className="size-3.5" />
              Add ingredient
            </Button>
          </div>

          {draft.lines.length === 0 ? (
            <p className="rounded-[8px] border border-line bg-cream px-3 py-2.5 text-sm text-steel">
              No recipe yet, so this drink costs nothing on paper. Add beans, milk and the cup to
              get a real margin.
            </p>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Ingredient</Th>
                    {amountSizes.map((size) => (
                      <Th key={size} align="right">
                        {size}
                      </Th>
                    ))}
                    <Th>Unit</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {draft.lines.map((line) => {
                    const ingredient = ingredientsById.get(line.ingredient_id);
                    return (
                      <Tr key={line.id}>
                        <Td>
                          <div className="min-w-40">
                            <Select
                              value={line.ingredient_id}
                              aria-label="Ingredient"
                              onChange={(event) =>
                                patch({
                                  lines: draft.lines.map((row) =>
                                    row.id === line.id
                                      ? { ...row, ingredient_id: event.target.value }
                                      : row,
                                  ),
                                })
                              }
                            >
                              {ingredients
                                .filter(
                                  (row) =>
                                    row.id === line.ingredient_id ||
                                    (!row.archived && !usedIngredients.has(row.id)),
                                )
                                .map((row) => (
                                  <option key={row.id} value={row.id}>
                                    {row.name || 'Unnamed'}
                                  </option>
                                ))}
                            </Select>
                          </div>
                        </Td>
                        {amountSizes.map((size) => (
                          <Td key={size} align="right">
                            <NumberCell
                              value={line.amounts[size]}
                              min="0"
                              step="0.1"
                              aria-label={`Amount for ${size}`}
                              onChange={(event) => patchAmount(line.id, size, event.target.value)}
                            />
                          </Td>
                        ))}
                        <Td className="text-xs text-steel">
                          {ingredient ? `${ingredient.unit} · ${money(ingredient.cost_per, 4)}` : '—'}
                        </Td>
                        <Td align="right">
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Remove ${ingredient?.name ?? 'line'}`}
                            onClick={() =>
                              patch({ lines: draft.lines.filter((row) => row.id !== line.id) })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </div>
      </div>
    </Modal>
  );
}

function toInput(draft: Draft): MenuItemInput {
  return {
    id: draft.id,
    name: draft.name.trim(),
    category: draft.category,
    description: draft.description.trim(),
    active: draft.active,
    show_on_site: draft.show_on_site,
    position: draft.position,
    sizes: draft.sizes.map((row, index) => ({
      id: row.id,
      size: row.size,
      label: row.label.trim() || SIZE_NAMES[row.size],
      price: toNumber(row.price),
      position: index,
    })),
    recipe: draft.lines.map((line) => ({
      id: line.id,
      ingredient_id: line.ingredient_id,
      amount_s: toNumber(line.amounts.S),
      amount_m: toNumber(line.amounts.M),
      amount_l: toNumber(line.amounts.L),
      amount_xl: toNumber(line.amounts.XL),
    })),
  };
}

function toNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}
