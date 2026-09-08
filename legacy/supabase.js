// ════════════════════════════════════════════════════════════════
// supabase.js — Cloud DB layer for Apostellō Café Hub
//
// HOW TO ENABLE:
//   1. Run supabase-schema.sql in your Supabase SQL Editor
//   2. Fill in SUPABASE_URL and SUPABASE_ANON_KEY below
//   3. Add <script src="supabase.js"></script> BEFORE app.js in index.html
//
// This file patches window.DB before app.js initialises.
// The app needs no other changes — every DB.xxx() call stays identical.
// ════════════════════════════════════════════════════════════════

const SUPABASE_URL      = 'https://xikigxgeklhmisgjzdum.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpa2lneGdla2xobWlzZ2p6ZHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzI4ODIsImV4cCI6MjA5NjUwODg4Mn0.S86gLN42uGkEfnvLqJtx02JHd6L6xIkcu0JsL7Z5LJg';

// ── Supabase client (loaded from CDN) ────────────────────────────
const { createClient } = window.supabase ?? (() => { throw new Error('Supabase JS not loaded — add the CDN script before supabase.js'); })();
const _sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// ── In-memory cache (populated at boot, written through on save) ─
const _cache = {};

// ── Auth overlay ─────────────────────────────────────────────────
function _showLoginOverlay(onSuccess) {
  const div = document.createElement('div');
  div.id = 'sbLoginOverlay';
  div.style.cssText = 'position:fixed;inset:0;background:#000f28;display:flex;align-items:center;justify-content:center;z-index:99999;font-family:inherit';
  div.innerHTML = `
    <div style="background:#0a1a3a;border:1px solid rgba(255,253,229,.15);border-radius:16px;padding:40px;width:320px;text-align:center">
      <div style="font-size:22px;font-weight:800;color:#fff9e0;letter-spacing:-1px;margin-bottom:4px">Apostellō Café</div>
      <div style="font-size:12px;color:rgba(255,253,229,.35);font-style:italic;margin-bottom:32px">not just served, Sent.</div>
      <input id="sbEmail" type="email" placeholder="Email" autocomplete="username"
        style="width:100%;padding:12px 14px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,253,229,.2);border-radius:8px;color:#fff9e0;font-family:inherit;font-size:14px;box-sizing:border-box;margin-bottom:10px">
      <input id="sbPass" type="password" placeholder="Password" autocomplete="current-password"
        style="width:100%;padding:12px 14px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,253,229,.2);border-radius:8px;color:#fff9e0;font-family:inherit;font-size:14px;box-sizing:border-box;margin-bottom:16px"
        onkeydown="if(event.key==='Enter')window._sbDoLogin()">
      <button onclick="window._sbDoLogin()"
        style="width:100%;padding:13px;background:#fff9e0;color:#000f28;border:none;border-radius:8px;font-weight:700;font-family:inherit;font-size:15px;cursor:pointer;margin-bottom:8px">
        Sign in
      </button>
      <div id="sbLoginErr" style="color:#ff8a80;font-size:12px;min-height:18px"></div>
    </div>
  `;
  document.body.appendChild(div);

  window._sbDoLogin = async () => {
    const email = document.getElementById('sbEmail')?.value?.trim();
    const pass  = document.getElementById('sbPass')?.value;
    const err   = document.getElementById('sbLoginErr');
    if (!email || !pass) { if (err) err.textContent = 'Email and password required'; return; }
    const { error } = await _sb.auth.signInWithPassword({ email, password: pass });
    if (error) { if (err) err.textContent = error.message; return; }
    document.getElementById('sbLoginOverlay')?.remove();
    onSuccess();
  };

  setTimeout(() => document.getElementById('sbEmail')?.focus(), 80);
}

// ── Low-level read / write ────────────────────────────────────────
async function _read(key, defaultVal) {
  if (key in _cache) return _cache[key];
  const { data, error } = await _sb.from('apc_data').select('value').eq('key', key).single();
  if (error || !data) return defaultVal;
  _cache[key] = data.value;
  return _cache[key];
}

async function _write(key, value) {
  _cache[key] = value;
  const { error } = await _sb.from('apc_data').upsert({ key, value }, { onConflict: 'key' });
  if (error) console.error('[Supabase write error]', key, error.message, error);
}

