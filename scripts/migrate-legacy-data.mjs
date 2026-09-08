#!/usr/bin/env node
/**
 * Moves the prototype's data into the new schema.
 *
 * The old app kept everything in one Supabase table, `apc_data`, as a handful
 * of JSON blobs — the entire customer list was a single row's value. This
 * reads those blobs and writes real rows.
 *
 * Two ways in:
 *
 *   # straight from the old project
 *   OLD_SUPABASE_URL=... OLD_SUPABASE_SERVICE_KEY=... node scripts/migrate-legacy-data.mjs
 *
 *   # or from the old app's "Export all" JSON
 *   node scripts/migrate-legacy-data.mjs --file ./apc-export.json
 *
 * Always do a dry run first:
 *   node scripts/migrate-legacy-data.mjs --file ./apc-export.json --dry-run
 *
 * Safe to run twice. Customers match on phone number, days on date, counts on
 * item and date — a second run updates rather than duplicates.
 */

import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const fileArg = argv.indexOf('--file');
const FILE = fileArg !== -1 ? argv[fileArg + 1] : null;

const LEGACY_KEYS = [
  'customers',
  'stock',
  'stockLog',
  'dailyLog',
  'settings',
  'expenses',
  'ingredients',
  'menuItems',
  'checklistItems',
  'checklistLog',
];

const log = {
  step: (message) => console.log(`\n\x1b[1m${message}\x1b[0m`),
  ok: (message) => console.log(`  \x1b[32m✓\x1b[0m ${message}`),
  skip: (message) => console.log(`  \x1b[90m·\x1b[0m ${message}`),
  warn: (message) => console.log(`  \x1b[33m!\x1b[0m ${message}`),
  fail: (message) => console.error(`  \x1b[31m✗\x1b[0m ${message}`),
};

function required(name) {
  const value = process.env[name];
  if (!value) {
    log.fail(`${name} is not set. See .env.example.`);
    process.exit(1);
  }
  return value;
}

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');
const asNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const asDate = (value) => {
  if (!value) return null;
  const iso = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
};
const trimOrNull = (value) => {
  const text = String(value ?? '').trim();
  return text === '' ? null : text;
};

/* ── Load the legacy blobs ────────────────────────────────────────────── */

async function loadLegacy() {
  if (FILE) {
    log.step(`Reading ${FILE}`);
    const raw = JSON.parse(await readFile(FILE, 'utf8'));
    // The old export wrapped everything in a `data` object in some versions.
    const source = raw.data && typeof raw.data === 'object' ? raw.data : raw;
    const out = {};
    for (const key of LEGACY_KEYS) {
      out[key] = source[key] ?? source[`apc_${key}`] ?? null;
    }
    return out;
  }

  log.step('Reading apc_data from the old Supabase project');
  const old = createClient(required('OLD_SUPABASE_URL'), required('OLD_SUPABASE_SERVICE_KEY'), {
    auth: { persistSession: false },
  });

  const { data, error } = await old.from('apc_data').select('key, value');
  if (error) {
    log.fail(`Could not read apc_data: ${error.message}`);
    process.exit(1);
  }

  const out = {};
  for (const row of data ?? []) out[row.key] = row.value;
  return out;
}

/* ── Migration steps ──────────────────────────────────────────────────── */

async function migrateSettings(db, businessId, settings) {
  log.step('Business settings');
  if (!settings || typeof settings !== 'object') {
    log.skip('No settings to carry over');
    return;
  }

  const patch = {};
  if (settings.businessName) patch.name = settings.businessName;
  if (settings.slogan) patch.slogan = settings.slogan;
  if (settings.operatingDays) patch.operating_days = asNumber(settings.operatingDays);
  if (settings.vatRate !== undefined) patch.vat_rate = asNumber(settings.vatRate);
  if (settings.yocoFee !== undefined) patch.card_fee_rate = asNumber(settings.yocoFee);
  if (settings.loyaltyFreeAt) patch.loyalty_free_at = asNumber(settings.loyaltyFreeAt);
  if (settings.dailyCupTarget) patch.daily_cup_target = asNumber(settings.dailyCupTarget);
  if (settings.weeklyRevenueTarget !== undefined) {
    patch.weekly_revenue_target = asNumber(settings.weeklyRevenueTarget);
  }
  if (settings.monthlyNetTarget !== undefined) {
    patch.monthly_net_target = asNumber(settings.monthlyNetTarget);
  }

  if (Object.keys(patch).length === 0) {
    log.skip('Nothing changed');
    return;
  }

  if (DRY_RUN) {
    log.ok(`Would update ${Object.keys(patch).length} settings`);
  } else {
    const { error } = await db.from('businesses').update(patch).eq('id', businessId);
    if (error) throw new Error(`businesses: ${error.message}`);
    log.ok(`Updated ${Object.keys(patch).length} settings`);
  }

  // The old settings held link URLs; site content held nothing structured.
  const links = [
    ['Yoco portal', settings.yocoUrl],
    ['Instagram', settings.instagramUrl],
    ['WhatsApp Web', settings.whatsappUrl],
    ['Google Business', settings.googleBizUrl],
    ['Canva', settings.canvaUrl],
    ['Mailchimp', settings.mailchimpUrl],
  ].filter(([, url]) => Boolean(url));

  if (links.length > 0 && !DRY_RUN) {
    const { data: existing } = await db
      .from('staff_links')
      .select('id, label')
      .eq('business_id', businessId);
    const byLabel = new Map((existing ?? []).map((row) => [row.label, row.id]));

    for (const [label, url] of links) {
      const id = byLabel.get(label);
      if (id) await db.from('staff_links').update({ url }).eq('id', id);
    }
    log.ok(`Refreshed ${links.length} shortcut links`);
  }

  if (settings.instagramUrl && !DRY_RUN) {
    await db
      .from('site_content')
      .update({ instagram_url: settings.instagramUrl })
      .eq('business_id', businessId);
  }
}

