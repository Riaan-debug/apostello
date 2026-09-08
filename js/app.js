'use strict';

const NAV = [
  { id: 'hub', label: 'Hub' },
  { id: 'crm', label: 'Loyalty' },
  { id: 'menu', label: 'Menu' },
  { id: 'stock', label: 'Stock' },
  { id: 'daily', label: 'Daily log' },
  { id: 'settings', label: 'Settings' },
];

let currentSec = 'hub';
let crmQuery = '';

function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + (type || '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2800);
}

function openModal(html) {
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalBg').classList.add('open');
}
function closeModal() {
  document.getElementById('modalBg').classList.remove('open');
  document.getElementById('modalBody').innerHTML = '';
}

function seedOnce() {
  const s = DB.settings();
  if (s.seeded) return;
  if (!DB.menuItems().length) DB.saveMenuItems(JSON.parse(JSON.stringify(MENU_DEFAULTS)));
  if (!DB.stock().length) DB.saveStock(JSON.parse(JSON.stringify(STOCK_DEFAULTS)));
  DB.saveSettings(Object.assign({}, s, { seeded: true }));
}

function renderGate(html) {
  document.getElementById('gate').innerHTML = html;
  document.getElementById('app').hidden = true;
}

function loginMarkup(mode) {
  const setup = mode === 'setup';
  return `
    <div class="login-overlay">
      <div class="login-box">
        <img src="assets/logo.svg" alt="Apostellō">
        <p>not just served, Sent.</p>
        ${setup
          ? '<div class="kiosk-prompt" style="font-size:14px;margin-bottom:12px">Create a staff PIN for the iPad</div>'
          : ''}
        ${window._supabaseConfigured
          ? `<input id="lgEmail" type="email" placeholder="Email" autocomplete="username">
             <input id="lgPass" type="password" placeholder="Password" autocomplete="current-password">`
          : `<input id="lgPin" type="password" inputmode="numeric" maxlength="8" placeholder="${setup ? 'New PIN (4–8 digits)' : 'Staff PIN'}">`}
        <button type="button" id="lgGo">${setup ? 'Save PIN & enter' : 'Sign in'}</button>
        <div class="login-err" id="lgErr"></div>
      </div>
    </div>`;
}

function startStaff() {
  seedOnce();
  document.getElementById('gate').innerHTML = '';
  document.getElementById('kiosk').hidden = true;
  document.getElementById('app').hidden = false;
  const s = DB.settings();
  const now = new Date();
  document.getElementById('topbarDate').textContent = now.toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  document.getElementById('sidebarFoot').innerHTML =
    `${esc(s.location || '')}<br>${esc(s.tradingHours || '')}<br>
     <button type="button" id="logoutBtn">Sign out</button>`;
  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('sidebarNav').innerHTML = NAV.map((n) =>
    `<button class="nav-btn${n.id === currentSec ? ' active' : ''}" data-sec="${n.id}" type="button">${n.label}</button>`
  ).join('');
  document.querySelectorAll('.nav-btn').forEach((b) => {
    b.onclick = () => navigate(b.dataset.sec);
  });
  document.getElementById('hamburger').onclick = () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('open');
  };
  document.getElementById('sidebarOverlay').onclick = closeSidebar;
  document.getElementById('modalClose').onclick = closeModal;
  document.getElementById('modalBg').onclick = (e) => {
    if (e.target.id === 'modalBg') closeModal();
  };
  navigate('hub');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

function navigate(sec) {
  currentSec = sec;
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.sec === sec));
  document.getElementById('pageTitle').textContent = (NAV.find((n) => n.id === sec) || {}).label || sec;
  closeSidebar();
  const fn = { hub: renderHub, crm: renderCRM, menu: renderMenu, stock: renderStock, daily: renderDaily, settings: renderSettings };
  fn[sec]();
}

function logout() {
  sessionStorage.removeItem('aph_ok');
  if (window._sb) window._sb.auth.signOut().catch(() => {});
  location.reload();
}