// ── Preload all keys into cache on boot ──────────────────────────
async function _preload() {
  const { data } = await _sb.from('apc_data').select('key, value');
  (data || []).forEach(row => { _cache[row.key] = row.value; });
}

// ── Realtime sync — keeps other browser tabs / devices current ───
function _subscribeRealtime() {
  _sb.channel('apc_data_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'apc_data' },
      payload => {
        if (payload.new?.key) _cache[payload.new.key] = payload.new.value;
        // Re-render the current section so the UI reflects the remote change
        if (typeof charts !== 'undefined') {
          Object.values(charts).forEach(c => { try { c.destroy(); } catch(e) {} });
          charts = {};
        }
        if (typeof renderSection === 'function') renderSection(currentSec);
      })
    .subscribe();
}

// ── Cloud DB object (same interface as localStorage DB in app.js) ─
const CloudDB = {
  customers()          { return _cache['customers']      ?? []; },
  saveCustomers(d)     { _cache['customers'] = d;      _write('customers', d); },
  stock()              { return _cache['stock']          ?? []; },
  saveStock(d)         { _cache['stock'] = d;          _write('stock', d); },
  stockLog()           { return _cache['stockLog']       ?? []; },
  saveStockLog(d)      { _cache['stockLog'] = d;       _write('stockLog', d); },
  dailyLog()           { return _cache['dailyLog']       ?? []; },
  saveDailyLog(d)      { _cache['dailyLog'] = d;       _write('dailyLog', d); },
  settings()           { return Object.assign({}, window._DEFAULT_SETTINGS ?? {}, _cache['settings'] ?? {}); },
  saveSettings(d)      { _cache['settings'] = d;       _write('settings', d); },
  expenses()           { return _cache['expenses']       ?? []; },
  saveExpenses(d)      { _cache['expenses'] = d;       _write('expenses', d); },
  ingredients()        { return _cache['ingredients']    ?? []; },
  saveIngredients(d)   { _cache['ingredients'] = d;   _write('ingredients', d); },
  menuItems()          { return _cache['menuItems']      ?? []; },
  saveMenuItems(d)     { _cache['menuItems'] = d;      _write('menuItems', d); },
  checklistItems()     { return _cache['checklistItems'] ?? {}; },
  saveChecklistItems(d){ _cache['checklistItems'] = d; _write('checklistItems', d); },
  checklistLog()       { return _cache['checklistLog']   ?? []; },
  saveChecklistLog(d)  { _cache['checklistLog'] = d;  _write('checklistLog', d); },
  orders()             { return _cache['orders']         ?? []; },
  saveOrders(d)        { _cache['orders'] = d;         _write('orders', d); },
  suppliers()          { return _cache['suppliers']      ?? []; },
  saveSuppliers(d)     { _cache['suppliers'] = d;      _write('suppliers', d); },
  maintenance()        { return _cache['maintenance']    ?? []; },
  saveMaintenance(d)   { _cache['maintenance'] = d;   _write('maintenance', d); },
  users()              { return _cache['users']          ?? []; },
  saveUsers(d)         { _cache['users'] = d;          _write('users', d); },
  has(key)             { return key in _cache; },
};

// ── Boot sequence ─────────────────────────────────────────────────
(async () => {
  // Expose signal for app.js to wait on
  window._supabaseReady = false;

  const startApp = async () => {
    await _preload();
    _subscribeRealtime();
    window.DB = CloudDB;

    // Bridge Supabase identity into the app's role/session system.
    // Role and display name come from Supabase user_metadata.
    // To make someone staff: in Supabase Dashboard → Auth → Users → click user
    //   → edit raw user metadata → set {"role":"staff","name":"Their Name"}
    // Default role is "admin" so the owner works without any metadata setup.
    const { data: { user } } = await _sb.auth.getUser();
    if (user && typeof setSession === 'function') {
      const meta = user.user_metadata || {};
      setSession({
        id:     user.id,
        name:   meta.name   || user.email?.split('@')[0] || 'User',
        role:   meta.role   || 'admin',
        avatar: meta.avatar || '☕',
      });
    }

    window._supabaseReady = true;
    document.dispatchEvent(new Event('supabase:ready'));
  };

  const { data: { session } } = await _sb.auth.getSession();
  if (session) {
    await startApp();
  } else {
    // Wait for DOM so overlay can be appended
    const run = () => _showLoginOverlay(startApp);
    if (document.body) run(); else document.addEventListener('DOMContentLoaded', run);
  }
})();