async function migrateCustomers(db, businessId, legacy) {
  log.step('Customers and loyalty balances');
  const rows = Array.isArray(legacy) ? legacy : [];
  if (rows.length === 0) {
    log.skip('No customers in the export');
    return new Map();
  }

  const { data: existing } = await db
    .from('customers')
    .select('id, phone_normalised')
    .eq('business_id', businessId);
  const byPhone = new Map(
    (existing ?? []).filter((c) => c.phone_normalised).map((c) => [c.phone_normalised, c.id]),
  );

  const idMap = new Map();
  let created = 0;
  let matched = 0;
  let skipped = 0;

  for (const legacyCustomer of rows) {
    const phone = digitsOnly(legacyCustomer.phone);
    const name = trimOrNull(legacyCustomer.name);

    if (!name) {
      skipped += 1;
      continue;
    }

    const existingId = phone ? byPhone.get(phone) : undefined;
    if (existingId) {
      idMap.set(legacyCustomer.id, existingId);
      matched += 1;
      continue;
    }

    const id = randomUUID();
    idMap.set(legacyCustomer.id, id);

    // Counters start at zero and are set by the ledger row below, so the stamp
    // history explains itself instead of appearing out of nowhere.
    const row = {
      id,
      business_id: businessId,
      name,
      phone: trimOrNull(legacyCustomer.phone),
      phone_normalised: phone || null,
      email: trimOrNull(legacyCustomer.email)?.toLowerCase() ?? null,
      birthday: asDate(legacyCustomer.birthday),
      found_via: trimOrNull(legacyCustomer.found) ?? 'Imported',
      notes: trimOrNull(legacyCustomer.notes),
      sms_opt_in: Boolean(legacyCustomer.smsOptIn),
      email_opt_in: Boolean(legacyCustomer.emailOptIn),
      joined_on: asDate(legacyCustomer.dateJoined) ?? new Date().toISOString().slice(0, 10),
    };

    if (!DRY_RUN) {
      const { error } = await db.from('customers').insert(row);
      if (error) {
        log.warn(`${name}: ${error.message}`);
        skipped += 1;
        idMap.delete(legacyCustomer.id);
        continue;
      }

      const stamps = Math.max(0, asNumber(legacyCustomer.stamps));
      const visits = Math.max(0, asNumber(legacyCustomer.visits));
      const free = Math.max(0, asNumber(legacyCustomer.freeCoffees));
      const banked = Math.max(0, asNumber(legacyCustomer.savedDrinks));

      if (stamps || visits || free || banked) {
        const when = asDate(legacyCustomer.lastVisit) ?? row.joined_on;
        const { error: eventError } = await db.from('loyalty_events').insert({
          id: randomUUID(),
          business_id: businessId,
          customer_id: id,
          kind: 'adjust',
          source: 'hub',
          stamps_delta: stamps,
          visits_delta: visits,
          free_delta: free,
          banked_delta: banked,
          device_time: `${when}T12:00:00Z`,
          note: 'Opening balance imported from the old hub',
        });
        if (eventError) log.warn(`${name} balance: ${eventError.message}`);
      }
    }

    created += 1;
  }

  log.ok(`${created} created, ${matched} already present${skipped ? `, ${skipped} skipped` : ''}`);
  return idMap;
}