function renderHub() {
  const s = DB.settings();
  const log = DB.dailyLog();
  const today = todayStr();
  const todayEntry = log.find((e) => e.date === today);
  const cust = DB.customers();
  const low = lowStock();
  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    return d.toISOString().split('T')[0];
  })();
  const week = log.filter((e) => e.date >= weekStart);
  const weekCups = week.reduce((a, e) => a + (e.cups || 0), 0);
  const weekRev = week.reduce((a, e) => a + (e.revenue || 0), 0);
  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div>
        <div class="sec-title">${esc(s.businessName)}</div>
        <div class="sec-sub">${esc(s.location)} · ${esc(s.tradingHours)} · ${esc(s.slogan)}</div>
      </div>
      <button class="btn btn-primary" type="button" id="openKiosk">Open kiosk</button>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Today cups</div>
        <div class="kpi-value">${N(todayEntry?.cups || 0)}</div>
        <div class="kpi-sub">Target ${s.dailyCupTarget}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Today Yoco</div>
        <div class="kpi-value" style="font-size:18px">${R(todayEntry?.revenue || 0)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Loyalty members</div>
        <div class="kpi-value">${N(cust.length)}</div>
      </div>
      <div class="kpi-card ${low.length ? 'bad' : ''}">
        <div class="kpi-label">Stock alerts</div>
        <div class="kpi-value">${N(low.length)}</div>
        <div class="kpi-sub">${low.length ? low.map((i) => i.name).slice(0, 3).join(', ') : 'All ok'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">This week</div>
        <div class="kpi-value" style="font-size:18px">${N(weekCups)} cups</div>
        <div class="kpi-sub">${R(weekRev)}</div>
      </div>
    </div>
    <div class="info-note">iPad: open <strong>kiosk.html</strong> and Add to Home Screen. Staff PIN is set in Settings. This is a new hub — old Netlify data is not here unless you import a JSON backup.</div>
  `;
  document.getElementById('openKiosk').onclick = () => {
    document.getElementById('app').hidden = true;
    document.getElementById('kiosk').hidden = false;
    renderKioskHome();
  };
}

function renderCRM() {
  const list = DB.customers()
    .filter((c) => {
      const q = crmQuery.toLowerCase();
      if (!q) return true;
      return (c.name || '').toLowerCase().includes(q) || digits(c.phone).includes(digits(q));
    })
    .sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || ''));
  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Loyalty</div><div class="sec-sub">Empty until customers join on the iPad, or you import a backup</div></div>
      <button class="btn btn-primary" type="button" id="addCust">Add customer</button>
    </div>
    <div class="card">
      <div class="card-head">
        <input class="search-input" id="crmQ" placeholder="Search name or phone" value="${esc(crmQuery)}">
        <button class="btn btn-ghost btn-sm" type="button" id="crmCsv">Export CSV</button>
      </div>
      <div class="card-body" style="padding:0">
        ${list.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Name</th><th>Phone</th><th>Stamps</th><th>Visits</th><th>Last</th><th></th></tr></thead>
          <tbody>${list.map((c) => `<tr>
            <td class="fw-bold">${esc(c.name)}</td>
            <td>${esc(c.phone)}</td>
            <td>${c.stamps || 0}</td>
            <td>${c.visits || 0}</td>
            <td>${fmtDate(c.lastVisit)}</td>
            <td><button class="btn btn-ghost btn-xs" data-id="${c.id}" type="button">Edit</button></td>
          </tr>`).join('')}</tbody></table></div>` : '<div class="empty">No customers yet</div>'}
      </div>
    </div>`;
  document.getElementById('crmQ').oninput = (e) => { crmQuery = e.target.value; renderCRM(); };
  document.getElementById('addCust').onclick = () => customerModal();
  document.getElementById('crmCsv').onclick = exportCRM;
  document.querySelectorAll('[data-id]').forEach((b) => { b.onclick = () => customerModal(b.dataset.id); });
}

function customerModal(id) {
  const c = id ? DB.customers().find((x) => x.id === id) : {
    name: '', phone: '', stamps: 0, visits: 0, notes: '',
  };
  openModal(`
    <div class="modal-head"><h2>${id ? 'Edit customer' : 'New customer'}</h2></div>
    <div class="modal-content form-grid">
      <div class="field"><label>Name</label><input id="c-name" value="${esc(c.name)}"></div>
      <div class="field"><label>Phone</label><input id="c-phone" value="${esc(c.phone)}"></div>
      <div class="field"><label>Stamps</label><input id="c-stamps" type="number" min="0" value="${c.stamps || 0}"></div>
      <div class="field"><label>Visits</label><input id="c-visits" type="number" min="0" value="${c.visits || 0}"></div>
      <div class="field span2"><label>Notes</label><input id="c-notes" value="${esc(c.notes)}"></div>
    </div>
    <div class="modal-foot">
      ${id ? '<button class="btn btn-red" type="button" id="c-del">Remove</button>' : ''}
      <button class="btn btn-ghost" type="button" id="c-cancel">Cancel</button>
      <button class="btn btn-primary" type="button" id="c-save">Save</button>
    </div>`);
  document.getElementById('c-cancel').onclick = closeModal;
  document.getElementById('c-save').onclick = () => {
    const list = DB.customers();
    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    if (!name && !phone) { toast('Name or phone needed', 'error'); return; }
    if (id) {
      const row = list.find((x) => x.id === id);
      Object.assign(row, {
        name, phone,
        stamps: Number(document.getElementById('c-stamps').value) || 0,
        visits: Number(document.getElementById('c-visits').value) || 0,
        notes: document.getElementById('c-notes').value.trim(),
      });
    } else {
      list.push({
        id: uuid(), name, phone, stamps: Number(document.getElementById('c-stamps').value) || 0,
        visits: Number(document.getElementById('c-visits').value) || 0,
        dateJoined: todayStr(), lastVisit: todayStr(), freeCoffees: 0,
        notes: document.getElementById('c-notes').value.trim(),
      });
    }
    DB.saveCustomers(list);
    closeModal();
    toast('Saved', 'success');
    renderCRM();
  };
  const del = document.getElementById('c-del');
  if (del) del.onclick = () => {
    if (!confirm('Remove this customer?')) return;
    DB.saveCustomers(DB.customers().filter((x) => x.id !== id));
    closeModal();
    renderCRM();
  };
}

function exportCRM() {
  const list = DB.customers();
  if (!list.length) { toast('Nothing to export', 'error'); return; }
  const rows = [['Name', 'Phone', 'Stamps', 'Visits', 'Joined', 'Last', 'Notes']].concat(
    list.map((c) => [c.name, c.phone, c.stamps, c.visits, c.dateJoined, c.lastVisit, c.notes])
  );
  const csv = rows.map((r) => r.map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'Apostello_CRM_' + todayStr() + '.csv';
  a.click();
}

function renderMenu() {
  const items = DB.menuItems();
  const cats = [...new Set(items.map((i) => i.cat))];
  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Menu</div><div class="sec-sub">Starter prices from the old hub — edit to match the trailer</div></div>
      <button class="btn btn-primary" type="button" id="addDrink">Add drink</button>
    </div>
    ${cats.map((cat) => `
      <div class="card">
        <div class="card-head">${esc(cat)}</div>
        <div class="card-body">
          <div class="menu-grid">
            ${items.filter((i) => i.cat === cat).map((item) => `
              <div class="menu-card ${item.active ? '' : 'off'}" data-mid="${item.id}">
                <div class="menu-card-name">${esc(item.name)}</div>
                <div class="menu-card-cat">${item.active ? 'Active' : 'Off'}</div>
                <div class="price-row">${(item.sizes || []).map((sz) =>
                  `<span class="price-pill">${esc(sz.label || sz.sz)} ${R(sz.price)}</span>`
                ).join('')}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>`).join('')}`;
  document.getElementById('addDrink').onclick = () => menuModal();
  document.querySelectorAll('[data-mid]').forEach((el) => { el.onclick = () => menuModal(el.dataset.mid); });
}

function menuModal(id) {
  const item = id ? DB.menuItems().find((x) => x.id === id) : {
    name: '', cat: 'Milk-based', active: true,
    sizes: [{ sz: 'M', label: 'Regular', price: 40 }],
  };
  const sizesText = (item.sizes || []).map((sz) => `${sz.label || sz.sz}:${sz.price}`).join(', ');
  openModal(`
    <div class="modal-head"><h2>${id ? 'Edit drink' : 'New drink'}</h2></div>
    <div class="modal-content form-grid">
      <div class="field"><label>Name</label><input id="m-name" value="${esc(item.name)}"></div>
      <div class="field"><label>Category</label><input id="m-cat" value="${esc(item.cat)}"></div>
      <div class="field span2"><label>Sizes (label:price, comma separated)</label>
        <input id="m-sizes" value="${esc(sizesText)}"></div>
      <div class="field"><label><input type="checkbox" id="m-on" ${item.active ? 'checked' : ''}> Active</label></div>
    </div>
    <div class="modal-foot">
      ${id ? '<button class="btn btn-red" type="button" id="m-del">Remove</button>' : ''}
      <button class="btn btn-ghost" type="button" id="m-cancel">Cancel</button>
      <button class="btn btn-primary" type="button" id="m-save">Save</button>
    </div>`);
  document.getElementById('m-cancel').onclick = closeModal;
  document.getElementById('m-save').onclick = () => {
    const name = document.getElementById('m-name').value.trim();
    if (!name) { toast('Name required', 'error'); return; }
    const sizes = document.getElementById('m-sizes').value.split(',').map((part, i) => {
      const [label, price] = part.split(':').map((x) => x.trim());
      return { sz: String.fromCharCode(83 + i), label: label || 'Size', price: Number(price) || 0 };
    }).filter((sz) => sz.label);
    const list = DB.menuItems();
    const active = document.getElementById('m-on').checked;
    const cat = document.getElementById('m-cat').value.trim() || 'Other';
    if (id) {
      Object.assign(list.find((x) => x.id === id), { name, cat, active, sizes });
    } else {
      list.push({ id: uuid(), name, cat, active, sizes });
    }
    DB.saveMenuItems(list);
    closeModal();
    toast('Saved', 'success');
    renderMenu();
  };
  const del = document.getElementById('m-del');
  if (del) del.onclick = () => {
    if (!confirm('Remove this drink?')) return;
    DB.saveMenuItems(DB.menuItems().filter((x) => x.id !== id));
    closeModal();
    renderMenu();
  };
}

function renderStock() {
  const items = DB.stock();
  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Stock</div><div class="sec-sub">Rows in red are at or below reorder level</div></div>
      <button class="btn btn-primary" type="button" id="addStock">Add item</button>
    </div>
    <div class="card"><div class="card-body" style="padding:0"><div class="table-wrap"><table>
      <thead><tr><th>Item</th><th>Count</th><th>Reorder at</th><th>Unit</th><th></th></tr></thead>
      <tbody>${items.map((i) => `<tr class="${Number(i.count) <= Number(i.reorder) ? 'low' : ''}">
        <td class="fw-bold">${esc(i.name)}<div class="text-muted">${esc(i.cat)}</div></td>
        <td><input class="search-input" style="min-width:70px;width:80px" data-count="${i.id}" type="number" value="${i.count}"></td>
        <td>${i.reorder}</td>
        <td>${esc(i.unit)}</td>
        <td><button class="btn btn-ghost btn-xs" data-sid="${i.id}" type="button">Edit</button></td>
      </tr>`).join('')}</tbody>
    </table></div></div></div>`;
  document.querySelectorAll('[data-count]').forEach((inp) => {
    inp.onchange = () => {
      const list = DB.stock();
      const row = list.find((x) => x.id === inp.dataset.count);
      row.count = Number(inp.value) || 0;
      DB.saveStock(list);
      toast('Count saved', 'success');
    };
  });
  document.querySelectorAll('[data-sid]').forEach((b) => { b.onclick = () => stockModal(b.dataset.sid); });
  document.getElementById('addStock').onclick = () => stockModal();
}

