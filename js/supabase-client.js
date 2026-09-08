'use strict';

// Fill these with YOUR new Supabase project — never Luhandre's old keys.
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

window._supabaseReady = false;

(async function bootCloud() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  if (!window.supabase) return;
  const { createClient } = window.supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true } });
  const cache = {};

  async function read(key, def) {
    if (key in cache) return cache[key];
    const { data } = await sb.from('apc_data').select('value').eq('key', key).single();
    cache[key] = data ? data.value : def;
    return cache[key];
  }
  async function write(key, value) {
    cache[key] = value;
    const { error } = await sb.from('apc_data').upsert({ key, value }, { onConflict: 'key' });
    if (error) console.error(key, error.message);
  }
  async function preload() {
    const { data } = await sb.from('apc_data').select('key, value');
    (data || []).forEach((row) => { cache[row.key] = row.value; });
  }

  const CloudDB = {
    has(key) { return key in cache; },
    customers() { return cache.customers || []; },
    saveCustomers(d) { write('customers', d); },
    stock() { return cache.stock != null ? cache.stock : JSON.parse(JSON.stringify(STOCK_DEFAULTS)); },
    saveStock(d) { write('stock', d); },
    dailyLog() { return cache.dailyLog || []; },
    saveDailyLog(d) { write('dailyLog', d); },
    settings() { return Object.assign({}, DEFAULT_SETTINGS, cache.settings || {}); },
    saveSettings(d) { write('settings', d); },
    menuItems() { return cache.menuItems != null ? cache.menuItems : JSON.parse(JSON.stringify(MENU_DEFAULTS)); },
    saveMenuItems(d) { write('menuItems', d); },
  };

  window._sb = sb;
  window._sbPreload = preload;
  window._CloudDB = CloudDB;
  window._supabaseConfigured = true;
})();