async function migrateDailyLogs(db, businessId, legacy) {
  log.step('Daily logs');
  const rows = Array.isArray(legacy) ? legacy : [];
  if (rows.length === 0) {
    log.skip('No daily log entries');
    return;
  }

  const payload = rows
    .filter((entry) => asDate(entry.date))
    .map((entry) => ({
      business_id: businessId,
      log_date: asDate(entry.date),
      cups: Math.round(asNumber(entry.cups)),
      revenue: asNumber(entry.revenue),
      tips: asNumber(entry.tips),
      new_customers: Math.round(asNumber(entry.newCustomers)),
      loyalty_signups: Math.round(asNumber(entry.loyaltySignups)),
      weather: trimOrNull(entry.weather),
      notes: trimOrNull(entry.notes),
      prep_tomorrow: trimOrNull(entry.prep),
      is_event: Boolean(entry.isEvent),
      event_name: trimOrNull(entry.eventName),
    }));

  // Two entries for the same date would fail the unique index; keep the last.
  const byDate = new Map(payload.map((row) => [row.log_date, row]));
  const unique = [...byDate.values()];

  if (DRY_RUN) {
    log.ok(`Would write ${unique.length} days`);
    return;
  }

  const { error } = await db
    .from('daily_logs')
    .upsert(unique, { onConflict: 'business_id,log_date' });
  if (error) throw new Error(`daily_logs: ${error.message}`);
  log.ok(`${unique.length} days written`);
}

async function migrateStock(db, businessId, stock, stockLog) {
  log.step('Stock items and counts');

  const { data: items } = await db
    .from('stock_items')
    .select('id, name, reorder_level, on_hand')
    .eq('business_id', businessId);

  const byName = new Map((items ?? []).map((item) => [item.name.toLowerCase(), item]));
  const legacyIdToNew = new Map();
  let updated = 0;
  let added = 0;

  for (const legacyItem of Array.isArray(stock) ? stock : []) {
    const name = trimOrNull(legacyItem.name);
    if (!name) continue;

    const match = byName.get(name.toLowerCase());
    if (match) {
      legacyIdToNew.set(legacyItem.id, match.id);
      const patch = {
        reorder_level: asNumber(legacyItem.reorder),
        on_hand: asNumber(legacyItem.count),
      };
      if (
        Number(match.reorder_level) !== patch.reorder_level ||
        Number(match.on_hand) !== patch.on_hand
      ) {
        if (!DRY_RUN) await db.from('stock_items').update(patch).eq('id', match.id);
        updated += 1;
      }
      continue;
    }

    // An item the café added after the seed was written.
    const id = randomUUID();
    legacyIdToNew.set(legacyItem.id, id);
    if (!DRY_RUN) {
      const { error } = await db.from('stock_items').insert({
        id,
        business_id: businessId,
        name,
        category: trimOrNull(legacyItem.cat) ?? 'Other',
        unit: trimOrNull(legacyItem.unit) ?? 'each',
        reorder_level: asNumber(legacyItem.reorder),
        on_hand: asNumber(legacyItem.count),
        conv_factor: asNumber(legacyItem.convFactor) || 1,
        position: 100 + added,
      });
      if (error) {
        log.warn(`${name}: ${error.message}`);
        legacyIdToNew.delete(legacyItem.id);
        continue;
      }
    }
    added += 1;
  }

  log.ok(`${added} new items, ${updated} updated`);

  const counts = (Array.isArray(stockLog) ? stockLog : [])
    .map((entry) => {
      const stockItemId = legacyIdToNew.get(entry.itemId);
      const date = asDate(entry.date);
      if (!stockItemId || !date) return null;
      return {
        business_id: businessId,
        stock_item_id: stockItemId,
        count_date: date,
        opening: asNumber(entry.opening),
        used: asNumber(entry.used),
        waste: asNumber(entry.waste),
        waste_reason: trimOrNull(entry.wasteReason),
      };
    })
    .filter(Boolean);

  const uniqueCounts = [
    ...new Map(counts.map((row) => [`${row.stock_item_id}|${row.count_date}`, row])).values(),
  ];

  if (uniqueCounts.length === 0) {
    log.skip('No stock count history');
    return;
  }

  if (DRY_RUN) {
    log.ok(`Would write ${uniqueCounts.length} stock counts`);
    return;
  }

  for (let i = 0; i < uniqueCounts.length; i += 500) {
    const { error } = await db
      .from('stock_counts')
      .upsert(uniqueCounts.slice(i, i + 500), { onConflict: 'stock_item_id,count_date' });
    if (error) throw new Error(`stock_counts: ${error.message}`);
  }
  log.ok(`${uniqueCounts.length} stock counts written`);
}