function stockModal(id) {
  const i = id ? DB.stock().find((x) => x.id === id) : { name: '', cat: 'Other', unit: 'each', count: 0, reorder: 0 };
  openModal(`
    <div class="modal-head"><h2>${id ? 'Edit stock' : 'New item'}</h2></div>
    <div class="modal-content form-grid">
      <div class="field"><label>Name</label><input id="s-name" value="${esc(i.name)}"></div>
      <div class="field"><label>Category</label><input id="s-cat" value="${esc(i.cat)}"></div>
      <div class="field"><label>Count</label><input id="s-count" type="number" value="${i.count}"></div>
      <div class="field"><label>Reorder at</label><input id="s-re" type="number" value="${i.reorder}"></div>
      <div class="field"><label>Unit</label><input id="s-unit" value="${esc(i.unit)}"></div>
    </div>
    <div class="modal-foot">
      ${id ? '<button class="btn btn-red" type="button" id="s-del">Remove</button>' : ''}
      <button class="btn btn-ghost" type="button" id="s-cancel">Cancel</button>
      <button class="btn btn-primary" type="button" id="s-save">Save</button>
    </div>`);
  document.getElementById('s-cancel').onclick = closeModal;
  document.getElementById('s-save').onclick = () => {
    const name = document.getElementById('s-name').value.trim();
    if (!name) return;
    const row = {
      name, cat: document.getElementById('s-cat').value.trim(),
      count: Number(document.getElementById('s-count').value) || 0,
      reorder: Number(document.getElementById('s-re').value) || 0,
      unit: document.getElementById('s-unit').value.trim() || 'each',
    };
    const list = DB.stock();
    if (id) Object.assign(list.find((x) => x.id === id), row);
    else list.push(Object.assign({ id: uuid() }, row));
    DB.saveStock(list);
    closeModal();
    renderStock();
  };
  const del = document.getElementById('s-del');
  if (del) del.onclick = () => {
    DB.saveStock(DB.stock().filter((x) => x.id !== id));
    closeModal();
    renderStock();
  };
}

