'use strict';

function isKioskUrl() {
  return new URLSearchParams(location.search).get('kiosk') === '1';
}

function showKiosk() {
  document.getElementById('app').hidden = true;
  document.getElementById('gate').innerHTML = '';
  const k = document.getElementById('kiosk');
  k.hidden = false;
  renderKioskHome();
}

function renderKioskHome() {
  document.getElementById('kioskBody').innerHTML = `
    <div class="kiosk-prompt">Enter your phone number to check your loyalty card</div>
    <input class="kiosk-phone-input" id="kioskPhone" type="tel" placeholder="e.g. 082 345 6789" inputmode="tel" autocomplete="tel">
    <button class="kiosk-action-btn primary" type="button" id="kioskCheck">Check in</button>
    <button class="kiosk-action-btn secondary" type="button" id="kioskReg">New here? Register</button>
  `;
  document.getElementById('kioskCheck').onclick = kioskLookup;
  document.getElementById('kioskReg').onclick = kioskRegisterPrompt;
  document.getElementById('kioskPhone').onkeydown = (e) => { if (e.key === 'Enter') kioskLookup(); };
  setTimeout(() => document.getElementById('kioskPhone')?.focus(), 80);
}

function kioskLookup() {
  const raw = document.getElementById('kioskPhone')?.value?.trim() || '';
  if (!raw) { toast('Please enter your phone number', 'error'); return; }
  const norm = digits(raw);
  const match = DB.customers().find((c) => {
    const cn = digits(c.phone);
    return cn && (cn === norm || cn.endsWith(norm) || norm.endsWith(cn));
  });
  if (match) renderKioskCard(match);
  else {
    document.getElementById('kioskBody').innerHTML = `
      <div class="kiosk-prompt">No account for that number</div>
      <p class="kiosk-tagline">Join the loyalty programme?</p>
      <button class="kiosk-action-btn primary" type="button" id="kioskYes">Yes, sign me up</button>
      <button class="kiosk-action-btn secondary" type="button" id="kioskNo">Try again</button>
    `;
    document.getElementById('kioskYes').onclick = () => kioskQuickRegister(norm);
    document.getElementById('kioskNo').onclick = renderKioskHome;
  }
}

function renderKioskCard(customer) {
  const need = DB.settings().loyaltyFreeAt || 10;
  const stamps = customer.stamps || 0;
  const progress = stamps % need;
  const freeDue = stamps > 0 && stamps % need === 0;
  const filled = freeDue ? need : progress;
  const dots = Array.from({ length: need }, (_, i) =>
    `<div class="kiosk-dot ${i < filled ? 'on' : ''}">${i < filled ? '•' : ''}</div>`
  ).join('');
  const ago = customer.lastVisit ? daysSince(customer.lastVisit) : null;
  document.getElementById('kioskBody').innerHTML = `
    <div class="kiosk-card">
      <div class="kiosk-welcome">Welcome back${customer.name ? ', ' + esc(customer.name.split(' ')[0]) : ''}!</div>
      ${freeDue ? '<div class="kiosk-free">You have earned a free coffee today</div>' : ''}
      <div class="kiosk-tagline">${filled} / ${need} stamps</div>
      <div class="kiosk-dots">${dots}</div>
      <div class="kiosk-tagline">${customer.visits || 0} visits · ${customer.freeCoffees || 0} free coffees
        ${ago !== null ? ' · last visit ' + (ago === 0 ? 'today' : ago + 'd ago') : ''}</div>
      <button class="kiosk-action-btn secondary" type="button" id="kioskStamp">Add stamp (staff)</button>
      <button class="kiosk-action-btn ghost" type="button" id="kioskBack">Back</button>
    </div>
  `;
  document.getElementById('kioskStamp').onclick = () => kioskAddStamp(customer.id);
  document.getElementById('kioskBack').onclick = renderKioskHome;
}

function kioskAddStamp(id) {
  askStaffPin(() => {
    const list = DB.customers();
    const c = list.find((x) => x.id === id);
    if (!c) return;
    const need = DB.settings().loyaltyFreeAt || 10;
    c.stamps = (c.stamps || 0) + 1;
    c.visits = (c.visits || 0) + 1;
    c.lastVisit = todayStr();
    if (c.stamps % need === 0) c.freeCoffees = (c.freeCoffees || 0) + 1;
    DB.saveCustomers(list);
    toast('Stamp added', 'success');
    renderKioskCard(c);
  });
}