async function migrateExpenses(db, businessId, legacy) {
  log.step('Monthly running costs');
  const rows = Array.isArray(legacy) ? legacy : [];
  if (rows.length === 0) {
    log.skip('No expenses');
    return;
  }

  const { data: existing } = await db
    .from('expenses')
    .select('id, name')
    .eq('business_id', businessId);
  const byName = new Map((existing ?? []).map((row) => [row.name.toLowerCase(), row.id]));

  let updated = 0;
  let added = 0;

  for (const expense of rows) {
    const name = trimOrNull(expense.name);
    if (!name) continue;

    const patch = {
      category: trimOrNull(expense.cat) ?? 'Operations',
      monthly_amount: asNumber(expense.amount),
      active: expense.active !== false,
    };

    const id = byName.get(name.toLowerCase());
    if (id) {
      if (!DRY_RUN) await db.from('expenses').update(patch).eq('id', id);
      updated += 1;
    } else {
      if (!DRY_RUN) {
        // Anything payroll-shaped stays owner-only by default.
        const adminOnly = /wage|salary|rent|insurance|trailer|drawing|owner/i.test(name);
        await db
          .from('expenses')
          .insert({ business_id: businessId, name, admin_only: adminOnly, ...patch });
      }
      added += 1;
    }
  }

  log.ok(`${added} added, ${updated} updated`);
}

async function migrateMenu(db, businessId, ingredients, menuItems) {
  log.step('Ingredients, menu and recipes');

  const { data: existingIngredients } = await db
    .from('ingredients')
    .select('id, name, cost_per')
    .eq('business_id', businessId);
  const ingredientByName = new Map(
    (existingIngredients ?? []).map((row) => [row.name.toLowerCase(), row]),
  );

  const legacyIngredientToNew = new Map();
  let ingredientChanges = 0;

  for (const legacyIngredient of Array.isArray(ingredients) ? ingredients : []) {
    const name = trimOrNull(legacyIngredient.name);
    if (!name) continue;

    const match = ingredientByName.get(name.toLowerCase());
    if (match) {
      legacyIngredientToNew.set(legacyIngredient.id, match.id);
      const cost = asNumber(legacyIngredient.costPer);
      if (Math.abs(Number(match.cost_per) - cost) > 0.0001) {
        if (!DRY_RUN) await db.from('ingredients').update({ cost_per: cost }).eq('id', match.id);
        ingredientChanges += 1;
      }
      continue;
    }

    const id = randomUUID();
    legacyIngredientToNew.set(legacyIngredient.id, id);
    if (!DRY_RUN) {
      await db.from('ingredients').insert({
        id,
        business_id: businessId,
        name,
        category: trimOrNull(legacyIngredient.cat) ?? 'Other',
        unit: trimOrNull(legacyIngredient.unit) ?? 'each',
        cost_per: asNumber(legacyIngredient.costPer),
      });
    }
    ingredientChanges += 1;
  }

  log.ok(`${ingredientChanges} ingredient changes`);

  const { data: existingItems } = await db
    .from('menu_items')
    .select('id, name')
    .eq('business_id', businessId);
  const itemByName = new Map((existingItems ?? []).map((row) => [row.name.toLowerCase(), row.id]));

  const SIZES = ['S', 'M', 'L', 'XL'];
  let priceChanges = 0;
  let newDrinks = 0;

  for (const legacyItem of Array.isArray(menuItems) ? menuItems : []) {
    const name = trimOrNull(legacyItem.name);
    if (!name) continue;

    let itemId = itemByName.get(name.toLowerCase());

    if (!itemId) {
      itemId = randomUUID();
      newDrinks += 1;
      if (!DRY_RUN) {
        const { error } = await db.from('menu_items').insert({
          id: itemId,
          business_id: businessId,
          name,
          category: trimOrNull(legacyItem.cat) ?? 'Other',
          active: legacyItem.active !== false,
        });
        if (error) {
          log.warn(`${name}: ${error.message}`);
          continue;
        }
      }
    }

    if (DRY_RUN) continue;

    for (const [index, size] of (legacyItem.sizes ?? []).entries()) {
      const { error } = await db.from('menu_item_sizes').upsert(
        {
          business_id: businessId,
          menu_item_id: itemId,
          size: size.sz ?? SIZES[index] ?? 'M',
          label: trimOrNull(size.label) ?? String(size.sz ?? 'Standard'),
          price: asNumber(size.price),
          position: index + 1,
        },
        { onConflict: 'menu_item_id,size' },
      );
      if (error) log.warn(`${name} ${size.sz}: ${error.message}`);
      else priceChanges += 1;
    }

    for (const line of legacyItem.ingredients ?? []) {
      const ingredientId = legacyIngredientToNew.get(line.ingId);
      if (!ingredientId) continue;
      const { error } = await db.from('recipe_lines').upsert(
        {
          business_id: businessId,
          menu_item_id: itemId,
          ingredient_id: ingredientId,
          amount_s: asNumber(line.amtS),
          amount_m: asNumber(line.amtM),
          amount_l: asNumber(line.amtL),
          amount_xl: asNumber(line.amtXL),
        },
        { onConflict: 'menu_item_id,ingredient_id' },
      );
      if (error) log.warn(`${name} recipe: ${error.message}`);
    }
  }

  log.ok(`${newDrinks} new drinks, ${priceChanges} prices written`);
}