function renderDaily() {
  const log = [...DB.dailyLog()].sort((a, b) => b.date.localeCompare(a.date));
  const today = todayStr();
  const todayEntry = log.find((e) => e.date === today);
  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Daily log</div><div class="sec-sub">Five minutes at close — cups and Yoco total</div></div>
    </div>
    <div class="entry-form-card">
      <div class="sec-title" style="color:var(--cream);font-size:16px;margin-bottom:14px">${todayEntry ? 'Update today' : 'Log today'}</div>
      <div class="form-grid">
        <div class="field"><label>Cups sold</label><input id="dl-cups" type="number" min="0" value="${todayEntry?.cups || ''}"></div>
        <div class="field"><label>Revenue (Yoco R)</label><input id="dl-rev" type="number" step="0.01" min="0" value="${todayEntry?.revenue || ''}"></div>
        <div class="field span2"><label>Notes</label><input id="dl-notes" value="${esc(todayEntry?.notes || '')}"></div>
      </div>
      <div style="margin-top:14px"><button class="btn btn-primary" type="button" id="dl-save">Save</button></div>
    </div>
    <div class="card"><div class="card-head">History</div>
      <div class="card-body" style="padding:0">${log.length ? `<table>
        <thead><tr><th>Date</th><th>Cups</th><th>Revenue</th><th>Notes</th><th></th></tr></thead>
        <tbody>${log.map((e) => `<tr>
          <td>${fmtDate(e.date)}</td><td>${N(e.cups || 0)}</td>
          <td class="text-green fw-bold">${R(e.revenue || 0)}</td>
          <td class="text-muted">${esc(e.notes)}</td>
          <td><button class="btn btn-ghost btn-xs" data-did="${e.id}" type="button">✕</button></td>
        </tr>`).join('')}</tbody></table>` : '<div class="empty">No days logged yet</div>'}</div>
    </div>`;
  document.getElementById('dl-save').onclick = () => {
    const cups = Number(document.getElementById('dl-cups').value) || 0;
    const revenue = Number(document.getElementById('dl-rev').value) || 0;
    const notes = document.getElementById('dl-notes').value.trim();
    const list = DB.dailyLog();
    const existing = list.find((e) => e.date === today);
    if (existing) Object.assign(existing, { cups, revenue, notes });
    else list.push({ id: uuid(), date: today, cups, revenue, notes });
    DB.saveDailyLog(list);
    toast('Day saved', 'success');
    renderDaily();
  };
  document.querySelectorAll('[data-did]').forEach((b) => {
    b.onclick = () => {
      DB.saveDailyLog(DB.dailyLog().filter((e) => e.id !== b.dataset.did));
      renderDaily();
    };
  });
}

function renderSettings() {
  const s = DB.settings();
  const cloud = !!window._supabaseConfigured;
  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Settings</div><div class="sec-sub">${cloud ? 'Cloud database connected' : 'Running on this browser until you add Supabase keys'}</div></div>
    </div>
    <div class="card"><div class="card-head">Business</div><div class="card-body form-grid">
      <div class="field"><label>Name</label><input id="st-name" value="${esc(s.businessName)}"></div>
      <div class="field"><label>Location</label><input id="st-loc" value="${esc(s.location)}"></div>
      <div class="field"><label>Hours</label><input id="st-hours" value="${esc(s.tradingHours)}"></div>
      <div class="field"><label>Daily cup target</label><input id="st-cups" type="number" value="${s.dailyCupTarget}"></div>
      <div class="field"><label>Free coffee after (stamps)</label><input id="st-free" type="number" value="${s.loyaltyFreeAt}"></div>
      <div class="field"><label>Staff PIN (iPad)</label><input id="st-pin" type="password" inputmode="numeric" maxlength="8" value="${esc(s.staffPin)}" placeholder="4–8 digits"></div>
      <div class="field span2"><label>Google Business URL</label><input id="st-g" value="${esc(s.googleBizUrl)}"></div>
    </div><div class="card-body" style="padding-top:0">
      <button class="btn btn-primary" type="button" id="st-save">Save settings</button>
    </div></div>
    <div class="card"><div class="card-head">Backup</div><div class="card-body">
      <p class="sec-sub" style="margin-bottom:12px">Download JSON before you change computers. Import a backup from the old hub if someone exported it.</p>
      <button class="btn btn-primary" type="button" id="bk-out">Download backup</button>
      <button class="btn btn-ghost" type="button" id="bk-in">Import JSON</button>
    </div></div>
    <div class="info-note">To share the iPad and your phone: create a new Supabase project, run <code>sql/schema.sql</code>, put the URL and anon key in <code>js/supabase-client.js</code>, add a staff user under Authentication.</div>
  `;
  document.getElementById('st-save').onclick = () => {
    const pin = document.getElementById('st-pin').value.trim();
    if (pin && !/^\d{4,8}$/.test(pin)) { toast('PIN must be 4–8 digits', 'error'); return; }
    DB.saveSettings(Object.assign({}, s, {
      businessName: document.getElementById('st-name').value.trim(),
      location: document.getElementById('st-loc').value.trim(),
      tradingHours: document.getElementById('st-hours').value.trim(),
      dailyCupTarget: Number(document.getElementById('st-cups').value) || 100,
      loyaltyFreeAt: Number(document.getElementById('st-free').value) || 10,
      staffPin: pin,
      googleBizUrl: document.getElementById('st-g').value.trim(),
      seeded: true,
    }));
    toast('Settings saved', 'success');
    startStaff();
  };
  document.getElementById('bk-out').onclick = exportAll;
  document.getElementById('bk-in').onclick = importData;
}