function kioskRegisterPrompt() {
  document.getElementById('kioskBody').innerHTML = `
    <div class="kiosk-prompt">Join our loyalty programme</div>
    <input class="kiosk-phone-input" id="krName" placeholder="Your name">
    <input class="kiosk-phone-input" id="krPhone" type="tel" placeholder="Phone number" inputmode="tel">
    <button class="kiosk-action-btn primary" type="button" id="krGo">Register</button>
    <button class="kiosk-action-btn ghost" type="button" id="krBack">Back</button>
  `;
  document.getElementById('krGo').onclick = () => {
    kioskCreateCustomer(document.getElementById('krName').value, document.getElementById('krPhone').value);
  };
  document.getElementById('krBack').onclick = renderKioskHome;
}

function kioskQuickRegister(norm) {
  document.getElementById('kioskBody').innerHTML = `
    <div class="kiosk-prompt">Almost there — add your name</div>
    <input class="kiosk-phone-input" id="krName2" placeholder="Your name">
    <button class="kiosk-action-btn primary" type="button" id="krGo2">Register</button>
    <button class="kiosk-action-btn ghost" type="button" id="krBack2">Cancel</button>
  `;
  document.getElementById('krGo2').onclick = () => kioskCreateCustomer(document.getElementById('krName2').value, norm);
  document.getElementById('krBack2').onclick = renderKioskHome;
}

function kioskCreateCustomer(name, phone) {
  const norm = digits(phone);
  if (!norm) { toast('Phone number required', 'error'); return; }
  const existing = DB.customers().find((c) => digits(c.phone) === norm);
  if (existing) { renderKioskCard(existing); return; }
  const customer = {
    id: uuid(), name: (name || '').trim() || 'Guest', phone: String(phone),
    dateJoined: todayStr(), lastVisit: todayStr(), visits: 1, stamps: 1, freeCoffees: 0,
    notes: 'Registered via kiosk',
  };
  const list = DB.customers();
  list.push(customer);
  DB.saveCustomers(list);
  toast('Welcome', 'success');
  renderKioskCard(customer);
}

function askStaffPin(onOk, { exit } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'kiosk-pin-overlay';
  wrap.innerHTML = `
    <div class="kiosk-pin-box">
      <div class="kiosk-prompt" style="margin-bottom:0">${exit ? 'Staff PIN to leave kiosk' : 'Staff PIN'}</div>
      <input id="pinIn" type="password" inputmode="numeric" maxlength="8" placeholder="PIN">
      <button class="kiosk-action-btn primary" type="button" id="pinOk">Confirm</button>
      <button class="kiosk-action-btn ghost" type="button" id="pinCancel">Cancel</button>
      <div class="login-err" id="pinErr"></div>
    </div>
  `;
  document.getElementById('kiosk').appendChild(wrap);
  const go = () => {
    const pin = document.getElementById('pinIn').value;
    const expect = DB.settings().staffPin || '';
    if (!expect) { document.getElementById('pinErr').textContent = 'Set a staff PIN in Settings first'; return; }
    if (pin !== expect) { document.getElementById('pinErr').textContent = 'Wrong PIN'; return; }
    wrap.remove();
    onOk();
  };
  document.getElementById('pinOk').onclick = go;
  document.getElementById('pinIn').onkeydown = (e) => { if (e.key === 'Enter') go(); };
  document.getElementById('pinCancel').onclick = () => wrap.remove();
  setTimeout(() => document.getElementById('pinIn')?.focus(), 50);
}

function wireKioskChrome() {
  document.getElementById('kioskStaffBtn').onclick = () => {
    if (isKioskUrl()) {
      askStaffPin(() => { location.href = 'index.html'; }, { exit: true });
    } else {
      askStaffPin(() => {
        document.getElementById('kiosk').hidden = true;
        document.getElementById('app').hidden = false;
      }, { exit: true });
    }
  };
}