async function migrateChecklists(db, businessId, checklistItems, checklistLog) {
  log.step('Checklists');

  const { data: existing } = await db
    .from('checklist_items')
    .select('id, kind, text')
    .eq('business_id', businessId);

  const byText = new Map((existing ?? []).map((row) => [`${row.kind}|${row.text}`, row.id]));
  const legacyToNew = new Map();
  let added = 0;

  for (const kind of ['opening', 'closing']) {
    const list = checklistItems?.[kind];
    for (const [index, item] of (Array.isArray(list) ? list : []).entries()) {
      const text = trimOrNull(item.text);
      if (!text) continue;

      const existingId = byText.get(`${kind}|${text}`);
      if (existingId) {
        legacyToNew.set(item.id, existingId);
        continue;
      }

      const id = randomUUID();
      legacyToNew.set(item.id, id);
      if (!DRY_RUN) {
        await db
          .from('checklist_items')
          .insert({ id, business_id: businessId, kind, text, position: 100 + index });
      }
      added += 1;
    }
  }

  log.ok(`${added} new checklist items`);

  const runs = (Array.isArray(checklistLog) ? checklistLog : [])
    .map((entry) => {
      const date = asDate(entry.date);
      const kind = entry.type === 'closing' ? 'closing' : 'opening';
      if (!date) return null;

      const completed = {};
      for (const [legacyId, done] of Object.entries(entry.items ?? {})) {
        const id = legacyToNew.get(legacyId);
        if (id && done) completed[id] = true;
      }

      return { business_id: businessId, kind, run_date: date, completed };
    })
    .filter(Boolean);

  const unique = [...new Map(runs.map((row) => [`${row.kind}|${row.run_date}`, row])).values()];

  if (unique.length === 0) {
    log.skip('No checklist history');
    return;
  }

  if (DRY_RUN) {
    log.ok(`Would write ${unique.length} checklist runs`);
    return;
  }

  const { error } = await db
    .from('checklist_runs')
    .upsert(unique, { onConflict: 'business_id,kind,run_date' });
  if (error) throw new Error(`checklist_runs: ${error.message}`);
  log.ok(`${unique.length} checklist runs written`);
}

/* ── Run ──────────────────────────────────────────────────────────────── */

async function main() {
  console.log('\n\x1b[1mApostellō — legacy data migration\x1b[0m');
  if (DRY_RUN) console.log('\x1b[33mDRY RUN — nothing will be written\x1b[0m');

  const db = createClient(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  );

  const { data: business, error: businessError } = await db
    .from('businesses')
    .select('id, name')
    .order('created_at')
    .limit(1)
    .maybeSingle();

  if (businessError || !business) {
    log.fail('No business row found. Run the migrations in supabase/migrations first.');
    process.exit(1);
  }

  log.ok(`Target: ${business.name}`);

  const legacy = await loadLegacy();
  const found = LEGACY_KEYS.filter((key) => legacy[key] != null);
  log.ok(`Found ${found.length} of ${LEGACY_KEYS.length} legacy keys: ${found.join(', ')}`);

  await migrateSettings(db, business.id, legacy.settings);
  await migrateExpenses(db, business.id, legacy.expenses);
  await migrateMenu(db, business.id, legacy.ingredients, legacy.menuItems);
  await migrateCustomers(db, business.id, legacy.customers);
  await migrateDailyLogs(db, business.id, legacy.dailyLog);
  await migrateStock(db, business.id, legacy.stock, legacy.stockLog);
  await migrateChecklists(db, business.id, legacy.checklistItems, legacy.checklistLog);

  console.log(
    DRY_RUN
      ? '\n\x1b[33mDry run finished. Re-run without --dry-run to write.\x1b[0m\n'
      : '\n\x1b[32mMigration finished.\x1b[0m\n',
  );
}

main().catch((error) => {
  log.fail(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
