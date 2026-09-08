'use strict';

const PREFIX = 'aph_';

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

const LocalDB = {
  _cache: {},
  _get(k, def) {
    if (k in this._cache) return this._cache[k];
    try {
      const v = localStorage.getItem(PREFIX + k);
      this._cache[k] = v ? JSON.parse(v) : def;
    } catch {
      this._cache[k] = def;
    }
    return this._cache[k];
  },
  _set(k, v) {
    this._cache[k] = v;
    try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch {}
  },
  has(k) { return localStorage.getItem(PREFIX + k) !== null || k in this._cache; },
  customers() { return this._get('customers', []); },
  saveCustomers(d) { this._set('customers', d); },
  stock() { return this._get('stock', clone(STOCK_DEFAULTS)); },
  saveStock(d) { this._set('stock', d); },
  dailyLog() { return this._get('dailyLog', []); },
  saveDailyLog(d) { this._set('dailyLog', d); },
  settings() { return Object.assign({}, DEFAULT_SETTINGS, this._get('settings', {})); },
  saveSettings(d) { this._set('settings', d); },
  menuItems() { return this._get('menuItems', clone(MENU_DEFAULTS)); },
  saveMenuItems(d) { this._set('menuItems', d); },
};

window.DB = LocalDB;

function seedIfEmpty() {
  const cloud = typeof LocalDB.has === 'function' && window._supabaseReady;
  const needs = (key, len) => (window.DB.has ? !window.DB.has(key) : !len);
  if (needs('menuItems', window.DB.menuItems().length)) window.DB.saveMenuItems(clone(MENU_DEFAULTS));
  if (needs('stock', window.DB.stock().length)) window.DB.saveStock(clone(STOCK_DEFAULTS));
}

function uuid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function todayStr() { return new Date().toISOString().split('T')[0]; }
function R(n) {
  return 'R ' + Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function N(n) { return Number(n || 0).toLocaleString('en-ZA'); }
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtDate(s) {
  if (!s) return '—';
  return new Date(s + 'T12:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}
function daysSince(s) {
  if (!s) return 999;
  return Math.floor((Date.now() - new Date(s + 'T12:00:00').getTime()) / 86400000);
}
function digits(s) { return String(s || '').replace(/\D/g, ''); }
function lowStock() {
  return window.DB.stock().filter((i) => Number(i.count) <= Number(i.reorder));
}