function exportAll() {
  const data = {
    customers: DB.customers(),
    stock: DB.stock(),
    dailyLog: DB.dailyLog(),
    settings: DB.settings(),
    menuItems: DB.menuItems(),
    exported: new Date().toISOString(),
  };
  const a = document.createElement('a');
  a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  a.download = 'Apostello_Backup_' + todayStr() + '.json';
  a.click();
  toast('Backup downloaded', 'success');
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.customers) DB.saveCustomers(data.customers);
        if (data.stock) DB.saveStock(data.stock);
        if (data.dailyLog) DB.saveDailyLog(data.dailyLog);
        if (data.settings) DB.saveSettings(Object.assign({}, DB.settings(), data.settings, { seeded: true }));
        if (data.menuItems) DB.saveMenuItems(data.menuItems);
        toast('Imported', 'success');
        startStaff();
      } catch {
        toast('Invalid backup', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function wirePinLogin(setup) {
  renderGate(loginMarkup(setup ? 'setup' : 'pin'));
  const go = () => {
    const pin = document.getElementById('lgPin').value.trim();
    const err = document.getElementById('lgErr');
    if (!/^\d{4,8}$/.test(pin)) { err.textContent = 'Use 4–8 digits'; return; }
    const s = DB.settings();
    if (setup) {
      s.staffPin = pin;
      s.seeded = s.seeded || false;
      DB.saveSettings(s);
      sessionStorage.setItem('aph_ok', '1');
      startStaff();
      return;
    }
    if (pin !== s.staffPin) { err.textContent = 'Wrong PIN'; return; }
    sessionStorage.setItem('aph_ok', '1');
    startStaff();
  };
  document.getElementById('lgGo').onclick = go;
  document.getElementById('lgPin').onkeydown = (e) => { if (e.key === 'Enter') go(); };
}

async function boot() {
  wireKioskChrome();
  if (window._supabaseConfigured && window._sb) {
    const { data: { session } } = await window._sb.auth.getSession();
    if (isKioskUrl()) {
      if (session) {
        await window._sbPreload();
        window.DB = window._CloudDB;
        seedOnce();
        showKiosk();
      } else {
        renderGate(loginMarkup('cloud'));
        document.getElementById('lgGo').onclick = async () => {
          const err = document.getElementById('lgErr');
          const { error } = await window._sb.auth.signInWithPassword({
            email: document.getElementById('lgEmail').value.trim(),
            password: document.getElementById('lgPass').value,
          });
          if (error) { err.textContent = error.message; return; }
          await window._sbPreload();
          window.DB = window._CloudDB;
          seedOnce();
          showKiosk();
        };
      }
      return;
    }
    const enter = async () => {
      await window._sbPreload();
      window.DB = window._CloudDB;
      startStaff();
    };
    if (session) { await enter(); return; }
    renderGate(loginMarkup('cloud'));
    document.getElementById('lgGo').onclick = async () => {
      const err = document.getElementById('lgErr');
      const { error } = await window._sb.auth.signInWithPassword({
        email: document.getElementById('lgEmail').value.trim(),
        password: document.getElementById('lgPass').value,
      });
      if (error) { err.textContent = error.message; return; }
      await enter();
    };
    return;
  }

  if (isKioskUrl()) {
    showKiosk();
    return;
  }
  if (sessionStorage.getItem('aph_ok') === '1') {
    startStaff();
    return;
  }
  const pin = DB.settings().staffPin;
  wirePinLogin(!pin);
}

document.addEventListener('DOMContentLoaded', boot);
