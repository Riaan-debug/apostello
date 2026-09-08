'use strict';

// ═══════════════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS = {
  businessName:'Apostellō Café', slogan:'not just served, Sent.',
  location:'CMV Business Park', tradingHours:'06:30 – 15:30',
  operatingDays:5, vatRate:15, yocoFee:2.9, wastage:5,
  targetMargin:65, dailyCupTarget:100,
  weeklyRevenueTarget:58968, monthlyNetTarget:75916,
  loyaltyFreeAt:10,
  instagramUrl:'https://www.instagram.com', mailchimpUrl:'https://mailchimp.com/login',
  googleFormUrl:'', yocoUrl:'https://portal.yoco.com',
  whatsappUrl:'https://web.whatsapp.com', googleBizUrl:'https://business.google.com',
  canvaUrl:'https://www.canva.com',
};

const DEFAULT_EXPENSES = [
  {id:'ex1',name:'Wages / Salary',         cat:'Labour',       amount:12000,active:true},
  {id:'ex2',name:'Site rental / pitch fee',cat:'Rent',         amount:3500, active:true},
  {id:'ex3',name:'Wi-Fi / data',           cat:'Operations',   amount:999,  active:true},
  {id:'ex4',name:'Trailer payment/rental', cat:'Equipment',    amount:2500, active:true},
  {id:'ex5',name:'Insurance',              cat:'Operations',   amount:800,  active:true},
  {id:'ex6',name:'Gas / LPG',              cat:'Operations',   amount:1120, active:true},
  {id:'ex7',name:'Cleaning supplies',      cat:'Operations',   amount:350,  active:true},
  {id:'ex8',name:'Packaging (top-up)',     cat:'Cost of Sales',amount:800,  active:true},
  {id:'ex9',name:'Maintenance / repairs',  cat:'Equipment',    amount:500,  active:false},
];

const INGREDIENT_DEFAULTS = [
  {id:'i1', name:'Coffee beans',    cat:'Coffee',    unit:'g',    costPer:0.45,  stock:500,  minStock:200, expiryDays:30 },
  {id:'i2', name:'Full cream milk', cat:'Dairy',     unit:'ml',   costPer:0.024, stock:8000, minStock:2000,expiryDays:5  },
  {id:'i3', name:'Low fat milk',    cat:'Dairy',     unit:'ml',   costPer:0.022, stock:4000, minStock:1000,expiryDays:5  },
  {id:'i4', name:'Oat milk',        cat:'Dairy alt', unit:'ml',   costPer:0.038, stock:2000, minStock:500, expiryDays:5  },
  {id:'i5', name:'Choc powder',     cat:'Dry goods', unit:'g',    costPer:0.18,  stock:200,  minStock:50,  expiryDays:180},
  {id:'i6', name:'Vanilla syrup',   cat:'Syrups',    unit:'ml',   costPer:0.16,  stock:300,  minStock:100, expiryDays:180},
  {id:'i7', name:'Caramel syrup',   cat:'Syrups',    unit:'ml',   costPer:0.16,  stock:300,  minStock:100, expiryDays:180},
  {id:'i8', name:'Hazelnut syrup',  cat:'Syrups',    unit:'ml',   costPer:0.16,  stock:200,  minStock:100, expiryDays:180},
  {id:'i9', name:'White sugar',     cat:'Dry goods', unit:'g',    costPer:0.03,  stock:500,  minStock:100, expiryDays:365},
  {id:'i10',name:'Cup 8oz',         cat:'Packaging', unit:'each', costPer:1.80,  stock:100,  minStock:40,  expiryDays:0  },
  {id:'i11',name:'Cup 12oz',        cat:'Packaging', unit:'each', costPer:2.20,  stock:100,  minStock:40,  expiryDays:0  },
  {id:'i12',name:'Cup 16oz',        cat:'Packaging', unit:'each', costPer:2.60,  stock:80,   minStock:30,  expiryDays:0  },
  {id:'i13',name:'Lids',            cat:'Packaging', unit:'each', costPer:0.60,  stock:250,  minStock:80,  expiryDays:0  },
  {id:'i14',name:'Cup sleeves',     cat:'Packaging', unit:'each', costPer:0.40,  stock:250,  minStock:80,  expiryDays:0  },
];

const MENU_DEFAULTS = [
  {id:'m1',name:'Espresso',cat:'Espresso',active:true,
   sizes:[{sz:'S',label:'Single',price:25},{sz:'M',label:'Double',price:32}],
   ingredients:[{ingId:'i1',amtS:9,amtM:18,amtL:0},{ingId:'i10',amtS:1,amtM:1,amtL:0},{ingId:'i13',amtS:1,amtM:1,amtL:0}]},
  {id:'m2',name:'Americano',cat:'Espresso',active:true,
   sizes:[{sz:'S',label:'Small',price:30},{sz:'M',label:'Medium',price:35},{sz:'L',label:'Large',price:40}],
   ingredients:[{ingId:'i1',amtS:18,amtM:21,amtL:21},{ingId:'i10',amtS:1,amtM:0,amtL:0},{ingId:'i11',amtS:0,amtM:1,amtL:0},{ingId:'i12',amtS:0,amtM:0,amtL:1},{ingId:'i13',amtS:1,amtM:1,amtL:1},{ingId:'i14',amtS:0,amtM:1,amtL:1}]},
  {id:'m3',name:'Cappuccino',cat:'Milk-based',active:true,
   sizes:[{sz:'S',label:'Small (8oz)',price:35},{sz:'M',label:'Medium (12oz)',price:40},{sz:'L',label:'Large (16oz)',price:46}],
   ingredients:[{ingId:'i1',amtS:18,amtM:21,amtL:21},{ingId:'i2',amtS:100,amtM:140,amtL:180},{ingId:'i10',amtS:1,amtM:0,amtL:0},{ingId:'i11',amtS:0,amtM:1,amtL:0},{ingId:'i12',amtS:0,amtM:0,amtL:1},{ingId:'i13',amtS:1,amtM:1,amtL:1},{ingId:'i14',amtS:1,amtM:1,amtL:1}]},
  {id:'m4',name:'Latte',cat:'Milk-based',active:true,
   sizes:[{sz:'S',label:'Small (8oz)',price:36},{sz:'M',label:'Medium (12oz)',price:42},{sz:'L',label:'Large (16oz)',price:48}],
   ingredients:[{ingId:'i1',amtS:18,amtM:21,amtL:21},{ingId:'i2',amtS:150,amtM:200,amtL:250},{ingId:'i10',amtS:1,amtM:0,amtL:0},{ingId:'i11',amtS:0,amtM:1,amtL:0},{ingId:'i12',amtS:0,amtM:0,amtL:1},{ingId:'i13',amtS:1,amtM:1,amtL:1},{ingId:'i14',amtS:1,amtM:1,amtL:1}]},
  {id:'m5',name:'Flat White',cat:'Milk-based',active:true,
   sizes:[{sz:'M',label:'Standard',price:38}],
   ingredients:[{ingId:'i1',amtS:0,amtM:18,amtL:0},{ingId:'i2',amtS:0,amtM:130,amtL:0},{ingId:'i11',amtS:0,amtM:1,amtL:0},{ingId:'i13',amtS:0,amtM:1,amtL:0},{ingId:'i14',amtS:0,amtM:1,amtL:0}]},
  {id:'m6',name:'Mocha',cat:'Speciality',active:true,
   sizes:[{sz:'S',label:'Small (8oz)',price:40},{sz:'M',label:'Medium (12oz)',price:46},{sz:'L',label:'Large (16oz)',price:52}],
   ingredients:[{ingId:'i1',amtS:18,amtM:21,amtL:21},{ingId:'i2',amtS:120,amtM:160,amtL:200},{ingId:'i5',amtS:12,amtM:15,amtL:18},{ingId:'i10',amtS:1,amtM:0,amtL:0},{ingId:'i11',amtS:0,amtM:1,amtL:0},{ingId:'i12',amtS:0,amtM:0,amtL:1},{ingId:'i13',amtS:1,amtM:1,amtL:1},{ingId:'i14',amtS:1,amtM:1,amtL:1}]},
  {id:'m7',name:'Hot Chocolate',cat:'Speciality',active:true,
   sizes:[{sz:'S',label:'Small (8oz)',price:38},{sz:'M',label:'Medium (12oz)',price:44},{sz:'L',label:'Large (16oz)',price:50}],
   ingredients:[{ingId:'i2',amtS:150,amtM:200,amtL:250},{ingId:'i5',amtS:20,amtM:25,amtL:30},{ingId:'i10',amtS:1,amtM:0,amtL:0},{ingId:'i11',amtS:0,amtM:1,amtL:0},{ingId:'i12',amtS:0,amtM:0,amtL:1},{ingId:'i13',amtS:1,amtM:1,amtL:1},{ingId:'i14',amtS:1,amtM:1,amtL:1}]},
  {id:'m8',name:'Cold Brew',cat:'Cold',active:true,
   sizes:[{sz:'M',label:'Regular',price:45},{sz:'L',label:'Large',price:52}],
   ingredients:[{ingId:'i1',amtS:0,amtM:30,amtL:40},{ingId:'i11',amtS:0,amtM:1,amtL:0},{ingId:'i12',amtS:0,amtM:0,amtL:1},{ingId:'i13',amtS:0,amtM:1,amtL:1}]},
];

const STOCK_DEFAULTS = [
  {id:'s1', name:'Coffee beans',       cat:'Coffee',    unit:'g',    reorder:100, count:500, ingredientId:'i1',  convFactor:1   },
  {id:'s2', name:'Full cream milk',    cat:'Dairy',     unit:'L',    reorder:2,   count:8,   ingredientId:'i2',  convFactor:1000},
  {id:'s3', name:'Low fat milk',       cat:'Dairy',     unit:'L',    reorder:1,   count:4,   ingredientId:'i3',  convFactor:1000},
  {id:'s4', name:'Oat milk',           cat:'Dairy alt', unit:'L',    reorder:1,   count:2,   ingredientId:'i4',  convFactor:1000},
  {id:'s5', name:'Chocolate powder',   cat:'Dry goods', unit:'g',    reorder:50,  count:200, ingredientId:'i5',  convFactor:1   },
  {id:'s6', name:'Vanilla syrup',      cat:'Syrups',    unit:'ml',   reorder:100, count:300, ingredientId:'i6',  convFactor:1   },
  {id:'s7', name:'Caramel syrup',      cat:'Syrups',    unit:'ml',   reorder:100, count:300, ingredientId:'i7',  convFactor:1   },
  {id:'s8', name:'Croissants',         cat:'Bakery',    unit:'each', reorder:4,   count:12  },
  {id:'s9', name:'Banana bread',       cat:'Bakery',    unit:'each', reorder:3,   count:10  },
  {id:'s10',name:'Muffins',            cat:'Bakery',    unit:'each', reorder:2,   count:8   },
  {id:'s11',name:'Cups small (8oz)',   cat:'Packaging', unit:'each', reorder:20,  count:100, ingredientId:'i10', convFactor:1   },
  {id:'s12',name:'Cups medium (12oz)', cat:'Packaging', unit:'each', reorder:20,  count:100, ingredientId:'i11', convFactor:1   },
  {id:'s13',name:'Cups large (16oz)',  cat:'Packaging', unit:'each', reorder:20,  count:100, ingredientId:'i12', convFactor:1   },
  {id:'s14',name:'Cup lids',           cat:'Packaging', unit:'each', reorder:40,  count:200, ingredientId:'i13', convFactor:1   },
  {id:'s15',name:'Burger boxes',       cat:'Packaging', unit:'each', reorder:10,  count:50  },
  {id:'s16',name:'Sandwich wrap',      cat:'Packaging', unit:'each', reorder:20,  count:100 },
  {id:'s17',name:'Wooden stirrers',    cat:'Packaging', unit:'each', reorder:50,  count:200 },
  {id:'s18',name:'Paper napkins',      cat:'Packaging', unit:'each', reorder:50,  count:300 },
  {id:'s19',name:'Cold cups (plastic)',cat:'Packaging', unit:'each', reorder:10,  count:50  },
  {id:'s20',name:'Gas (LPG)',          cat:'Energy',    unit:'cyl',  reorder:1,   count:2   },
];

const CHECKLIST_DEFAULTS = {
  opening:[
    {id:'co1',text:'Equipment on & preheated (machine, grinder)'},
    {id:'co2',text:'Milk stock checked & in fridge'},
    {id:'co3',text:'Coffee beans in grinder — fresh'},
    {id:'co4',text:'Cash float counted & correct'},
    {id:'co5',text:'Trailer / space clean & presentable'},
    {id:'co6',text:'Specials board updated'},
    {id:'co7',text:'Wi-Fi connected & POS active'},
  ],
  closing:[
    {id:'cc1',text:'Machine & grinder turned off'},
    {id:'cc2',text:'Milk stored correctly / disposed'},
    {id:'cc3',text:'Counter, steam wand & surfaces wiped'},
    {id:'cc4',text:'Waste taken out'},
    {id:'cc5',text:'Cash counted, float secured'},
    {id:'cc6',text:'Gas valve off'},
    {id:'cc7',text:'Daily log completed in app'},
  ],
};

const SUPPLIER_DEFAULTS = [
  {id:'sup1',name:'Obz Café Roastery',contact:'Andre',phone:'021 447 0001',email:'orders@obzcafe.co.za',products:'Coffee beans',minOrder:'1 kg',leadDays:2,notes:'Preferred roaster — House Blend & Ethiopia'},
  {id:'sup2',name:'Woolworths Food',contact:'—',phone:'0800 022 002',email:'',products:'Milk, oat milk, croissants',minOrder:'Walk-in',leadDays:0,notes:'CMV Business Park Woolies'},
];

const MAINTENANCE_DEFAULTS = [
  {id:'mt1',equipment:'Espresso Machine',type:'Full service',date:'2026-01-15',nextDue:'2026-07-15',notes:'Descale, group head clean, replace gaskets'},
  {id:'mt2',equipment:'Grinder',type:'Calibration & burr clean',date:'2026-03-01',nextDue:'2026-06-01',notes:'Check burr gap, deep clean'},
  {id:'mt3',equipment:'Gas regulator',type:'Safety check',date:'2026-05-01',nextDue:'2026-08-01',notes:'Leak test, pressure check'},
];

const DEFAULT_USERS = [
  {id:'owner',name:'Owner',pin:'153999',role:'admin',avatar:'☕'},
];

// ═══════════════════════════════════════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════════════════════════════════════

var DB = {
  _get(k,def){ try{const v=localStorage.getItem('apc_'+k);return v?JSON.parse(v):def;}catch(e){return def;} },
  _set(k,v)  { try{localStorage.setItem('apc_'+k,JSON.stringify(v));}catch(e){} },
  customers()      { return this._get('customers',[]); },
  saveCustomers(d) { this._set('customers',d); },
  stock()          { return this._get('stock', JSON.parse(JSON.stringify(STOCK_DEFAULTS))); },
  saveStock(d)     { this._set('stock',d); },
  stockLog()       { return this._get('stockLog',[]); },
  saveStockLog(d)  { this._set('stockLog',d); },
  dailyLog()       { return this._get('dailyLog',[]); },
  saveDailyLog(d)  { this._set('dailyLog',d); },
  settings()       { return Object.assign({},DEFAULT_SETTINGS,this._get('settings',{})); },
  saveSettings(d)  { this._set('settings',d); },
  expenses()       { return this._get('expenses', JSON.parse(JSON.stringify(DEFAULT_EXPENSES))); },
  saveExpenses(d)  { this._set('expenses',d); },
  ingredients()    { return this._get('ingredients', JSON.parse(JSON.stringify(INGREDIENT_DEFAULTS))); },
  saveIngredients(d){ this._set('ingredients',d); },
  menuItems()      { return this._get('menuItems', JSON.parse(JSON.stringify(MENU_DEFAULTS))); },
  saveMenuItems(d) { this._set('menuItems',d); },
  checklistItems() { return this._get('checklistItems', JSON.parse(JSON.stringify(CHECKLIST_DEFAULTS))); },
  saveChecklistItems(d){ this._set('checklistItems',d); },
  checklistLog()   { return this._get('checklistLog',[]); },
  saveChecklistLog(d){ this._set('checklistLog',d); },
  orders()         { return this._get('orders',[]); },
  saveOrders(d)    { this._set('orders',d); },
  suppliers()      { return this._get('suppliers', JSON.parse(JSON.stringify(SUPPLIER_DEFAULTS))); },
  saveSuppliers(d) { this._set('suppliers',d); },
  maintenance()    { return this._get('maintenance', JSON.parse(JSON.stringify(MAINTENANCE_DEFAULTS))); },
  saveMaintenance(d){ this._set('maintenance',d); },
  users()          { return this._get('users', JSON.parse(JSON.stringify(DEFAULT_USERS))); },
  saveUsers(d)     { this._set('users',d); },
};

// ═══════════════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════════════

function uuid()  { return Date.now().toString(36)+Math.random().toString(36).slice(2); }
function R(n)    { return 'R '+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function Rn(n)   { return Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function N(n)    { return Number(n||0).toLocaleString('en-ZA'); }
function pct(n)  { return Number(n||0).toFixed(1)+'%'; }
function todayStr()  { return new Date().toISOString().split('T')[0]; }
function fmtDate(s)  { if(!s) return '—'; const d=new Date(s+'T12:00:00'); return d.toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}); }
function fmtDateShort(s) { if(!s) return '—'; const d=new Date(s+'T12:00:00'); return d.toLocaleDateString('en-ZA',{day:'numeric',month:'short'}); }
function daysSince(s) { if(!s) return 999; return Math.floor((Date.now()-new Date(s+'T12:00:00').getTime())/(1000*60*60*24)); }
function getMonday(d) { const dt=new Date(d); const day=dt.getDay(); const diff=(day===0)?-6:(1-day); dt.setDate(dt.getDate()+diff); return dt.toISOString().split('T')[0]; }
function addDays(s,n) { const d=new Date(s+'T12:00:00'); d.setDate(d.getDate()+n); return d.toISOString().split('T')[0]; }
function weekLabel(monStr) { const mon=new Date(monStr+'T12:00:00'); const fri=new Date(monStr+'T12:00:00'); fri.setDate(fri.getDate()+4); return mon.toLocaleDateString('en-ZA',{day:'numeric',month:'short'})+' – '+fri.toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}); }
function monthName(m) { return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m]; }
function trend(curr,prev) { if(!prev||prev===0) return ''; const d=((curr-prev)/Math.abs(prev)*100).toFixed(1); return d>=0?`<span class="text-green">▲ ${d}%</span>`:`<span class="text-red">▼ ${Math.abs(d)}%</span>`; }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function safeUrl(url) {
  if(!url||url==='#') return '#';
  try { const u=new URL(url); return (u.protocol==='http:'||u.protocol==='https:')?url:'#'; } catch { return '#'; }
}

// Cost helpers
const SZ_KEYS = ['amtS','amtM','amtL','amtXL'];

function getWeeklyExpenses() {
  return DB.expenses().filter(e=>e.active).reduce((a,e)=>a+(e.amount||0),0) / 4.33;
}
function getMonthlyExpensesTotal() {
  return DB.expenses().filter(e=>e.active).reduce((a,e)=>a+(e.amount||0),0);
}
function calcItemCost(item, ingrs, szIdx) {
  if(!item||!item.sizes||!item.sizes[szIdx]) return 0;
  const amtKey = SZ_KEYS[szIdx]||'amtL';
  return (item.ingredients||[]).reduce((total, ri) => {
    const ing = ingrs.find(i=>i.id===ri.ingId);
    return total + (ing ? (ri[amtKey]||0) * ing.costPer : 0);
  }, 0);
}
function calcAvgCostPerCup() {
  const items = DB.menuItems().filter(i=>i.active);
  const ingrs = DB.ingredients();
  if(!items.length) return DB.settings().avgCostPerCup||16;
  let total=0, count=0;
  items.forEach(item=>{
    (item.sizes||[]).forEach((sz,idx)=>{
      total += calcItemCost(item, ingrs, idx);
      count++;
    });
  });
  return count ? total/count : 16;
}

function calcAvgSellPrice() {
  const items=DB.menuItems().filter(i=>i.active);
  if(!items.length) return 40;
  let total=0,count=0;
  items.forEach(item=>(item.sizes||[]).forEach(sz=>{total+=(sz.price||0);count++;}));
  return count?total/count:40;
}
function calcBreakEvenCups() {
  const s=DB.settings();
  const dailyFixed=getWeeklyExpenses()/(s.operatingDays||5);
  const avgSell=calcAvgSellPrice();
  const avgCost=calcAvgCostPerCup();
  const cardFee=(s.yocoFee||2.9)/100;
  const contribution=avgSell*(1-cardFee)-avgCost;
  if(contribution<=0) return Infinity;
  return Math.ceil(dailyFixed/contribution);
}

// Stock alert helpers
function getLowStockItems() {
  return DB.stock().filter(item => {
    const today = todayStr();
    const entry = DB.stockLog().filter(l=>l.date===today&&l.itemId===item.id).pop();
    const closing = entry ? entry.closing : item.count;
    return closing <= item.reorder;
  });
}
function getCriticalStockItems() {
  return DB.stock().filter(item => {
    const today = todayStr();
    const entry = DB.stockLog().filter(l=>l.date===today&&l.itemId===item.id).pop();
    const closing = entry ? entry.closing : item.count;
    return closing <= Math.floor(item.reorder * 0.5);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════

let currentSec   = 'hub';
let crmSearch    = '';
let crmFilter    = 'all';
let pnlOffset    = 0;
let monthYear    = new Date().getFullYear();
let monthMonth   = new Date().getMonth();
let recipesTab   = 'menu';
let settingsTab  = 'business';
let charts       = {};

// ═══════════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════

const TITLES = {
  hub:'Hub', crm:'CRM & Loyalty', recipes:'Recipes & Menu',
  stock:'Stock Take', daily:'Daily Log', pnl:'Weekly P&L',
  monthly:'Monthly', settings:'Settings',
  checklist:'Checklists', orders:'Purchase Log',
  suppliers:'Suppliers', maintenance:'Maintenance',
};

function navigate(sec) {
  currentSec = sec;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.sec===sec));
  document.getElementById('pageTitle').textContent = TITLES[sec]||sec;
  Object.values(charts).forEach(c=>{ try{c.destroy();}catch(e){} });
  charts={};
  renderSection(sec);
  closeSidebar();
}

function renderSection(sec) {
  const fns = {
    hub:renderHub, crm:renderCRM, recipes:renderRecipes, stock:renderStock,
    daily:renderDaily, pnl:renderPnL, monthly:renderMonthly, settings:renderSettings,
    checklist:renderChecklist, orders:renderOrders,
    suppliers:renderSuppliers, maintenance:renderMaintenance,
  };
  const c = document.getElementById('content');
  if(fns[sec]) fns[sec]();
  else c.innerHTML='<p class="text-muted">Coming soon.</p>';
}

// ═══════════════════════════════════════════════════════════════════════
// HUB
// ═══════════════════════════════════════════════════════════════════════

function renderHub() {
  const s    = DB.settings();
  const log  = DB.dailyLog();
  const cust = DB.customers();
  const today = todayStr();
  const todayEntry = log.find(e=>e.date===today);
  const todayCups  = todayEntry?.cups||0;
  const todayRev   = todayEntry?.revenue||0;
  const lowItems   = getLowStockItems();
  const critItems  = getCriticalStockItems();
  const activeCustomers = cust.filter(c=>daysSince(c.lastVisit)<=30).length;
  const mon = getMonday(today);
  const weekEntries = log.filter(e=>e.date>=mon&&e.date<=addDays(mon,6));
  const weekRev  = weekEntries.reduce((a,e)=>a+(e.revenue||0),0);
  const weekCups = weekEntries.reduce((a,e)=>a+(e.cups||0),0);
  const last7 = [];
  for(let i=6;i>=0;i--){ const d=addDays(today,-i); const e=log.find(x=>x.date===d); last7.push({date:fmtDateShort(d),rev:e?.revenue||0,cups:e?.cups||0}); }
  const links = [
    {logo:'https://cdn.simpleicons.org/mailchimp/FFB300',bg:'#fff8e1',label:'Mailchimp',desc:'Email campaigns',url:s.mailchimpUrl},
    {logo:'https://cdn.simpleicons.org/instagram/E4405F',bg:'#fce4ec',label:'Instagram',desc:'Post & engage',url:s.instagramUrl},
    {logo:'https://cdn.simpleicons.org/google/4285F4',bg:'#e8f0fe',label:'Loyalty Form',desc:'Customer sign-up',url:s.googleFormUrl||'#'},
    {logo:'https://cdn.simpleicons.org/whatsapp/25D366',bg:'#e8f5e9',label:'WhatsApp',desc:'Broadcast specials',url:s.whatsappUrl},
    {logo:'https://cdn.simpleicons.org/google/EA4335',bg:'#fce8e6',label:'Google Biz',desc:'Reviews & map',url:s.googleBizUrl},
    {logo:`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='18' fill='%2300C4CC'/%3E%3Ctext x='50' y='68' font-family='Arial' font-size='54' font-weight='900' text-anchor='middle' fill='white'%3EC%3C/text%3E%3C/svg%3E`,bg:'#e0f7fa',label:'Canva',desc:'Design posts',url:s.canvaUrl},
    {logo:'https://cdn.simpleicons.org/gmail/EA4335',bg:'#fce8e6',label:'Gmail',desc:'Customer replies',url:'https://mail.google.com'},
    {logo:`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='18' fill='%2300C853'/%3E%3Ctext x='50' y='68' font-family='Arial' font-size='54' font-weight='900' text-anchor='middle' fill='white'%3EY%3C/text%3E%3C/svg%3E`,bg:'#e8f5e9',label:'Yoco Portal',desc:'Sales & payouts',url:s.yocoUrl},
  ];
  const recentLog = [...log].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const cupProgress = Math.min(100,(todayCups/s.dailyCupTarget)*100);

  const beTarget = calcBreakEvenCups();
  const bePct    = beTarget===Infinity ? 0 : Math.min(100, (todayCups/beTarget)*100);
  const beColor  = todayCups>=beTarget?'green':bePct>=70?'amber':'red';
  const beLeft   = beTarget===Infinity ? '∞' : Math.max(0,beTarget-todayCups);

  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div>
        <div class="sec-title">Good morning ☕</div>
        <div class="sec-sub">${new Date().toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · ${esc(s.slogan||'')}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="shareWhatsApp()">📲 Daily Summary</button>
        <button class="btn btn-primary btn-sm" onclick="enterKiosk()">☕ Kiosk Mode</button>
      </div>
    </div>

    ${lowItems.length ? `
    <div class="stock-alert-banner mb-16">
      <span class="sab-label">⚠ Stock Alert — ${lowItems.length} item${lowItems.length!==1?'s':''} need attention</span>
      <div class="sab-items">
        ${lowItems.slice(0,6).map(i=>`<span class="stock-alert-chip ${critItems.find(c=>c.id===i.id)?'critical':''}">${esc(i.name)}</span>`).join('')}
        ${lowItems.length>6?`<span class="stock-alert-chip">+${lowItems.length-6} more</span>`:''}
      </div>
      <button class="btn btn-sm" style="background:rgba(255,253,229,.15);color:var(--cream);border:1px solid rgba(255,253,229,.25)" onclick="navigate('stock')">View Stock →</button>
    </div>` : ''}

    <div class="kpi-grid">
      <div class="kpi-card dark">
        <div class="kpi-icon">☕</div>
        <div class="kpi-label">Today's Cups</div>
        <div class="kpi-value">${N(todayCups)}</div>
        <div class="progress-wrap">
          <div class="progress-bar-bg"><div class="progress-bar-fill ${cupProgress>=100?'green':''}" style="width:${cupProgress}%"></div></div>
          <div class="progress-label"><span>Target: ${N(s.dailyCupTarget)}</span><span>${cupProgress.toFixed(0)}%</span></div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💰</div>
        <div class="kpi-label">Today's Revenue</div>
        <div class="kpi-value" style="font-size:20px">${R(todayRev)}</div>
        <div class="kpi-sub">From daily log</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon">♡</div>
        <div class="kpi-label">Loyalty Members</div>
        <div class="kpi-value">${N(cust.length)}</div>
        <div class="kpi-sub">${N(activeCustomers)} active this month</div>
      </div>
      <div class="kpi-card ${lowItems.length>0?'red':''}">
        <div class="kpi-icon">◫</div>
        <div class="kpi-label">Stock Alerts</div>
        <div class="kpi-value">${lowItems.length}</div>
        <div class="kpi-sub">${lowItems.length>0?'Items need reordering':'All stock levels OK'}</div>
      </div>
      <div class="kpi-card breakeven">
        <div class="kpi-icon">⚖</div>
        <div class="kpi-label">Break-even today</div>
        <div class="kpi-value">${beTarget===Infinity?'—':N(beTarget)} <span style="font-size:13px;font-weight:400">cups</span></div>
        <div class="progress-wrap">
          <div class="progress-bar-bg"><div class="progress-bar-fill ${beColor}" style="width:${bePct}%"></div></div>
          <div class="progress-label"><span>${todayCups>=beTarget?'✓ Covered':'Need '+N(beLeft)+' more'}</span><span>${bePct.toFixed(0)}%</span></div>
        </div>
      </div>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
      <div class="kpi-card">
        <div class="kpi-label">Week Revenue</div>
        <div class="kpi-value" style="font-size:18px">${R(weekRev)}</div>
        <div class="kpi-sub">vs target ${R(s.weeklyRevenueTarget)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Week Cups</div>
        <div class="kpi-value">${N(weekCups)}</div>
        <div class="kpi-sub">Mon – today</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Avg / Cup</div>
        <div class="kpi-value" style="font-size:18px">${weekCups?R(weekRev/weekCups):'—'}</div>
        <div class="kpi-sub">Revenue per cup this week</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Monthly Expenses</div>
        <div class="kpi-value" style="font-size:18px">${R(getMonthlyExpensesTotal())}</div>
        <div class="kpi-sub">Fixed costs / month</div>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-head"><span class="card-title">Revenue — last 7 days</span></div>
        <div class="card-body"><div class="chart-wrap" style="height:180px"><canvas id="hubChart"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-head">
          <span class="card-title">Recent Entries</span>
          <button class="btn btn-ghost btn-sm" onclick="navigate('daily')">View all →</button>
        </div>
        <div class="card-body np">
          ${recentLog.length ? recentLog.map(e=>`
            <div class="recent-item" style="padding:10px 20px">
              <span class="ri-date">${fmtDateShort(e.date)}</span>
              <span class="ri-cups">☕ ${N(e.cups||0)}</span>
              <span class="ri-rev">${R(e.revenue||0)}</span>
              <span class="ri-notes">${esc(e.notes||'')}</span>
            </div>`).join('')
          : `<div class="empty-state"><div class="es-icon">📋</div><div class="es-text">No entries yet</div></div>`}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><span class="card-title">Quick Links</span></div>
      <div class="card-body">
        <div class="links-grid">
          ${links.map(l=>`
            <a class="link-tile" href="${safeUrl(l.url)}" target="_blank" rel="noopener">
              <div class="link-tile-logo" style="background:${l.bg}"><img src="${l.logo}" alt="${esc(l.label)}" loading="lazy"></div>
              <span style="font-size:12px;font-weight:700">${esc(l.label)}</span>
              <span class="ll">${esc(l.desc)}</span>
            </a>`).join('')}
        </div>
      </div>
    </div>
  `;

  charts.hub = new Chart(document.getElementById('hubChart'), {
    type:'bar',
    data:{ labels:last7.map(d=>d.date), datasets:[{label:'Revenue (R)',data:last7.map(d=>d.rev),backgroundColor:last7.map((_,i)=>i===6?'#001982':'rgba(0,25,130,0.25)'),borderRadius:5}] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false},ticks:{font:{size:11}}}, y:{grid:{color:'#f0f1f8'},ticks:{font:{size:11},callback:v=>'R'+v.toLocaleString('en-ZA')}} } }
  });
}

function shareWhatsApp() {
  const s=DB.settings(), log=DB.dailyLog(), today=todayStr();
  const e=log.find(x=>x.date===today);
  const beTarget=calcBreakEvenCups();
  const cups=e?.cups||0;
  const rev=e?.revenue||0;
  const tips=e?.tips||0;
  const covered=cups>=beTarget;

  // Drink tally summary
  const tallyLines=[];
  if(e?.tally && Object.keys(e.tally).length) {
    const menuItems=DB.menuItems();
    const tallySummary={};
    Object.entries(e.tally).forEach(([key,cnt])=>{
      if(!cnt) return;
      const parts=key.split('_'); const szIdx=parseInt(parts.pop()); const drinkId=parts.join('_');
      const item=menuItems.find(m=>m.id===drinkId);
      if(!item) return;
      const szLabel=item.sizes?.[szIdx]?.label||item.sizes?.[szIdx]?.sz||'';
      const k=item.name+(szLabel?` (${szLabel})`:'');
      tallySummary[k]=(tallySummary[k]||0)+cnt;
    });
    if(Object.keys(tallySummary).length) {
      tallyLines.push('');
      tallyLines.push('*Drinks Made:*');
      Object.entries(tallySummary).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>tallyLines.push(`  ${k}: ${v}`));
    }
  }

  // Stock status
  const stock=DB.stock();
  const outItems=stock.filter(i=>(i.count||0)===0);
  const lowItems=stock.filter(i=>(i.count||0)>0&&i.reorder&&(i.count||0)<=i.reorder);
  const stockLines=[];
  if(outItems.length||lowItems.length) {
    stockLines.push('');
    stockLines.push('*Stock Alerts:*');
    outItems.forEach(i=>stockLines.push(`  🔴 OUT: ${esc(i.name)}`));
    lowItems.forEach(i=>stockLines.push(`  🟡 LOW: ${esc(i.name)} (${i.count} ${i.unit||''})`));
  }

  // Checklist completion today
  const clItems=DB.checklistItems(); const clLog=DB.checklistLog();
  const clLines=[];
  ['opening','closing'].forEach(type=>{
    const items=clItems[type]||[];
    const entry=clLog.find(l=>l.date===today&&l.type===type)||{items:{}};
    const done=items.filter(i=>entry.items[i.id]).length;
    if(items.length) clLines.push(`  ${type==='opening'?'🌅 Opening':'🌙 Closing'}: ${done}/${items.length} ${done===items.length?'✅':'⚠'}`);
  });

  // Actionables for tomorrow
  const actionLines=[];
  const maint=DB.maintenance(); const tomorrow=addDays(today,1);
  const overdueItems=maint.filter(i=>i.nextDue&&i.nextDue<=today);
  if(outItems.length) actionLines.push(`  🛒 Order: ${outItems.map(i=>i.name).join(', ')}`);
  if(overdueItems.length) actionLines.push(`  🔧 Service overdue: ${overdueItems.map(i=>i.equipment).join(', ')}`);
  if(e?.prep) actionLines.push(`  📝 Prep noted: ${e.prep}`);

  const lines=[
    `☕ *${esc(s.businessName)} — End of Day*`,
    `📅 ${new Date().toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long'})}`,
    ``,
    `Cups sold: *${cups}* / target ${s.dailyCupTarget}`,
    `Revenue: *${R(rev)}*${tips?`  |  Tips: ${R(tips)}`:''}`,
    `Break-even: ${covered?`✅ Covered (+${cups-beTarget} cups)`:`⚠ Short by ${beTarget-cups} cups`}`,
    ...tallyLines,
    ...(clLines.length?[``,`*Checklists:*`,...clLines]:[]),
    ...(stockLines.length?stockLines:[``,`Stock: ✅ All levels OK`]),
    ...(actionLines.length?[``,`*For Tomorrow:*`,...actionLines]:[]),
    ``,
    `_not just served, Sent._`,
  ];
  const text=lines.join('\n');
  if(navigator.clipboard) {
    navigator.clipboard.writeText(text).then(()=>toast('Copied — paste into WhatsApp ✓','success'));
  } else {
    const el=document.createElement('textarea');
    el.value=text; document.body.appendChild(el); el.select();
    document.execCommand('copy'); document.body.removeChild(el);
    toast('Copied — paste into WhatsApp ✓','success');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CRM & LOYALTY
// ═══════════════════════════════════════════════════════════════════════

function renderCRM() {
  const customers = DB.customers();
  const s = DB.settings();
  const total=customers.length, active=customers.filter(c=>daysSince(c.lastVisit)<=30).length;
  const freeCoffees=customers.reduce((a,c)=>a+(c.freeCoffees||0),0);
  const savedDrinks=customers.reduce((a,c)=>a+(c.savedDrinks||0),0);

  let filtered = customers.filter(c => {
    const q=crmSearch.toLowerCase();
    const match=!q||c.name?.toLowerCase().includes(q)||c.phone?.includes(q)||c.email?.toLowerCase().includes(q);
    if(!match) return false;
    if(crmFilter==='active')   return daysSince(c.lastVisit)<=30;
    if(crmFilter==='inactive') return daysSince(c.lastVisit)>30;
    if(crmFilter==='ready')    return (c.stamps||0)>=(s.loyaltyFreeAt||10);
    if(crmFilter==='banked')   return (c.savedDrinks||0)>0;
    return true;
  });

  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">CRM & Loyalty</div><div class="sec-sub">Manage customers · track stamps · award free drinks</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="exportCRM()">↓ Export CSV</button>
        <button class="btn btn-primary" onclick="showAddCustomer()">+ Add Customer</button>
      </div>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">
      <div class="kpi-card"><div class="kpi-label">Total Members</div><div class="kpi-value">${total}</div></div>
      <div class="kpi-card green"><div class="kpi-label">Active (≤30d)</div><div class="kpi-value">${active}</div></div>
      <div class="kpi-card red"><div class="kpi-label">Inactive (>30d)</div><div class="kpi-value">${total-active}</div></div>
      <div class="kpi-card"><div class="kpi-label">Ready for Free</div><div class="kpi-value text-green">${customers.filter(c=>(c.stamps||0)>=(s.loyaltyFreeAt||10)).length}</div></div>
      <div class="kpi-card dark"><div class="kpi-label">Banked Drinks</div><div class="kpi-value">${savedDrinks}</div></div>
      <div class="kpi-card"><div class="kpi-label">Free Claimed</div><div class="kpi-value">${freeCoffees}</div></div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="search-bar">
          <input class="search-input" id="crmSearch" placeholder="Search name, phone, email…" value="${esc(crmSearch)}" oninput="crmSearch=this.value;renderCRM()">
          <div class="filter-tabs">
            ${['all','active','inactive','ready','banked'].map(f=>`
              <button class="filter-tab ${crmFilter===f?'active':''}" onclick="crmFilter='${f}';renderCRM()">
                ${f==='all'?'All':f==='ready'?'🎉 Ready':f==='banked'?'☕ Banked':f.charAt(0).toUpperCase()+f.slice(1)}
              </button>`).join('')}
          </div>
        </div>
      </div>
      <div class="card-body np">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Last Visit</th><th>Visits</th><th>Stamps</th><th>Banked</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${filtered.length ? filtered.map((c,i)=>{
                const stamps=c.stamps||0, ready=stamps>=(s.loyaltyFreeAt||10), inactive=daysSince(c.lastVisit)>30;
                return `<tr class="${i%2===0?'even':''}" style="cursor:pointer" onclick="showCustomer('${c.id}')">
                  <td><strong>${esc(c.name||'—')}</strong><div style="font-size:11px;color:var(--muted)">${esc(c.email||'')}</div></td>
                  <td>${esc(c.phone||'—')}</td>
                  <td>${fmtDateShort(c.lastVisit)}</td>
                  <td class="text-center">${c.visits||0}</td>
                  <td><span class="stamps ${ready?'full':''}">☕ ${stamps}/${s.loyaltyFreeAt||10}${ready?' 🎉':''}</span></td>
                  <td class="text-center">${(c.savedDrinks||0)>0?`<span class="badge badge-navy">☕ ×${c.savedDrinks}</span>`:'—'}</td>
                  <td>${daysSince(c.lastVisit)>60?'<span class="badge badge-red">Inactive</span>':daysSince(c.lastVisit)>44?'<span class="badge badge-winback">Win-back</span>':inactive?'<span class="badge badge-red">Inactive</span>':'<span class="badge badge-green">Active</span>'}</td>
                  <td onclick="event.stopPropagation()">
                    <button class="btn btn-primary btn-xs" onclick="addStamp('${c.id}',1)">+1</button>
                    <button class="btn btn-ghost btn-xs" onclick="showCustomer('${c.id}')">View</button>
                  </td>
                </tr>`;
              }).join('') : `<tr><td colspan="8"><div class="empty-state"><div class="es-icon">👥</div><div class="es-text">No customers found</div></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="info-note">
      💡 <strong>Loyalty:</strong> Each visit → click <strong>+1</strong>. At ${s.loyaltyFreeAt||10} stamps the card turns navy 🎉 — open their profile to award or bank the drink.
      <strong>Banking</strong> lets customers save earned free drinks for later — great for regulars!
    </div>
  `;
  if(crmSearch) document.getElementById('crmSearch')?.focus();
}

function showAddCustomer() {
  openModal(`
    <div class="modal-head"><h2>Add New Customer</h2><p>Loyalty sign-up</p></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field"><label>First Name *</label><input id="f-name" placeholder="e.g. Luhan"></div>
        <div class="field"><label>Cell Number *</label><input id="f-phone" placeholder="+27 81 234 5678" type="tel"></div>
        <div class="field span2"><label>Email Address</label><input id="f-email" placeholder="customer@email.com" type="email"></div>
        <div class="field"><label>How did they find you?</label>
          <select id="f-found"><option>Walk-by</option><option>Referred by someone</option><option>Instagram</option><option>Facebook</option><option>WhatsApp</option><option>Google Maps</option><option>Other</option></select>
        </div>
        <div class="field"><label>Birthday (optional)</label><input id="f-bday" type="date"></div>
        <div class="field"><label>Notes</label><input id="f-notes" placeholder="Regular? Preference?"></div>
        <div class="field span2">
          <label>Opt-ins</label>
          <div style="display:flex;gap:16px;margin-top:6px">
            <label class="toggle-wrap"><input type="checkbox" id="f-sms" checked> SMS specials</label>
            <label class="toggle-wrap"><input type="checkbox" id="f-email-opt" checked> Email newsletter</label>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewCustomer()">Save Customer</button>
    </div>
  `);
}

function saveNewCustomer() {
  const name=document.getElementById('f-name')?.value?.trim();
  const phone=document.getElementById('f-phone')?.value?.trim();
  if(!name||!phone){ toast('Name and phone are required','error'); return; }
  const c = { id:uuid(), name, phone,
    email:document.getElementById('f-email')?.value?.trim()||'',
    found:document.getElementById('f-found')?.value||'',
    birthday:document.getElementById('f-bday')?.value||'',
    notes:document.getElementById('f-notes')?.value?.trim()||'',
    smsOptIn:document.getElementById('f-sms')?.checked||false,
    emailOptIn:document.getElementById('f-email-opt')?.checked||false,
    dateJoined:todayStr(), lastVisit:todayStr(), visits:1, stamps:0, freeCoffees:0, savedDrinks:0 };
  const list=DB.customers(); list.push(c); DB.saveCustomers(list);
  closeModal(); toast(`${name} added to loyalty programme ☕`,'success'); renderCRM();
}

function addStamp(id, amount) {
  amount = parseInt(amount)||1;
  const list=DB.customers(); const c=list.find(x=>x.id===id); if(!c) return;
  const s=DB.settings();
  c.stamps=(c.stamps||0)+amount;
  c.visits=(c.visits||0)+(amount>0?1:0);
  c.lastVisit=todayStr();
  DB.saveCustomers(list);
  if(c.stamps>=(s.loyaltyFreeAt||10)){
    toast(`🎉 ${c.name} earned a FREE drink! Open their profile to award or bank it.`,'success');
  } else {
    toast(`${amount>0?'+':''}${amount} stamp${Math.abs(amount)!==1?'s':''} for ${c.name} — ${c.stamps}/${s.loyaltyFreeAt||10}`);
  }
  renderCRM();
}

function showCustomer(id) {
  const list=DB.customers(); const c=list.find(x=>x.id===id); if(!c) return;
  const s=DB.settings(); const stamps=c.stamps||0; const freeAt=s.loyaltyFreeAt||10;
  const ready=stamps>=freeAt; const saved=c.savedDrinks||0;
  const dots=Array.from({length:freeAt},(_,i)=>`<div class="stamp-dot ${i<stamps?'filled':''}">☕</div>`).join('');

  openModal(`
    <div class="cust-detail-header">
      <div class="cust-detail-name">${esc(c.name)}</div>
      <div class="cust-detail-sub">${esc(c.phone)} ${c.email?'· '+esc(c.email):''}</div>
      <div class="cust-detail-stats">
        <div class="cust-stat"><div class="cust-stat-val">${c.visits||0}</div><div class="cust-stat-lab">Visits</div></div>
        <div class="cust-stat"><div class="cust-stat-val">${stamps}</div><div class="cust-stat-lab">Stamps</div></div>
        <div class="cust-stat"><div class="cust-stat-val">${c.freeCoffees||0}</div><div class="cust-stat-lab">Claimed</div></div>
      </div>
    </div>
    <div class="modal-content">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <span class="card-title">Loyalty Card — ${stamps}/${freeAt}</span>
        ${saved>0?`<span class="saved-drinks-badge">☕ ${saved} banked drink${saved!==1?'s':''}</span>`:''}
      </div>
      <div class="stamp-track">${dots}</div>
      ${ready?`<div class="badge badge-navy" style="font-size:13px;padding:8px 14px;margin-bottom:12px;display:inline-block">🎉 FREE DRINK READY!</div>`:''}

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:6px">
          <input type="number" id="stamp-amt" value="1" min="1" max="20" style="width:55px;padding:6px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px;text-align:center">
          <button class="btn btn-primary btn-sm" onclick="addStampCustom('${id}')">+ Add Stamps</button>
          <button class="btn btn-ghost btn-sm" onclick="subtractStampCustom('${id}')">− Remove</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${ready?`<button class="btn btn-green btn-sm" onclick="awardFree('${id}')">🎉 Use Now & Reset</button>
                 <button class="btn btn-primary btn-sm" onclick="bankDrink('${id}')">☕ Bank for Later</button>`:''}
        ${saved>0?`<button class="btn btn-cream btn-sm" onclick="useSavedDrink('${id}')">Redeem 1 Banked (${saved} left)</button>`:''}
        <button class="btn btn-ghost btn-sm" onclick="editCustomer('${id}')">Edit Details</button>
        <button class="btn btn-red btn-xs" onclick="deleteCustomer('${id}')">Delete</button>
      </div>
      <hr class="divider">
      <div class="form-grid three" style="margin-top:4px">
        <div><div class="kpi-label">Joined</div><div style="font-size:13px;margin-top:2px">${fmtDate(c.dateJoined)}</div></div>
        <div><div class="kpi-label">Last visit</div><div style="font-size:13px;margin-top:2px">${fmtDate(c.lastVisit)}</div></div>
        <div><div class="kpi-label">Days since</div><div style="font-size:13px;margin-top:2px">${daysSince(c.lastVisit)} days</div></div>
      </div>
      ${c.notes?`<div class="info-note mt-16">📝 ${esc(c.notes)}</div>`:''}
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        ${c.smsOptIn?'<span class="badge badge-green">✓ SMS</span>':'<span class="badge badge-gray">✗ No SMS</span>'}
        ${c.emailOptIn?'<span class="badge badge-blue">✓ Email</span>':'<span class="badge badge-gray">✗ No email</span>'}
        ${c.found?`<span class="badge badge-cream">Found via: ${esc(c.found)}</span>`:''}
        ${c.birthday?`<span class="badge badge-cream">🎂 ${fmtDate(c.birthday)}</span>`:''}
      </div>
      ${(()=>{
        const avgSell=calcAvgSellPrice();
        const ltv=((c.visits||0)*avgSell).toFixed(2);
        return `<div class="info-note mt-16" style="margin-top:12px">
          💰 <strong>Est. Lifetime Value: ${R(ltv)}</strong> · ${c.visits||0} visits × avg ${R(avgSell)}/cup
        </div>`;
      })()}
    </div>
  `);
}

function addStampCustom(id) {
  const amt=parseInt(document.getElementById('stamp-amt')?.value)||1;
  const list=DB.customers(); const c=list.find(x=>x.id===id); if(!c) return;
  const s=DB.settings();
  c.stamps=(c.stamps||0)+amt; c.visits=(c.visits||0)+1; c.lastVisit=todayStr();
  DB.saveCustomers(list); closeModal();
  if(c.stamps>=(s.loyaltyFreeAt||10)) toast(`🎉 ${c.name} earned a free drink!`,'success');
  else toast(`+${amt} stamp${amt!==1?'s':''} → ${c.name} now has ${c.stamps}/${s.loyaltyFreeAt||10}`,'success');
  renderCRM();
}

function subtractStampCustom(id) {
  const amt=parseInt(document.getElementById('stamp-amt')?.value)||1;
  const list=DB.customers(); const c=list.find(x=>x.id===id); if(!c) return;
  c.stamps=Math.max(0,(c.stamps||0)-amt);
  DB.saveCustomers(list); closeModal();
  toast(`Removed ${amt} stamp${amt!==1?'s':''} — ${c.name} now has ${c.stamps} stamps`);
  renderCRM();
}

function awardFree(id) {
  const list=DB.customers(); const c=list.find(x=>x.id===id); if(!c) return;
  c.freeCoffees=(c.freeCoffees||0)+1; c.stamps=0;
  DB.saveCustomers(list); closeModal(); toast(`Free drink used for ${c.name}! Stamps reset.`,'success'); renderCRM();
}

function bankDrink(id) {
  const list=DB.customers(); const c=list.find(x=>x.id===id); if(!c) return;
  const s=DB.settings();
  if((c.stamps||0)<(s.loyaltyFreeAt||10)){ toast('Not enough stamps yet','error'); return; }
  c.savedDrinks=(c.savedDrinks||0)+1; c.stamps=0;
  DB.saveCustomers(list); closeModal(); toast(`Drink banked for ${c.name}! They can redeem it any time ☕`,'success'); renderCRM();
}

function useSavedDrink(id) {
  const list=DB.customers(); const c=list.find(x=>x.id===id); if(!c) return;
  if((c.savedDrinks||0)<=0){ toast('No banked drinks','error'); return; }
  c.savedDrinks=(c.savedDrinks||0)-1; c.freeCoffees=(c.freeCoffees||0)+1;
  DB.saveCustomers(list); closeModal(); toast(`Banked drink redeemed for ${c.name}!`,'success'); renderCRM();
}

function editCustomer(id) {
  const list=DB.customers(); const c=list.find(x=>x.id===id); if(!c) return;
  closeModal();
  openModal(`
    <div class="modal-head"><h2>Edit Customer</h2><p>${esc(c.name)}</p></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field"><label>Name</label><input id="ef-name" value="${esc(c.name||'')}"></div>
        <div class="field"><label>Phone</label><input id="ef-phone" value="${esc(c.phone||'')}"></div>
        <div class="field span2"><label>Email</label><input id="ef-email" value="${esc(c.email||'')}"></div>
        <div class="field"><label>Birthday</label><input id="ef-bday" type="date" value="${esc(c.birthday||'')}"></div>
        <div class="field"><label>Notes</label><input id="ef-notes" value="${esc(c.notes||'')}"></div>
        <div class="field">
          <label>Opt-ins</label>
          <div style="display:flex;gap:16px;margin-top:6px">
            <label class="toggle-wrap"><input type="checkbox" id="ef-sms" ${c.smsOptIn?'checked':''}> SMS</label>
            <label class="toggle-wrap"><input type="checkbox" id="ef-email-opt" ${c.emailOptIn?'checked':''}> Email</label>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditCustomer('${id}')">Save Changes</button>
    </div>
  `);
}

function saveEditCustomer(id) {
  const list=DB.customers(); const c=list.find(x=>x.id===id); if(!c) return;
  c.name=document.getElementById('ef-name')?.value?.trim()||c.name;
  c.phone=document.getElementById('ef-phone')?.value?.trim()||c.phone;
  c.email=document.getElementById('ef-email')?.value?.trim()||'';
  c.birthday=document.getElementById('ef-bday')?.value||'';
  c.notes=document.getElementById('ef-notes')?.value?.trim()||'';
  c.smsOptIn=document.getElementById('ef-sms')?.checked||false;
  c.emailOptIn=document.getElementById('ef-email-opt')?.checked||false;
  DB.saveCustomers(list); closeModal(); toast('Customer updated','success'); renderCRM();
}

function deleteCustomer(id) {
  if(!confirm('Remove this customer?')) return;
  DB.saveCustomers(DB.customers().filter(c=>c.id!==id));
  closeModal(); toast('Customer removed','success'); renderCRM();
}

function exportCRM() {
  const list=DB.customers();
  if(!list.length){ toast('No customers to export','error'); return; }
  const headers=['Name','Phone','Email','Joined','Last Visit','Visits','Stamps','Banked Drinks','Free Claimed','SMS','Email','Found','Notes'];
  const rows=list.map(c=>[c.name,c.phone,c.email,c.dateJoined,c.lastVisit,c.visits||0,c.stamps||0,c.savedDrinks||0,c.freeCoffees||0,c.smsOptIn?'Yes':'No',c.emailOptIn?'Yes':'No',c.found,c.notes].map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(','));
  const csv=[headers.join(','),...rows].join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download='Apostello_CRM_'+todayStr()+'.csv'; a.click(); toast('CRM exported');
}

// ═══════════════════════════════════════════════════════════════════════
// RECIPES & MENU
// ═══════════════════════════════════════════════════════════════════════

function renderRecipes() {
  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Recipes & Menu</div><div class="sec-sub">Manage drinks, recipes, ingredient costs — auto-calculates margins</div></div>
      <div style="display:flex;gap:8px">
        ${recipesTab==='menu'
          ?`<button class="btn btn-primary" onclick="showAddMenuItemModal()">+ Add Drink</button>`
          :`<button class="btn btn-primary" onclick="showAddIngredientModal()">+ Add Ingredient</button>`}
      </div>
    </div>
    <div class="filter-tabs mb-16" style="margin-bottom:18px">
      <button class="filter-tab ${recipesTab==='menu'?'active':''}" onclick="recipesTab='menu';renderRecipes()">☕ Menu Items</button>
      <button class="filter-tab ${recipesTab==='ingredients'?'active':''}" onclick="recipesTab='ingredients';renderRecipes()">◈ Ingredients</button>
    </div>
    <div id="recipesContent"></div>
  `;
  if(recipesTab==='menu') renderMenuTab();
  else renderIngredientsTab();
}

function renderMenuTab() {
  const items = DB.menuItems();
  const ingrs = DB.ingredients();
  const cats  = [...new Set(items.map(i=>i.cat))];

  const html = cats.map(cat => {
    const catItems = items.filter(i=>i.cat===cat);
    return `
      <div style="margin-bottom:24px">
        <div class="settings-group-title">${esc(cat)}</div>
        <div class="menu-grid">
          ${catItems.map(item => {
            const avgCost = item.sizes.reduce((a,_,idx)=>a+calcItemCost(item,ingrs,idx),0)/Math.max(1,item.sizes.length);
            const avgPrice = item.sizes.reduce((a,sz)=>a+(sz.price||0),0)/Math.max(1,item.sizes.length);
            const margin = avgPrice>0?((avgPrice-avgCost)/avgPrice*100):0;
            return `
              <div class="menu-card ${item.active?'':'inactive'}" onclick="showEditMenuItemModal('${item.id}')">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                  <div>
                    <div class="menu-card-name">${esc(item.name)}</div>
                    <div class="menu-card-cat">${esc(item.cat)}</div>
                  </div>
                  <span class="badge ${item.active?'badge-green':'badge-gray'}">${item.active?'Active':'Off'}</span>
                </div>
                <div class="menu-card-prices">
                  ${item.sizes.map((sz,idx)=>{
                    const cost=calcItemCost(item,ingrs,idx);
                    return `<div class="price-pill"><span class="pp-sz">${esc(sz.sz)} </span>${R(sz.price)}</div>`;
                  }).join('')}
                </div>
                <div class="menu-card-cost">
                  Cost: ${R(avgCost)} avg · Margin: <span class="${margin>=60?'margin-good':margin>=40?'margin-ok':'margin-bad'}">${pct(margin)}</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');

  document.getElementById('recipesContent').innerHTML = html ||
    `<div class="empty-state"><div class="es-icon">☕</div><div class="es-text">No menu items yet — add your first drink</div></div>`;
}

function renderIngredientsTab() {
  const ingrs = DB.ingredients();
  const cats  = [...new Set(ingrs.map(i=>i.cat))];

  document.getElementById('recipesContent').innerHTML = `
    <div class="card">
      <div class="card-body np">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Ingredient</th><th>Category</th><th>Unit</th><th>Cost / Unit</th><th>Current Stock</th><th>Min Stock</th><th>Expiry Days</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${ingrs.map((ing,i)=>{
                const pct_left = ing.minStock>0?(ing.stock/ing.minStock*100):100;
                const status = ing.stock<=ing.minStock
                  ?'<span class="alert-pill">⚠ Low</span>'
                  :ing.stock<=ing.minStock*1.5
                  ?'<span class="warn-pill">↓ Watch</span>'
                  :'<span class="ok-pill">✓ OK</span>';
                return `<tr class="${i%2===0?'even':''}">
                  <td><strong>${esc(ing.name)}</strong></td>
                  <td>${esc(ing.cat)}</td>
                  <td>${esc(ing.unit)}</td>
                  <td class="fw-bold">R ${Rn(ing.costPer)} /${ing.unit}</td>
                  <td>${N(ing.stock)} ${esc(ing.unit)}</td>
                  <td class="text-muted">${N(ing.minStock)} ${esc(ing.unit)}</td>
                  <td class="text-muted">${ing.expiryDays>0?ing.expiryDays+'d':'—'}</td>
                  <td>${status}</td>
                  <td>
                    <button class="btn btn-ghost btn-xs" onclick="showEditIngredientModal('${ing.id}')">Edit</button>
                    <button class="btn btn-red btn-xs" onclick="deleteIngredient('${ing.id}')">✕</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="info-note">
      💡 Update <strong>Current Stock</strong> regularly (or let the Stock Take section track it). Set <strong>Min Stock</strong> to trigger low-stock alerts on the Hub dashboard.
    </div>
  `;
}

function showAddMenuItemModal() {
  openModal(`
    <div class="modal-head"><h2>Add New Drink</h2><p>Set up sizes, prices and recipe</p></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field"><label>Drink Name *</label><input id="mi-name" placeholder="e.g. Cortado"></div>
        <div class="field"><label>Category</label>
          <select id="mi-cat">
            <option>Espresso</option><option>Milk-based</option><option>Speciality</option><option>Cold</option><option>Food</option><option>Other</option>
          </select>
        </div>
        <div class="field">
          <label>Active on Menu</label>
          <div style="margin-top:8px"><label class="toggle-wrap"><input type="checkbox" id="mi-active" checked> Show on menu</label></div>
        </div>
      </div>
      <hr class="divider">
      <div class="card-title mb-8" style="margin-bottom:8px">Sizes & Prices</div>
      <div id="mi-sizes-list">
        <div class="size-row"><input placeholder="Size label e.g. Small (8oz)" style="flex:2;padding:7px 10px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px" class="sz-label"><input type="number" placeholder="Price (R)" style="width:110px;padding:7px 10px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px" class="sz-price"><button class="btn btn-red btn-xs" onclick="this.parentElement.remove()">✕</button></div>
      </div>
      <button class="btn btn-ghost btn-sm mt-8" style="margin-top:8px" onclick="addSizeRow()">+ Add Size</button>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewMenuItem()">Save Drink</button>
    </div>
  `);
}

function addSizeRow() {
  const list = document.getElementById('mi-sizes-list');
  if(!list) return;
  const row = document.createElement('div');
  row.className='size-row';
  row.innerHTML=`<input placeholder="Size label e.g. Large (16oz)" style="flex:2;padding:7px 10px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px" class="sz-label"><input type="number" placeholder="Price (R)" style="width:110px;padding:7px 10px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px" class="sz-price"><button class="btn btn-red btn-xs" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
}

function saveNewMenuItem() {
  const name=document.getElementById('mi-name')?.value?.trim();
  if(!name){ toast('Drink name required','error'); return; }
  const sizeRows=[...document.querySelectorAll('#mi-sizes-list .size-row')];
  const sizes=sizeRows.map((row,i)=>({
    sz:['S','M','L','XL'][i]||'M',
    label:row.querySelector('.sz-label')?.value?.trim()||'Regular',
    price:parseFloat(row.querySelector('.sz-price')?.value)||0
  })).filter(s=>s.label);
  if(!sizes.length){ toast('Add at least one size','error'); return; }
  const item={id:uuid(),name,cat:document.getElementById('mi-cat')?.value||'Other',
    active:document.getElementById('mi-active')?.checked!==false,sizes,ingredients:[]};
  const list=DB.menuItems(); list.push(item); DB.saveMenuItems(list);
  closeModal(); toast(`${name} added to menu ✓`,'success'); renderRecipes();
}

function showEditMenuItemModal(id) {
  const items=DB.menuItems(); const item=items.find(x=>x.id===id); if(!item) return;
  const ingrs=DB.ingredients();
  const szLabels=['S','M','L','XL'];

  const recipeRows = ingrs.map(ing=>{
    const ri=item.ingredients?.find(r=>r.ingId===ing.id)||{ingId:ing.id,amtS:0,amtM:0,amtL:0,amtXL:0};
    const costs=item.sizes.map((_,idx)=>calcItemCost({...item,ingredients:[ri]},ingrs,idx));
    return `
      <tr>
        <td>${esc(ing.name)} <small class="text-muted">(${esc(ing.unit)})</small></td>
        ${item.sizes.map((_,idx)=>{
          const amtKey=SZ_KEYS[idx]||'amtL';
          return `<td><input type="number" min="0" step="0.1" class="recipe-input" id="ri-${ing.id}-${idx}" value="${ri[amtKey]||0}"></td>`;
        }).join('')}
        <td class="cost-display" id="ri-cost-${ing.id}"></td>
      </tr>`;
  }).join('');

  const totalRow=`<tr style="background:var(--cream)"><td><strong>TOTAL COST</strong></td>${item.sizes.map((_,idx)=>`<td id="total-cost-${idx}" class="fw-bold"></td>`).join('')}<td></td></tr>`;
  const marginRow=`<tr><td><strong>PRICE / MARGIN</strong></td>${item.sizes.map((sz,idx)=>`<td><div class="fw-bold">${R(sz.price)}</div><div id="margin-${idx}" class="margin-display"></div></td>`).join('')}<td></td></tr>`;

  openModal(`
    <div class="modal-head">
      <h2>Edit: ${esc(item.name)}</h2>
      <p>Adjust sizes, prices and recipe ingredients</p>
    </div>
    <div class="modal-content">
      <div class="form-grid three">
        <div class="field"><label>Drink Name</label><input id="emi-name" value="${esc(item.name)}"></div>
        <div class="field"><label>Category</label>
          <select id="emi-cat">
            ${['Espresso','Milk-based','Speciality','Cold','Food','Other'].map(c=>`<option ${item.cat===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Status</label>
          <div style="margin-top:8px"><label class="toggle-wrap"><input type="checkbox" id="emi-active" ${item.active?'checked':''}> Active on menu</label></div>
        </div>
      </div>

      <hr class="divider">
      <div class="card-title mb-8" style="margin-bottom:8px">Sizes & Prices</div>
      <div id="emi-sizes-list">
        ${item.sizes.map((sz,i)=>`
          <div class="size-row">
            <input class="sz-label" value="${esc(sz.label)}" style="flex:2;padding:7px 10px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px" placeholder="Size label">
            <input type="number" class="sz-price" value="${sz.price}" style="width:110px;padding:7px 10px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px" placeholder="Price (R)" oninput="updateRecipeCosts('${id}')">
            <button class="btn btn-red btn-xs" onclick="this.parentElement.remove();updateRecipeCosts('${id}')">✕</button>
          </div>`).join('')}
      </div>
      <button class="btn btn-ghost btn-sm mt-8" style="margin-top:8px" onclick="addSizeRowEdit()">+ Add Size</button>

      <hr class="divider">
      <div class="card-title mb-8" style="margin-bottom:8px">Recipe (amounts per serving)</div>
      <div class="table-wrap">
        <table class="recipe-table">
          <thead><tr><th>Ingredient</th>${item.sizes.map((sz,i)=>`<th>${esc(sz.label||szLabels[i]||'Sz '+(i+1))}</th>`).join('')}<th>Cost</th></tr></thead>
          <tbody id="recipe-tbody">
            ${recipeRows}
            ${totalRow}
            ${marginRow}
          </tbody>
        </table>
      </div>
      <div id="recipe-ingr-add" style="margin-top:12px">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="new-ingr-select" style="padding:7px 12px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px">
            ${ingrs.map(i=>`<option value="${i.id}">${esc(i.name)} (${esc(i.unit)})</option>`).join('')}
          </select>
          <button class="btn btn-ghost btn-sm" onclick="addIngredientToRecipe('${id}')">+ Add to Recipe</button>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-red btn-sm" onclick="deleteMenuItem('${id}')">Delete Drink</button>
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditMenuItem('${id}')">Save Changes</button>
    </div>
  `,'wide');

  setTimeout(()=>updateRecipeCosts(id),50);
}

function addSizeRowEdit() {
  const list=document.getElementById('emi-sizes-list'); if(!list) return;
  const row=document.createElement('div'); row.className='size-row';
  row.innerHTML=`<input class="sz-label" placeholder="Size label" style="flex:2;padding:7px 10px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px"><input type="number" class="sz-price" placeholder="Price (R)" style="width:110px;padding:7px 10px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:13px"><button class="btn btn-red btn-xs" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
}

function addIngredientToRecipe(itemId) {
  const ingId=document.getElementById('new-ingr-select')?.value; if(!ingId) return;
  const ingrs=DB.ingredients(); const ing=ingrs.find(i=>i.id===ingId); if(!ing) return;
  const items=DB.menuItems(); const item=items.find(x=>x.id===itemId); if(!item) return;
  if(item.ingredients?.find(r=>r.ingId===ingId)){ toast('Ingredient already in recipe','error'); return; }
  const tbody=document.getElementById('recipe-tbody'); if(!tbody) return;
  const row=document.createElement('tr');
  row.innerHTML=`
    <td>${esc(ing.name)} <small class="text-muted">(${esc(ing.unit)})</small></td>
    ${item.sizes.map((_,idx)=>`<td><input type="number" min="0" step="0.1" class="recipe-input" id="ri-${ingId}-${idx}" value="0" oninput="updateRecipeCosts('${itemId}')"></td>`).join('')}
    <td class="cost-display" id="ri-cost-${ingId}"></td>`;
  const totalRow=tbody.querySelector('tr:nth-last-child(2)');
  tbody.insertBefore(row,totalRow);
  updateRecipeCosts(itemId);
}

function updateRecipeCosts(itemId) {
  const items=DB.menuItems(); const item=items.find(x=>x.id===itemId); if(!item) return;
  const ingrs=DB.ingredients();
  const prices=[...document.querySelectorAll('#emi-sizes-list .sz-price')].map(i=>parseFloat(i.value)||0);
  const szCount=prices.length||item.sizes.length;
  const totals=new Array(szCount).fill(0);

  ingrs.forEach(ing=>{
    let ingTotal=0;
    for(let idx=0;idx<szCount;idx++){
      const el=document.getElementById(`ri-${ing.id}-${idx}`);
      if(!el) continue;
      const amt=parseFloat(el.value)||0;
      const cost=amt*ing.costPer;
      totals[idx]+=cost; ingTotal+=cost;
    }
    const costEl=document.getElementById(`ri-cost-${ing.id}`);
    if(costEl) costEl.textContent=ingTotal>0?`R ${Rn(ingTotal)}`:'—';
  });

  for(let idx=0;idx<szCount;idx++){
    const el=document.getElementById(`total-cost-${idx}`);
    if(el) el.textContent=R(totals[idx]);
    const mEl=document.getElementById(`margin-${idx}`);
    if(mEl){
      const price=prices[idx]||0;
      const margin=price>0?((price-totals[idx])/price*100):0;
      mEl.innerHTML=`<span class="${margin>=60?'margin-good':margin>=40?'margin-ok':'margin-bad'}">${pct(margin)}</span>`;
    }
  }
}

function saveEditMenuItem(id) {
  const items=DB.menuItems(); const item=items.find(x=>x.id===id); if(!item) return;
  item.name=document.getElementById('emi-name')?.value?.trim()||item.name;
  item.cat=document.getElementById('emi-cat')?.value||item.cat;
  item.active=document.getElementById('emi-active')?.checked!==false;
  const sizeRows=[...document.querySelectorAll('#emi-sizes-list .size-row')];
  item.sizes=sizeRows.map((row,i)=>({
    sz:['S','M','L','XL'][i]||'M',
    label:row.querySelector('.sz-label')?.value?.trim()||'Regular',
    price:parseFloat(row.querySelector('.sz-price')?.value)||0
  })).filter(s=>s.label);
  const ingrs=DB.ingredients();
  item.ingredients=[];
  ingrs.forEach(ing=>{
    const hasAmt=item.sizes.some((_,idx)=>parseFloat(document.getElementById(`ri-${ing.id}-${idx}`)?.value||0)>0);
    if(!hasAmt) return;
    const ri={ingId:ing.id,amtS:0,amtM:0,amtL:0,amtXL:0};
    item.sizes.forEach((_,idx)=>{ const k=SZ_KEYS[idx]||'amtL'; ri[k]=parseFloat(document.getElementById(`ri-${ing.id}-${idx}`)?.value)||0; });
    item.ingredients.push(ri);
  });
  DB.saveMenuItems(items); closeModal(); toast(`${item.name} saved ✓`,'success'); renderRecipes();
}

function deleteMenuItem(id) {
  if(!confirm('Remove this drink from the menu?')) return;
  DB.saveMenuItems(DB.menuItems().filter(m=>m.id!==id));
  closeModal(); toast('Drink removed'); renderRecipes();
}

function showAddIngredientModal() {
  openModal(`
    <div class="modal-head"><h2>Add Ingredient</h2><p>Set cost, stock level and minimum</p></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field span2"><label>Ingredient Name *</label><input id="ai-name" placeholder="e.g. Almond milk"></div>
        <div class="field"><label>Category</label>
          <select id="ai-cat"><option>Coffee</option><option>Dairy</option><option>Dairy alt</option><option>Dry goods</option><option>Syrups</option><option>Packaging</option><option>Bakery</option><option>Other</option></select>
        </div>
        <div class="field"><label>Unit</label>
          <select id="ai-unit"><option>g</option><option>ml</option><option>each</option><option>kg</option><option>L</option><option>cyl</option></select>
        </div>
        <div class="field"><label>Cost per unit (R)</label><input id="ai-cost" type="number" step="0.001" min="0" placeholder="e.g. 0.038"></div>
        <div class="field"><label>Current Stock</label><input id="ai-stock" type="number" min="0" placeholder="0"></div>
        <div class="field"><label>Minimum Stock Level</label><input id="ai-min" type="number" min="0" placeholder="0"></div>
        <div class="field"><label>Expiry (days, 0=no expiry)</label><input id="ai-exp" type="number" min="0" value="0"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewIngredient()">Save Ingredient</button>
    </div>
  `);
}

function saveNewIngredient() {
  const name=document.getElementById('ai-name')?.value?.trim();
  if(!name){ toast('Name required','error'); return; }
  const ing={id:uuid(),name,cat:document.getElementById('ai-cat')?.value||'Other',
    unit:document.getElementById('ai-unit')?.value||'g',
    costPer:parseFloat(document.getElementById('ai-cost')?.value)||0,
    stock:parseFloat(document.getElementById('ai-stock')?.value)||0,
    minStock:parseFloat(document.getElementById('ai-min')?.value)||0,
    expiryDays:parseInt(document.getElementById('ai-exp')?.value)||0};
  const list=DB.ingredients(); list.push(ing); DB.saveIngredients(list);
  closeModal(); toast(`${name} added ✓`,'success'); renderRecipes();
}

function showEditIngredientModal(id) {
  const ingrs=DB.ingredients(); const ing=ingrs.find(x=>x.id===id); if(!ing) return;
  openModal(`
    <div class="modal-head"><h2>Edit: ${esc(ing.name)}</h2></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field span2"><label>Name</label><input id="ei-name" value="${esc(ing.name)}"></div>
        <div class="field"><label>Category</label>
          <select id="ei-cat">${['Coffee','Dairy','Dairy alt','Dry goods','Syrups','Packaging','Bakery','Other'].map(c=>`<option ${ing.cat===c?'selected':''}>${c}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Unit</label>
          <select id="ei-unit">${['g','ml','each','kg','L','cyl'].map(u=>`<option ${ing.unit===u?'selected':''}>${u}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Cost per unit (R)</label><input id="ei-cost" type="number" step="0.001" value="${ing.costPer}"></div>
        <div class="field"><label>Current Stock</label><input id="ei-stock" type="number" value="${ing.stock}"></div>
        <div class="field"><label>Minimum Stock</label><input id="ei-min" type="number" value="${ing.minStock}"></div>
        <div class="field"><label>Expiry days</label><input id="ei-exp" type="number" value="${ing.expiryDays}"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditIngredient('${id}')">Save</button>
    </div>
  `);
}

function saveEditIngredient(id) {
  const ingrs=DB.ingredients(); const ing=ingrs.find(x=>x.id===id); if(!ing) return;
  ing.name=document.getElementById('ei-name')?.value?.trim()||ing.name;
  ing.cat=document.getElementById('ei-cat')?.value||ing.cat;
  ing.unit=document.getElementById('ei-unit')?.value||ing.unit;
  ing.costPer=parseFloat(document.getElementById('ei-cost')?.value)||0;
  ing.stock=parseFloat(document.getElementById('ei-stock')?.value)||0;
  ing.minStock=parseFloat(document.getElementById('ei-min')?.value)||0;
  ing.expiryDays=parseInt(document.getElementById('ei-exp')?.value)||0;
  DB.saveIngredients(ingrs); closeModal(); toast(`${ing.name} updated ✓`,'success'); renderRecipes();
}

function deleteIngredient(id) {
  if(!confirm('Remove this ingredient? It will be removed from all recipes.')) return;
  const ingrs=DB.ingredients().filter(i=>i.id!==id);
  const items=DB.menuItems().map(item=>({...item,ingredients:(item.ingredients||[]).filter(r=>r.ingId!==id)}));
  DB.saveIngredients(ingrs); DB.saveMenuItems(items);
  toast('Ingredient removed'); renderRecipes();
}

// ═══════════════════════════════════════════════════════════════════════
// STOCK TAKE
// ═══════════════════════════════════════════════════════════════════════

function renderStock() {
  const items  = DB.stock();
  const sLog   = DB.stockLog();
  const today  = todayStr();
  const lowItems=getLowStockItems(), critItems=getCriticalStockItems();
  const alertCount=lowItems.length;

  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Stock Take</div><div class="sec-sub">${new Date().toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long'})}</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${alertCount>0?`<span class="alert-pill">⚠ ${alertCount} item${alertCount!==1?'s':''} low</span>`:''}
        <button class="btn btn-ghost btn-sm" onclick="showAddStockItemModal()">+ Add Item</button>
        <button class="btn btn-primary" onclick="saveAllStock()">Save Count</button>
      </div>
    </div>

    ${alertCount>0?`
    <div class="stock-alert-banner">
      <span class="sab-label">⚠ Reorder Alert — ${alertCount} item${alertCount!==1?'s':''} at or below minimum</span>
      <div class="sab-items">
        ${lowItems.map(i=>`<span class="stock-alert-chip ${critItems.find(c=>c.id===i.id)?'critical':''}">${esc(i.name)}</span>`).join('')}
      </div>
    </div>`:''}

    <div class="info-note mb-16">
      📋 Enter <strong>Opening</strong> at start of day, <strong>Used</strong> + <strong>Waste</strong> at close. Closing calculates automatically.
      Red = at/below reorder level · Amber = within 50% above reorder level.
    </div>

    <div class="card">
      <div class="card-body np">
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>Item</th><th>Category</th>
              <th>Opening</th><th>Used</th><th>Waste</th><th>Waste Reason</th><th>Closing</th>
              <th>Reorder At</th><th>Status</th><th></th>
            </tr></thead>
            <tbody id="stockTbody">
              ${items.map((item,i)=>{
                const prev=sLog.filter(l=>l.date===today&&l.itemId===item.id).pop();
                const opening=prev?.opening??''; const used=prev?.used??''; const waste=prev?.waste??'';
                const closing=(opening!==''&&used!==''&&waste!=='')?Math.max(0,Number(opening)-Number(used)-Number(waste)):'';
                const needsReorder=closing!==''&&closing<=item.reorder;
                const nearReorder=closing!==''&&closing<=item.reorder*1.5&&!needsReorder;
                return `<tr class="${needsReorder?'reorder-row':nearReorder?'low-row':i%2===0?'even':''}" id="stock-row-${item.id}">
                  <td class="text-muted">${i+1}</td>
                  <td><strong>${esc(item.name)}</strong></td>
                  <td><span class="badge badge-cream">${esc(item.cat)}</span></td>
                  <td><input class="stock-input" id="s-op-${item.id}" type="number" min="0" value="${opening}" placeholder="0" oninput="calcClosing('${item.id}')"></td>
                  <td><input class="stock-input" id="s-us-${item.id}" type="number" min="0" value="${used}"    placeholder="0" oninput="calcClosing('${item.id}')"></td>
                  <td><input class="stock-input" id="s-wa-${item.id}" type="number" min="0" value="${waste}"   placeholder="0" oninput="calcClosing('${item.id}')"></td>
                  <td><select id="s-wr-${item.id}" style="padding:5px 8px;border:1.5px solid var(--border);border-radius:6px;font-family:inherit;font-size:12px;min-width:120px">
                    ${['','Expired','Dropped','Wrong order','Over-steamed','Spillage','Other'].map(r=>`<option ${(prev?.wasteReason||'')==r?'selected':''}>${r}</option>`).join('')}
                  </select></td>
                  <td id="s-cl-${item.id}" class="fw-bold">
                    ${closing!==''?closing+' <small class="text-muted">'+esc(item.unit)+'</small>':'—'}
                  </td>
                  <td class="text-muted">${item.reorder} ${esc(item.unit)}</td>
                  <td id="s-st-${item.id}">
                    ${closing!==''?(needsReorder?'<span class="alert-pill">🔴 Reorder</span>':nearReorder?'<span class="warn-pill">↓ Low</span>':'<span class="ok-pill">✅ OK</span>'):'—'}
                  </td>
                  <td><button class="btn btn-red btn-xs" onclick="deleteStockItem('${item.id}')">✕</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function calcClosing(id) {
  const op=parseFloat(document.getElementById('s-op-'+id)?.value)||0;
  const us=parseFloat(document.getElementById('s-us-'+id)?.value)||0;
  const wa=parseFloat(document.getElementById('s-wa-'+id)?.value)||0;
  const cl=Math.max(0,op-us-wa);
  const item=DB.stock().find(x=>x.id===id); if(!item) return;
  const clEl=document.getElementById('s-cl-'+id);
  const stEl=document.getElementById('s-st-'+id);
  const row=document.getElementById('stock-row-'+id);
  if(clEl) clEl.innerHTML=cl+' <small class="text-muted">'+esc(item.unit)+'</small>';
  const needs=cl<=item.reorder, near=cl<=item.reorder*1.5&&!needs;
  if(stEl) stEl.innerHTML=needs?'<span class="alert-pill">🔴 Reorder</span>':near?'<span class="warn-pill">↓ Low</span>':'<span class="ok-pill">✅ OK</span>';
  if(row){ row.className=needs?'reorder-row':near?'low-row':''; }
}

function saveAllStock() {
  const items=DB.stock(); const sLog=DB.stockLog(); const today=todayStr(); let saved=0;
  items.forEach(item=>{
    const op=document.getElementById('s-op-'+item.id)?.value;
    const us=document.getElementById('s-us-'+item.id)?.value;
    const wa=document.getElementById('s-wa-'+item.id)?.value;
    if(op===''&&us===''&&wa==='') return;
    const closing=Math.max(0,(parseFloat(op)||0)-(parseFloat(us)||0)-(parseFloat(wa)||0));
    const filtered=sLog.filter(l=>!(l.date===today&&l.itemId===item.id));
    const wr=document.getElementById('s-wr-'+item.id)?.value||'';
    filtered.push({date:today,itemId:item.id,opening:parseFloat(op)||0,used:parseFloat(us)||0,waste:parseFloat(wa)||0,wasteReason:wr,closing});
    DB.saveStockLog(filtered); saved++;
  });
  toast(`Stock count saved (${saved} items)`,'success'); renderStock();
}

function showAddStockItemModal() {
  openModal(`
    <div class="modal-head"><h2>Add Stock Item</h2></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field span2"><label>Item Name *</label><input id="si-name" placeholder="e.g. Almond milk"></div>
        <div class="field"><label>Category</label>
          <select id="si-cat"><option>Coffee</option><option>Dairy</option><option>Dairy alt</option><option>Syrups</option><option>Bakery</option><option>Dry goods</option><option>Packaging</option><option>Energy</option><option>Other</option></select>
        </div>
        <div class="field"><label>Unit</label>
          <select id="si-unit"><option>each</option><option>g</option><option>ml</option><option>kg</option><option>L</option><option>cyl</option></select>
        </div>
        <div class="field"><label>Opening Count</label><input id="si-count" type="number" min="0" value="0"></div>
        <div class="field"><label>Reorder At</label><input id="si-reorder" type="number" min="0" value="0"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewStockItem()">Add Item</button>
    </div>
  `);
}

function saveNewStockItem() {
  const name=document.getElementById('si-name')?.value?.trim();
  if(!name){ toast('Name required','error'); return; }
  const item={id:uuid(),name,cat:document.getElementById('si-cat')?.value||'Other',
    unit:document.getElementById('si-unit')?.value||'each',
    count:parseFloat(document.getElementById('si-count')?.value)||0,
    reorder:parseFloat(document.getElementById('si-reorder')?.value)||0};
  const list=DB.stock(); list.push(item); DB.saveStock(list);
  closeModal(); toast(`${name} added ✓`,'success'); renderStock();
}

function deleteStockItem(id) {
  if(!confirm('Remove this stock item?')) return;
  DB.saveStock(DB.stock().filter(i=>i.id!==id)); toast('Item removed'); renderStock();
}

// ═══════════════════════════════════════════════════════════════════════
// DAILY LOG
// ═══════════════════════════════════════════════════════════════════════

function renderTallyGrid(tally) {
  const items=DB.menuItems().filter(i=>i.active);
  if(!items.length) return '<span style="color:rgba(255,253,229,.4);font-size:12px">No active menu items</span>';
  return items.flatMap(item=>
    (item.sizes||[]).map((sz,idx)=>{
      const key=`${item.id}_${idx}`;
      const val=tally[key]||0;
      return `<div class="tally-card">
        <div><div class="tally-name">${esc(item.name)}</div><div class="tally-sz">${esc(sz.label||sz.sz)}</div></div>
        <div class="tally-ctrl">
          <button class="tally-btn" onclick="adjustTally('${key}',-1)">−</button>
          <span class="tally-num" id="tv-${key}" data-tally-key="${key}">${val}</span>
          <button class="tally-btn" onclick="adjustTally('${key}',1)">+</button>
        </div>
      </div>`;
    })
  ).join('');
}
function adjustTally(key, delta) {
  const el=document.getElementById('tv-'+key); if(!el) return;
  const cur=parseInt(el.textContent)||0;
  el.textContent=Math.max(0,cur+delta);
}

function renderDaily() {
  const log=DB.dailyLog().sort((a,b)=>b.date.localeCompare(a.date));
  const today=todayStr(); const todayEntry=log.find(e=>e.date===today);
  const totalRev=log.reduce((a,e)=>a+(e.revenue||0),0);
  const totalCups=log.reduce((a,e)=>a+(e.cups||0),0);
  const avgCups=log.length?(totalCups/log.length).toFixed(1):0;
  const avgRev=totalCups?totalRev/totalCups:0;

  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Daily Log</div><div class="sec-sub">Log each day at close — feeds P&L automatically</div></div>
      <button class="btn btn-ghost btn-sm" onclick="exportDailyLog()">↓ Export CSV</button>
    </div>

    <div class="entry-form-card">
      <div class="ef-title">📋 ${todayEntry?'Update Today — '+fmtDate(today):'Log Today — '+fmtDate(today)}</div>
      <div class="form-grid three">
        <div class="field"><label>Date</label><input type="date" id="dl-date" value="${today}"></div>
        <div class="field"><label>Cups Sold</label><input type="number" id="dl-cups" min="0" value="${todayEntry?.cups||''}" placeholder="e.g. 42"></div>
        <div class="field"><label>Revenue (R) — Yoco</label><input type="number" id="dl-rev" min="0" step="0.01" value="${todayEntry?.revenue||''}" placeholder="e.g. 1850.00"></div>
        <div class="field"><label>Tips (R)</label><input type="number" id="dl-tips" min="0" step="0.01" value="${todayEntry?.tips||''}" placeholder="0.00"></div>
        <div class="field"><label>New Customers</label><input type="number" id="dl-new" min="0" value="${todayEntry?.newCustomers||''}" placeholder="0"></div>
        <div class="field"><label>Loyalty Sign-ups</label><input type="number" id="dl-signups" min="0" value="${todayEntry?.loyaltySignups||''}" placeholder="0"></div>
        <div class="field"><label>Weather</label>
          <select id="dl-weather">
            ${['Hot & sunny','Warm','Overcast','Cold','Rainy','Windy'].map(w=>`<option ${(todayEntry?.weather||'')==w?'selected':''}>${w}</option>`).join('')}
          </select>
        </div>
        <div class="field span2"><label>Notes / Issues</label><input id="dl-notes" value="${esc(todayEntry?.notes||'')}" placeholder="Specials ran, busy periods, issues…"></div>
        <div class="field"><label>Tomorrow's Prep</label><input id="dl-prep" value="${esc(todayEntry?.prep||'')}" placeholder="Order milk, prep croissants…"></div>
        <div class="field span2">
          <label style="display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="dl-event" ${todayEntry?.isEvent?'checked':''} style="width:16px;height:16px;accent-color:rgba(255,253,229,.8)">
            Event / market day
          </label>
          <input id="dl-eventname" placeholder="Event name (e.g. Saturday Market)" value="${esc(todayEntry?.eventName||'')}" style="margin-top:8px;padding:8px 12px;border:1.5px solid rgba(255,253,229,.2);border-radius:7px;background:rgba(255,255,255,.08);color:var(--cream);font-family:inherit;font-size:13px;width:100%">
        </div>
      </div>
      <div style="margin-top:14px">
        <div style="font-size:12px;color:rgba(255,253,229,.55);margin-bottom:10px;font-weight:600;text-transform:uppercase;letter-spacing:.7px">Drink Tally</div>
        <div class="tally-grid" id="tallyGrid">${renderTallyGrid(todayEntry?.tally||{})}</div>
      </div>
      <div style="margin-top:16px">
        <button class="btn btn-primary" style="background:rgba(255,253,229,.15);border:1.5px solid rgba(255,253,229,.4);color:var(--cream)" onclick="saveDailyEntry()">${todayEntry?'Update Entry':'Save Entry'}</button>
      </div>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">
      <div class="kpi-card"><div class="kpi-label">Total Revenue</div><div class="kpi-value" style="font-size:18px">${R(totalRev)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Total Cups</div><div class="kpi-value">${N(totalCups)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Avg Cups / Day</div><div class="kpi-value">${avgCups}</div></div>
      <div class="kpi-card"><div class="kpi-label">Avg Rev / Cup</div><div class="kpi-value" style="font-size:18px">${R(avgRev)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Days Logged</div><div class="kpi-value">${log.length}</div></div>
    </div>

    <div class="card">
      <div class="card-head"><span class="card-title">All Entries</span></div>
      <div class="card-body np">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Day</th><th>Cups</th><th>Revenue</th><th>R/Cup</th><th>New Cust.</th><th>Weather</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              ${log.length ? log.map((e,i)=>`
                <tr class="${i%2===0?'even':''}">
                  <td><strong>${fmtDateShort(e.date)}</strong></td>
                  <td class="text-muted">${new Date(e.date+'T12:00:00').toLocaleDateString('en-ZA',{weekday:'short'})}</td>
                  <td><strong>${N(e.cups||0)}</strong></td>
                  <td class="text-green fw-bold">${R(e.revenue||0)}</td>
                  <td>${e.cups?R((e.revenue||0)/(e.cups||1)):'—'}</td>
                  <td class="text-center">${e.newCustomers||0}</td>
                  <td>${esc(e.weather||'')}</td>
                  <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--muted)">${esc(e.notes||'')}</td>
                  <td><button class="btn btn-ghost btn-xs" onclick="deleteEntry('${e.id}')">✕</button></td>
                </tr>`).join('') : `<tr><td colspan="9"><div class="empty-state"><div class="es-icon">📋</div><div class="es-text">No entries yet</div></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function applyTallyToStock(tally) {
  if(!tally||!Object.values(tally).some(v=>v>0)) return;
  const menuItems=DB.menuItems();
  const stock=DB.stock();

  // Accumulate total ingredient usage from tally
  const usage={}; // ingId → total (in ingredient units)
  Object.entries(tally).forEach(([key,count])=>{
    if(!count) return;
    // key = "${menuItemId}_${sizeIndex}"
    const parts=key.split('_');
    const szIdx=parseInt(parts.pop());
    const drinkId=parts.join('_');
    const item=menuItems.find(m=>m.id===drinkId);
    if(!item?.ingredients) return;
    const szKey=SZ_KEYS[szIdx];
    item.ingredients.forEach(ri=>{
      const amt=ri[szKey]||0;
      if(!amt) return;
      usage[ri.ingId]=(usage[ri.ingId]||0)+amt*count;
    });
  });

  if(!Object.keys(usage).length) return;

  let deducted=0;
  stock.forEach(item=>{
    if(!item.ingredientId||!usage[item.ingredientId]) return;
    const cf=item.convFactor||1;
    const deduct=usage[item.ingredientId]/cf;
    item.count=Math.max(0,parseFloat(((item.count||0)-deduct).toFixed(3)));
    deducted++;
  });
  if(deducted>0) DB.saveStock(stock);
}

function saveDailyEntry() {
  const date=document.getElementById('dl-date')?.value;
  const cups=parseFloat(document.getElementById('dl-cups')?.value)||0;
  const revenue=parseFloat(document.getElementById('dl-rev')?.value)||0;
  if(!date){ toast('Please select a date','error'); return; }
  const log=DB.dailyLog(); const idx=log.findIndex(e=>e.date===date);
  const isUpdate=idx>=0;
  const tally={};
  document.querySelectorAll('[data-tally-key]').forEach(el=>{ const v=parseInt(el.textContent)||0; if(v>0) tally[el.dataset.tallyKey]=v; });
  const entry={id:isUpdate?log[idx].id:uuid(),date,cups,revenue,
    tips:parseFloat(document.getElementById('dl-tips')?.value)||0,
    newCustomers:parseInt(document.getElementById('dl-new')?.value)||0,
    loyaltySignups:parseInt(document.getElementById('dl-signups')?.value)||0,
    weather:document.getElementById('dl-weather')?.value||'',
    notes:document.getElementById('dl-notes')?.value?.trim()||'',
    prep:document.getElementById('dl-prep')?.value?.trim()||'',
    isEvent:document.getElementById('dl-event')?.checked||false,
    eventName:document.getElementById('dl-eventname')?.value?.trim()||'',
    tally};
  if(isUpdate) log[idx]=entry; else log.push(entry);
  DB.saveDailyLog(log);
  // Only deduct stock on a NEW entry (not updates, to avoid double-deducting)
  if(!isUpdate) applyTallyToStock(tally);
  toast(isUpdate?'Entry updated ✓':'Entry saved ✓','success');
  renderDaily();
}

function deleteEntry(id) {
  if(!confirm('Delete this entry?')) return;
  DB.saveDailyLog(DB.dailyLog().filter(e=>e.id!==id)); toast('Entry deleted'); renderDaily();
}

function exportDailyLog() {
  const log=DB.dailyLog().sort((a,b)=>a.date.localeCompare(b.date));
  if(!log.length){ toast('No entries to export','error'); return; }
  const headers=['Date','Cups','Revenue','New Customers','Loyalty Sign-ups','Weather','Notes','Prep'];
  const rows=log.map(e=>[e.date,e.cups||0,e.revenue||0,e.newCustomers||0,e.loyaltySignups||0,e.weather,e.notes,e.prep].map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(','));
  const csv=[headers.join(','),...rows].join('\n');
  const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='Apostello_DailyLog_'+todayStr()+'.csv'; a.click(); toast('Daily log exported');
}

// ═══════════════════════════════════════════════════════════════════════
// WEEKLY P&L
// ═══════════════════════════════════════════════════════════════════════

function getWeekDates(offset) {
  const now=new Date(); now.setDate(now.getDate()+offset*7);
  const mon=getMonday(now.toISOString().split('T')[0]);
  return { mon, fri:addDays(mon,4) };
}

function calcPnL(weekEntries, settings) {
  const rev=weekEntries.reduce((a,e)=>a+(e.revenue||0),0);
  const cups=weekEntries.reduce((a,e)=>a+(e.cups||0),0);
  const avgCPU=calcAvgCostPerCup();
  const foodCost=cups*avgCPU;
  const cardFees=rev*((settings.yocoFee||2.9)/100);
  const weeklyFixed=getWeeklyExpenses();
  const grossProfit=rev-foodCost;
  const netProfit=grossProfit-weeklyFixed-cardFees;
  const grossMargin=rev>0?(grossProfit/rev*100):0;
  const netMargin=rev>0?(netProfit/rev*100):0;
  return {rev,cups,foodCost,grossProfit,grossMargin,weeklyFixed,cardFees,netProfit,netMargin};
}

function renderPnL() {
  if(currentUser()?.role!=='admin'){ document.getElementById('content').innerHTML='<div class="empty-state" style="padding:80px"><div class="es-icon">🔒</div><div class="es-text">Admin access only</div></div>'; return; }
  const s=DB.settings(); const log=DB.dailyLog();
  const {mon}=getWeekDates(pnlOffset);
  const weekEntries=log.filter(e=>e.date>=mon&&e.date<=addDays(mon,6));
  const prev=getWeekDates(pnlOffset-1);
  const prevEntries=log.filter(e=>e.date>=prev.mon&&e.date<=addDays(prev.mon,6));
  const p=calcPnL(weekEntries,s), pp=calcPnL(prevEntries,s);
  const hasData=p.rev>0||p.cups>0;
  const weekdays=Array.from({length:5},(_,i)=>addDays(mon,i));
  const expenses=DB.expenses().filter(e=>e.active);
  const weeklyFixed=getWeeklyExpenses();

  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Weekly P&L</div><div class="sec-sub">Auto-calculated from Daily Log + expense settings</div></div>
      <div class="week-nav">
        <button class="btn btn-ghost btn-sm" onclick="pnlOffset--;renderPnL()">← Prev</button>
        <span class="week-label">${weekLabel(mon)}</span>
        <button class="btn btn-ghost btn-sm" onclick="pnlOffset=Math.min(0,pnlOffset+1);renderPnL()" ${pnlOffset>=0?'disabled':''}>Next →</button>
        ${pnlOffset!==0?`<button class="btn btn-primary btn-sm" onclick="pnlOffset=0;renderPnL()">This Week</button>`:''}
      </div>
    </div>

    ${!hasData?`<div class="info-note amber-note mb-16">⚠ No Daily Log entries for this week yet. Add entries in Daily Log and they'll auto-populate here.</div>`:''}

    <div class="kpi-grid">
      <div class="kpi-card dark"><div class="kpi-icon">💰</div><div class="kpi-label">Revenue</div><div class="kpi-value" style="font-size:20px">${R(p.rev)}</div><div class="kpi-sub">${trend(p.rev,pp.rev)} vs prev week</div></div>
      <div class="kpi-card green"><div class="kpi-icon">↗</div><div class="kpi-label">Gross Profit</div><div class="kpi-value" style="font-size:20px">${R(p.grossProfit)}</div><div class="kpi-sub">Margin: ${pct(p.grossMargin)}</div></div>
      <div class="kpi-card ${p.netProfit>=0?'':'red'}"><div class="kpi-icon">🏆</div><div class="kpi-label">Net Profit</div><div class="kpi-value ${p.netProfit<0?'text-red':''}" style="font-size:20px">${R(p.netProfit)}</div><div class="kpi-sub">Net margin: ${pct(p.netMargin)}</div></div>
      <div class="kpi-card"><div class="kpi-icon">☕</div><div class="kpi-label">Cups Sold</div><div class="kpi-value">${N(p.cups)}</div><div class="kpi-sub">Avg ${p.cups?R(p.rev/p.cups):R(0)}/cup</div></div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-head"><span class="card-title">P&L Breakdown</span></div>
        <div class="card-body np">
          <table>
            <tbody>
              <tr class="pnl-row-head"><td colspan="2">REVENUE</td></tr>
              <tr><td>Total Revenue</td><td class="text-right fw-bold">${R(p.rev)}</td></tr>
              <tr class="even"><td style="padding-left:20px;color:var(--muted)">VAT collected (15%)</td><td class="text-right text-muted">${R(p.rev*0.15)}</td></tr>
              <tr><td style="padding-left:20px;color:var(--muted)">Revenue ex VAT</td><td class="text-right text-muted">${R(p.rev/1.15)}</td></tr>
              <tr class="pnl-row-head"><td colspan="2">COST OF SALES</td></tr>
              <tr class="even"><td>Food &amp; beverage cost</td><td class="text-right">${R(p.foodCost)}</td></tr>
              <tr class="pnl-row-total"><td>Gross Profit</td><td class="text-right text-green">${R(p.grossProfit)}</td></tr>
              <tr><td style="padding-left:20px;color:var(--muted)">Gross margin</td><td class="text-right text-muted">${pct(p.grossMargin)}</td></tr>
              <tr class="pnl-row-head"><td colspan="2">FIXED EXPENSES (weekly share)</td></tr>
              ${expenses.map((e,i)=>`<tr class="${i%2===0?'even':''}"><td style="padding-left:20px">${esc(e.name)}</td><td class="text-right">${R(e.amount/4.33)}</td></tr>`).join('')}
              <tr class="pnl-row-total"><td>Total Fixed (weekly)</td><td class="text-right">${R(weeklyFixed)}</td></tr>
              <tr class="pnl-row-head"><td colspan="2">VARIABLE COSTS</td></tr>
              <tr class="even"><td style="padding-left:20px">Card fees (${s.yocoFee}%)</td><td class="text-right">${R(p.cardFees)}</td></tr>
              <tr class="pnl-row-net"><td>NET PROFIT / (LOSS)</td><td class="text-right ${p.netProfit<0?'text-red':''}">${R(p.netProfit)}</td></tr>
              <tr><td style="padding-left:20px;color:var(--muted)">Net margin</td><td class="text-right text-muted">${pct(p.netMargin)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div class="card">
          <div class="card-head"><span class="card-title">Daily Breakdown</span></div>
          <div class="card-body np">
            <table>
              <thead><tr><th>Day</th><th>Cups</th><th>Revenue</th></tr></thead>
              <tbody>
                ${weekdays.map((d,i)=>{
                  const e=log.find(x=>x.date===d);
                  return `<tr class="${i%2===0?'even':''}">
                    <td>${new Date(d+'T12:00:00').toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short'})}</td>
                    <td>${e?N(e.cups||0):'—'}</td>
                    <td class="${e?'text-green':''}">${e?R(e.revenue||0):'—'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card" style="margin-top:16px">
          <div class="card-head"><span class="card-title">vs Previous Week</span></div>
          <div class="card-body">
            ${[['Revenue',p.rev,pp.rev],['Gross Profit',p.grossProfit,pp.grossProfit],['Net Profit',p.netProfit,pp.netProfit],['Cups Sold',p.cups,pp.cups]].map(([l,c,pr])=>`
              <div class="compare-row">
                <span class="compare-label">${l}</span>
                <div style="text-align:right">
                  <span class="compare-val">${l==='Cups Sold'?N(c):R(c)}</span>
                  <div style="font-size:11px;margin-top:2px">${trend(c,pr)}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">Revenue vs Costs — This Week</span></div>
      <div class="card-body"><div class="chart-wrap" style="height:200px"><canvas id="pnlChart"></canvas></div></div>
    </div>
    <div class="info-note">⚙ Fixed expenses are managed in <a href="#" onclick="navigate('settings');return false" style="color:var(--navy);font-weight:700">Settings → Expenses</a>. Recipe costs auto-update when you change ingredients in <a href="#" onclick="navigate('recipes');return false" style="color:var(--navy);font-weight:700">Recipes & Menu</a>.</div>
  `;

  charts.pnl=new Chart(document.getElementById('pnlChart'),{
    type:'bar',data:{labels:['Revenue','Food Cost','Fixed Costs','Card Fees','Net Profit'],
    datasets:[{data:[p.rev,p.foodCost,p.weeklyFixed,p.cardFees,Math.max(0,p.netProfit)],backgroundColor:['#001982','rgba(0,25,130,0.55)','rgba(0,25,130,0.40)','rgba(0,25,130,0.25)','#1a6b2e'],borderRadius:5}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:11}}},y:{grid:{color:'#eceef8'},ticks:{font:{size:11},callback:v=>'R'+v.toLocaleString('en-ZA')}}}}
  });
}

// ═══════════════════════════════════════════════════════════════════════
// MONTHLY
// ═══════════════════════════════════════════════════════════════════════

function getMonthEntries(y,m) {
  const start=`${y}-${String(m+1).padStart(2,'0')}-01`;
  const end=`${y}-${String(m+1).padStart(2,'0')}-31`;
  return DB.dailyLog().filter(e=>e.date>=start&&e.date<=end);
}

function renderMonthly() {
  if(currentUser()?.role!=='admin'){ document.getElementById('content').innerHTML='<div class="empty-state" style="padding:80px"><div class="es-icon">🔒</div><div class="es-text">Admin access only</div></div>'; return; }
  const s=DB.settings();
  const monthlyFixed=getMonthlyExpensesTotal();
  const months=Array.from({length:12},(_,m)=>{
    const entries=getMonthEntries(monthYear,m);
    const rev=entries.reduce((a,e)=>a+(e.revenue||0),0);
    const cups=entries.reduce((a,e)=>a+(e.cups||0),0);
    const p=calcPnL(entries,s);
    const monthlyNet=p.grossProfit-monthlyFixed-p.cardFees;
    return {m,name:monthName(m),rev,cups,...p,monthlyNet,entries};
  });
  const selMonth=months[monthMonth];
  const yearRev=months.reduce((a,m)=>a+m.rev,0);
  const yearCups=months.reduce((a,m)=>a+m.cups,0);
  const yearNet=months.reduce((a,m)=>a+m.monthlyNet,0);
  const custThisMonth=DB.customers().filter(c=>(c.dateJoined||'').startsWith(`${monthYear}-${String(monthMonth+1).padStart(2,'0')}`)).length;

  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Monthly Summary</div><div class="sec-sub">Year-to-date — ${monthYear}</div></div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-ghost btn-sm" onclick="monthYear--;renderMonthly()">← ${monthYear-1}</button>
        <strong>${monthYear}</strong>
        <button class="btn btn-ghost btn-sm" onclick="monthYear++;renderMonthly()">${monthYear+1} →</button>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card dark"><div class="kpi-label">Year Revenue</div><div class="kpi-value" style="font-size:18px">${R(yearRev)}</div><div class="kpi-sub">Target: ${R(s.weeklyRevenueTarget*4.33*12)}</div></div>
      <div class="kpi-card green"><div class="kpi-label">Year Net Profit</div><div class="kpi-value" style="font-size:18px">${R(yearNet)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Year Cups</div><div class="kpi-value">${N(yearCups)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Monthly Fixed Costs</div><div class="kpi-value" style="font-size:18px">${R(monthlyFixed)}</div><div class="kpi-sub">All active expenses</div></div>
    </div>

    <div class="card">
      <div class="card-head"><span class="card-title">Monthly Revenue — ${monthYear}</span></div>
      <div class="card-body"><div class="chart-wrap" style="height:200px"><canvas id="monthChart"></canvas></div></div>
    </div>

    <div class="card">
      <div class="card-head"><span class="card-title">Select Month</span></div>
      <div class="card-body">
        <div class="month-grid">
          ${months.map(m=>`
            <div class="month-tile ${m.m===monthMonth?'active':''}" onclick="monthMonth=${m.m};renderMonthly()">
              <div class="mt-name">${m.name}</div>
              <div class="mt-rev">${m.rev?R(m.rev):'—'}</div>
              <div class="mt-net ${m.monthlyNet<0?'text-red':m.monthlyNet>0?'text-green':'text-muted'}">${m.rev?R(m.monthlyNet)+' net':''}</div>
              <div class="mt-cups">${m.cups?N(m.cups)+' cups':''}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-head"><span class="card-title">${monthName(monthMonth)} ${monthYear} — Detail</span></div>
        <div class="card-body np">
          <table><tbody>
            <tr><td>Revenue</td><td class="text-right fw-bold">${R(selMonth.rev)}</td></tr>
            <tr class="even"><td>Food Cost</td><td class="text-right">${R(selMonth.foodCost)}</td></tr>
            <tr><td>Gross Profit</td><td class="text-right text-green fw-bold">${R(selMonth.grossProfit)}</td></tr>
            <tr class="even"><td>Gross Margin</td><td class="text-right">${pct(selMonth.grossMargin)}</td></tr>
            <tr><td>Fixed Expenses</td><td class="text-right">${R(monthlyFixed)}</td></tr>
            <tr class="even"><td>Card Fees</td><td class="text-right">${R(selMonth.cardFees)}</td></tr>
            <tr class="pnl-row-net"><td>Net Profit</td><td class="text-right ${selMonth.monthlyNet<0?'text-red':''}">${R(selMonth.monthlyNet)}</td></tr>
            <tr class="even"><td>Cups Sold</td><td class="text-right">${N(selMonth.cups)}</td></tr>
            <tr><td>Days Logged</td><td class="text-right">${selMonth.entries.length}</td></tr>
            <tr class="even"><td>New Loyalty Members</td><td class="text-right">${custThisMonth}</td></tr>
          </tbody></table>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Target vs Actual — ${monthName(monthMonth)}</span></div>
        <div class="card-body">
          ${[
            ['Monthly Revenue',selMonth.rev,s.weeklyRevenueTarget*4.33],
            ['Monthly Net Profit',selMonth.monthlyNet,s.monthlyNetTarget],
            ['Avg Daily Cups',selMonth.entries.length?selMonth.cups/selMonth.entries.length:0,s.dailyCupTarget],
          ].map(([label,actual,target])=>{
            const progress=target>0?Math.min(100,(actual/target)*100):0;
            return `<div style="margin-bottom:14px">
              <div class="flex-between" style="margin-bottom:4px">
                <span style="font-size:13px;font-weight:600">${label}</span>
                <span style="font-size:12px;color:var(--muted)">${label.includes('Cups')?(actual.toFixed(1)+' / '+target):(R(actual)+' / '+R(target))}</span>
              </div>
              <div class="progress-bar-bg"><div class="progress-bar-fill ${progress>=100?'green':progress<50?'red':'amber'}" style="width:${progress}%"></div></div>
              <div class="progress-label"><span></span><span>${progress.toFixed(0)}% of target</span></div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  charts.monthly=new Chart(document.getElementById('monthChart'),{
    type:'line',
    data:{labels:months.map(m=>m.name),datasets:[
      {label:'Revenue (R)',data:months.map(m=>m.rev),borderColor:'#001982',backgroundColor:'rgba(0,25,130,0.07)',borderWidth:2.5,fill:true,tension:0.3,pointBackgroundColor:'#001982',pointRadius:4},
      {label:'Net Profit (R)',data:months.map(m=>Math.max(0,m.netProfit)),borderColor:'#1a6b2e',backgroundColor:'rgba(26,107,46,0.06)',borderWidth:2,fill:true,tension:0.3,pointBackgroundColor:'#1a6b2e',pointRadius:3}
    ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:11}}}},scales:{x:{grid:{display:false},ticks:{font:{size:11}}},y:{grid:{color:'#eceef8'},ticks:{font:{size:11},callback:v=>'R'+v.toLocaleString('en-ZA')}}}}
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════

function renderSettings() {
  const s=DB.settings(); const expenses=DB.expenses();
  const sess=currentUser();
  const isAdmin=sess?.role==='admin';
  const tabs=[
    ['business','Business'],
    ...(isAdmin?[['financial','Financial'],['expenses','Expenses']]:[]),
    ['loyalty','Loyalty'],
    ['links','Quick Links'],
    ...(isAdmin?[['data','Data'],['users','Users & Access']]:[]),
  ];

  document.getElementById('content').innerHTML = `
    <div class="sec-header">
      <div><div class="sec-title">Settings</div><div class="sec-sub">Business configuration — changes flow through all calculations</div></div>
      <button class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
    </div>
    <div class="filter-tabs mb-16" style="margin-bottom:18px">
      ${tabs.map(([k,l])=>`<button class="filter-tab ${settingsTab===k?'active':''}" onclick="settingsTab='${k}';renderSettings()">${l}</button>`).join('')}
    </div>
    <div id="settingsContent"></div>
  `;

  if(settingsTab==='business') document.getElementById('settingsContent').innerHTML=`
    <div class="two-col">
      <div class="card">
        <div class="card-head"><span class="card-title">Business Details</span></div>
        <div class="card-body">
          <div class="form-grid one">
            <div class="field"><label>Business Name</label><input id="st-name" value="${esc(s.businessName)}"></div>
            <div class="field"><label>Slogan</label><input id="st-slogan" value="${esc(s.slogan||'')}"></div>
            <div class="field"><label>Location / Address</label><input id="st-loc" value="${esc(s.location)}"></div>
            <div class="field"><label>Trading Hours</label><input id="st-hours" value="${esc(s.tradingHours)}"></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Growth Targets</span></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="field"><label>Daily Cup Target</label><input id="st-cupt" type="number" value="${s.dailyCupTarget}"></div>
            <div class="field"><label>Weekly Revenue Target (R)</label><input id="st-wrevt" type="number" value="${s.weeklyRevenueTarget}"></div>
            <div class="field span2"><label>Monthly Net Profit Target (R)</label><input id="st-mnett" type="number" value="${s.monthlyNetTarget}"></div>
          </div>
        </div>
      </div>
    </div>`;

  if(settingsTab==='financial') document.getElementById('settingsContent').innerHTML=`
    <div class="card">
      <div class="card-head"><span class="card-title">Financial Settings</span></div>
      <div class="card-body">
        <div class="form-grid">
          <div class="field"><label>VAT Rate (%)</label><input id="st-vat" type="number" step="0.1" value="${s.vatRate}"></div>
          <div class="field"><label>Yoco Card Fee (%)</label><input id="st-yoco" type="number" step="0.1" value="${s.yocoFee}"></div>
          <div class="field"><label>Wastage / Spoilage (%)</label><input id="st-waste" type="number" step="0.1" value="${s.wastage}"></div>
          <div class="field"><label>Operating Days / Week</label><input id="st-opdays" type="number" min="1" max="7" value="${s.operatingDays}"></div>
        </div>
        <div class="info-note mt-16">
          ☕ <strong>Recipe costing</strong> is now automatic — go to <a href="#" onclick="navigate('recipes');return false" style="color:var(--navy);font-weight:700">Recipes & Menu</a> to set ingredient costs. The avg cost per cup is calculated from your active recipes.
          <br><br>Current avg cost per cup (from recipes): <strong>${R(calcAvgCostPerCup())}</strong>
        </div>
      </div>
    </div>`;

  if(settingsTab==='expenses') renderExpensesSettings();

  if(settingsTab==='loyalty') document.getElementById('settingsContent').innerHTML=`
    <div class="card">
      <div class="card-head"><span class="card-title">Loyalty Programme</span></div>
      <div class="card-body">
        <div class="form-grid">
          <div class="field"><label>Stamps for Free Drink</label><input id="st-loyal" type="number" min="1" value="${s.loyaltyFreeAt}"></div>
        </div>
        <div class="info-note mt-16">
          QR code → Google Form → paste into CRM. At <strong>${s.loyaltyFreeAt} stamps</strong> customers earn a free drink.
          They can <strong>use it immediately</strong> or <strong>bank it</strong> to save for later.
          Banked drinks accumulate and can be redeemed any time.
          Set the Google Form URL in Quick Links tab.
        </div>
      </div>
    </div>`;

  if(settingsTab==='links') document.getElementById('settingsContent').innerHTML=`
    <div class="card">
      <div class="card-head"><span class="card-title">Quick Link URLs</span></div>
      <div class="card-body">
        <div class="form-grid one">
          <div class="field"><label>📧 Mailchimp URL</label><input id="st-mc" value="${esc(s.mailchimpUrl)}"></div>
          <div class="field"><label>📸 Instagram URL</label><input id="st-ig" value="${esc(s.instagramUrl)}"></div>
          <div class="field"><label>🔗 Loyalty Google Form URL</label><input id="st-gf" placeholder="Paste your Google Form link here" value="${esc(s.googleFormUrl||'')}"></div>
          <div class="field"><label>💳 Yoco Portal URL</label><input id="st-yc" value="${esc(s.yocoUrl)}"></div>
          <div class="field"><label>💬 WhatsApp Business URL</label><input id="st-wa" value="${esc(s.whatsappUrl)}"></div>
          <div class="field"><label>📍 Google Business URL</label><input id="st-gb" value="${esc(s.googleBizUrl)}"></div>
          <div class="field"><label>🎨 Canva URL</label><input id="st-cv" value="${esc(s.canvaUrl)}"></div>
        </div>
      </div>
    </div>`;

  if(settingsTab==='data') document.getElementById('settingsContent').innerHTML=`
    <div class="card">
      <div class="card-head"><span class="card-title">Data Management</span></div>
      <div class="card-body">
        <div style="display:flex;flex-direction:column;gap:10px">
          <button class="btn btn-ghost" onclick="exportAll()">↓ Export all data (JSON backup)</button>
          <button class="btn btn-ghost" onclick="importData()">↑ Import data (JSON restore)</button>
          <hr class="divider">
          <button class="btn btn-ghost btn-sm" onclick="clearSampleData()">🧹 Clear sample customers &amp; daily log</button>
          <button class="btn btn-red btn-sm" onclick="clearData()">⚠ Clear ALL data</button>
        </div>
      </div>
    </div>`;

  if(settingsTab==='users') renderUsersSettings();
}

function renderUsersSettings() {
  const users=DB.users();
  document.getElementById('settingsContent').innerHTML=`
    <div class="sec-header" style="margin-bottom:16px">
      <div><div style="font-size:15px;font-weight:700;color:var(--navy)">Users & Access</div>
           <div style="font-size:12px;color:var(--muted)">Each user signs in with their own PIN to access the dashboard</div></div>
      <button class="btn btn-primary btn-sm" onclick="showAddUserModal()">+ Add User</button>
    </div>
    <div class="card">
      <div class="card-body np">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>PIN</th><th></th></tr></thead>
            <tbody>
              ${users.map((u,i)=>`
                <tr class="${i%2===0?'even':''}">
                  <td><span style="margin-right:6px">${esc(u.avatar||'☕')}</span><strong>${esc(u.name)}</strong></td>
                  <td><span class="badge ${u.role==='admin'?'badge-navy':'badge-cream'}">${u.role}</span></td>
                  <td><span style="letter-spacing:2px;font-family:monospace">••••••</span></td>
                  <td>
                    <button class="btn btn-ghost btn-xs" onclick="showEditUserModal('${u.id}')">Edit</button>
                    ${u.id!=='owner'?`<button class="btn btn-red btn-xs" onclick="deleteUser('${u.id}')">✕</button>`:''}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="info-note">🔐 PINs are stored locally. The Owner account cannot be deleted. Staff users cannot access this tab.</div>
  `;
}

function showAddUserModal() {
  openModal(`
    <div class="modal-head"><h2>Add User</h2></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field"><label>Name *</label><input id="nu-name" placeholder="e.g. Barista 1"></div>
        <div class="field"><label>PIN * (4–8 digits)</label><input id="nu-pin" type="password" inputmode="numeric" maxlength="8" placeholder="e.g. 1234"></div>
        <div class="field"><label>Role</label>
          <select id="nu-role"><option value="staff">Staff</option><option value="admin">Admin</option></select>
        </div>
        <div class="field"><label>Avatar (emoji)</label><input id="nu-avatar" maxlength="2" placeholder="☕" value="☕"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewUser()">Add User</button>
    </div>
  `);
}

function saveNewUser() {
  const name=(document.getElementById('nu-name')?.value||'').trim();
  const pin=(document.getElementById('nu-pin')?.value||'').trim();
  if(!name||!pin){toast('Name and PIN required','error');return;}
  if(!/^\d{4,8}$/.test(pin)){toast('PIN must be 4–8 digits','error');return;}
  const users=DB.users();
  if(users.find(u=>u.pin===pin)){toast('That PIN is already in use','error');return;}
  users.push({id:uuid(),name,pin,role:document.getElementById('nu-role')?.value||'staff',avatar:document.getElementById('nu-avatar')?.value||'☕'});
  DB.saveUsers(users); closeModal(); toast(`${name} added ✓`,'success'); renderUsersSettings();
}

function showEditUserModal(id) {
  const users=DB.users(); const u=users.find(x=>x.id===id); if(!u) return;
  openModal(`
    <div class="modal-head"><h2>Edit: ${esc(u.name)}</h2></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field"><label>Name</label><input id="eu-name" value="${esc(u.name)}"></div>
        <div class="field"><label>New PIN (leave blank to keep)</label><input id="eu-pin" type="password" inputmode="numeric" maxlength="8" placeholder="••••••"></div>
        <div class="field"><label>Role</label>
          <select id="eu-role">${u.id==='owner'?'<option value="admin" selected>Admin</option>':'<option value="staff" '+(u.role==='staff'?'selected':'')+'>Staff</option><option value="admin" '+(u.role==='admin'?'selected':'')+'>Admin</option>'}</select>
        </div>
        <div class="field"><label>Avatar</label><input id="eu-avatar" maxlength="2" value="${esc(u.avatar||'☕')}"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditUser('${id}')">Save</button>
    </div>
  `);
}

function saveEditUser(id) {
  const users=DB.users(); const u=users.find(x=>x.id===id); if(!u) return;
  const newPin=(document.getElementById('eu-pin')?.value||'').trim();
  if(newPin){
    if(!/^\d{4,8}$/.test(newPin)){toast('PIN must be 4–8 digits','error');return;}
    if(users.find(x=>x.id!==id&&x.pin===newPin)){toast('That PIN is already in use','error');return;}
    u.pin=newPin;
  }
  u.name=document.getElementById('eu-name')?.value?.trim()||u.name;
  u.avatar=document.getElementById('eu-avatar')?.value||u.avatar;
  if(u.id!=='owner') u.role=document.getElementById('eu-role')?.value||u.role;
  DB.saveUsers(users);
  // Refresh session name if editing self
  const sess=currentUser();
  if(sess?.userId===id) setSession(u);
  closeModal(); toast('User updated ✓','success'); renderUsersSettings();
}

function deleteUser(id) {
  if(id==='owner'){toast('Cannot delete the owner account','error');return;}
  if(!confirm('Remove this user?')) return;
  DB.saveUsers(DB.users().filter(u=>u.id!==id)); toast('User removed'); renderUsersSettings();
}

function renderExpensesSettings() {
  const expenses=DB.expenses();
  const total=expenses.filter(e=>e.active).reduce((a,e)=>a+(e.amount||0),0);
  const cats=[...new Set(expenses.map(e=>e.cat))];

  document.getElementById('settingsContent').innerHTML=`
    <div class="sec-header" style="margin-bottom:16px">
      <div>
        <div style="font-size:15px;font-weight:700;color:var(--navy)">Monthly Fixed Expenses</div>
        <div style="font-size:12px;color:var(--muted)">These feed directly into your P&L calculations</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="badge badge-navy" style="font-size:13px;padding:6px 12px">Total: ${R(total)} / month</span>
        <button class="btn btn-primary btn-sm" onclick="showAddExpenseModal()">+ Add Expense</button>
      </div>
    </div>

    <div class="card">
      <div class="card-body np">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Expense</th><th>Category</th><th>Monthly Amount</th><th>Weekly Share</th><th>Active</th><th></th></tr></thead>
            <tbody>
              ${expenses.map((e,i)=>`
                <tr class="${i%2===0?'even':''} ${!e.active?'':''}">
                  <td style="${!e.active?'opacity:.45;text-decoration:line-through':''}"><strong>${esc(e.name)}</strong></td>
                  <td><span class="badge badge-cream">${esc(e.cat)}</span></td>
                  <td class="${e.active?'fw-bold text-navy':'text-muted'}" style="${!e.active?'opacity:.45;text-decoration:line-through':''}">${R(e.amount)}</td>
                  <td class="text-muted">${e.active?R(e.amount/4.33):'—'}</td>
                  <td>
                    <label class="toggle-wrap" onclick="toggleExpense('${e.id}')">
                      <input type="checkbox" ${e.active?'checked':''} onchange="toggleExpense('${e.id}')"> Active
                    </label>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-xs" onclick="showEditExpenseModal('${e.id}')">Edit</button>
                    <button class="btn btn-red btn-xs" onclick="deleteExpense('${e.id}')">✕</button>
                  </td>
                </tr>`).join('')}
            </tbody>
            <tfoot>
              <tr class="pnl-row-total">
                <td colspan="2"><strong>TOTAL ACTIVE</strong></td>
                <td class="fw-bold">${R(total)}</td>
                <td class="fw-bold">${R(total/4.33)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <div class="info-note">
      💡 Toggle expenses on/off to model different scenarios. Weekly P&L divides monthly amounts by 4.33 weeks.
      <strong>Tip:</strong> Add seasonal or one-off costs here to track their impact.
    </div>
  `;
}

function showAddExpenseModal() {
  openModal(`
    <div class="modal-head"><h2>Add Expense</h2><p>Monthly fixed cost</p></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field span2"><label>Expense Name *</label><input id="ae-name" placeholder="e.g. Accountant fees"></div>
        <div class="field"><label>Category</label>
          <select id="ae-cat"><option>Labour</option><option>Rent</option><option>Equipment</option><option>Operations</option><option>Cost of Sales</option><option>Marketing</option><option>Finance</option><option>Other</option></select>
        </div>
        <div class="field"><label>Monthly Amount (R)</label><input id="ae-amount" type="number" min="0" step="0.01" placeholder="0.00"></div>
        <div class="field"><label>Active</label><div style="margin-top:8px"><label class="toggle-wrap"><input type="checkbox" id="ae-active" checked> Include in P&L</label></div></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewExpense()">Add Expense</button>
    </div>
  `);
}

function saveNewExpense() {
  const name=document.getElementById('ae-name')?.value?.trim();
  if(!name){ toast('Name required','error'); return; }
  const exp={id:uuid(),name,cat:document.getElementById('ae-cat')?.value||'Other',
    amount:parseFloat(document.getElementById('ae-amount')?.value)||0,
    active:document.getElementById('ae-active')?.checked!==false};
  const list=DB.expenses(); list.push(exp); DB.saveExpenses(list);
  closeModal(); toast(`${name} added ✓`,'success'); renderSettings();
}

function showEditExpenseModal(id) {
  const list=DB.expenses(); const exp=list.find(x=>x.id===id); if(!exp) return;
  openModal(`
    <div class="modal-head"><h2>Edit: ${esc(exp.name)}</h2></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field span2"><label>Name</label><input id="ee-name" value="${esc(exp.name)}"></div>
        <div class="field"><label>Category</label>
          <select id="ee-cat">${['Labour','Rent','Equipment','Operations','Cost of Sales','Marketing','Finance','Other'].map(c=>`<option ${exp.cat===c?'selected':''}>${c}</option>`).join('')}</select>
        </div>
        <div class="field"><label>Monthly Amount (R)</label><input id="ee-amount" type="number" step="0.01" value="${exp.amount}"></div>
        <div class="field"><label>Active</label><div style="margin-top:8px"><label class="toggle-wrap"><input type="checkbox" id="ee-active" ${exp.active?'checked':''}> Include in P&L</label></div></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditExpense('${id}')">Save</button>
    </div>
  `);
}

function saveEditExpense(id) {
  const list=DB.expenses(); const exp=list.find(x=>x.id===id); if(!exp) return;
  exp.name=document.getElementById('ee-name')?.value?.trim()||exp.name;
  exp.cat=document.getElementById('ee-cat')?.value||exp.cat;
  exp.amount=parseFloat(document.getElementById('ee-amount')?.value)||0;
  exp.active=document.getElementById('ee-active')?.checked!==false;
  DB.saveExpenses(list); closeModal(); toast('Expense updated ✓','success'); renderSettings();
}

function toggleExpense(id) {
  const list=DB.expenses(); const exp=list.find(x=>x.id===id); if(!exp) return;
  exp.active=!exp.active; DB.saveExpenses(list); renderSettings();
}

function deleteExpense(id) {
  if(!confirm('Remove this expense?')) return;
  DB.saveExpenses(DB.expenses().filter(e=>e.id!==id)); toast('Expense removed'); renderSettings();
}

function saveSettings() {
  const s=DB.settings(); const get=id=>document.getElementById(id)?.value; const getN=id=>parseFloat(document.getElementById(id)?.value)||0;
  const updated={...s};
  if(get('st-name'))   updated.businessName=get('st-name');
  if(get('st-slogan')) updated.slogan=get('st-slogan');
  if(get('st-loc'))    updated.location=get('st-loc');
  if(get('st-hours'))  updated.tradingHours=get('st-hours');
  if(document.getElementById('st-vat'))    updated.vatRate=getN('st-vat');
  if(document.getElementById('st-yoco'))   updated.yocoFee=getN('st-yoco');
  if(document.getElementById('st-waste'))  updated.wastage=getN('st-waste');
  if(document.getElementById('st-opdays')) updated.operatingDays=getN('st-opdays');
  if(document.getElementById('st-cupt'))   updated.dailyCupTarget=getN('st-cupt');
  if(document.getElementById('st-wrevt'))  updated.weeklyRevenueTarget=getN('st-wrevt');
  if(document.getElementById('st-mnett'))  updated.monthlyNetTarget=getN('st-mnett');
  if(document.getElementById('st-loyal'))  updated.loyaltyFreeAt=parseInt(get('st-loyal'))||10;
  if(document.getElementById('st-mc'))  updated.mailchimpUrl=get('st-mc');
  if(document.getElementById('st-ig'))  updated.instagramUrl=get('st-ig');
  if(document.getElementById('st-gf'))  updated.googleFormUrl=get('st-gf');
  if(document.getElementById('st-yc'))  updated.yocoUrl=get('st-yc');
  if(document.getElementById('st-wa'))  updated.whatsappUrl=get('st-wa');
  if(document.getElementById('st-gb'))  updated.googleBizUrl=get('st-gb');
  if(document.getElementById('st-cv'))  updated.canvaUrl=get('st-cv');
  DB.saveSettings(updated); toast('Settings saved ✓','success');
}

// ═══════════════════════════════════════════════════════════════════════
// CHECKLISTS
// ═══════════════════════════════════════════════════════════════════════

let checklistTab = 'opening';

function renderChecklist() {
  const today = todayStr();
  const log = DB.checklistLog();
  const items = DB.checklistItems();
  const todayLog = log.find(l=>l.date===today&&l.type===checklistTab)||{items:{}};
  const list = items[checklistTab]||[];
  const doneCount = list.filter(i=>todayLog.items[i.id]).length;
  const pct = list.length ? Math.round((doneCount/list.length)*100) : 0;

  document.getElementById('content').innerHTML=`
    <div class="sec-header">
      <div><div class="sec-title">Checklists</div><div class="sec-sub">Daily opening & closing — ${new Date().toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long'})}</div></div>
    </div>
    <div class="filter-tabs mb-16" style="margin-bottom:18px">
      <button class="filter-tab ${checklistTab==='opening'?'active':''}" onclick="checklistTab='opening';renderChecklist()">🌅 Opening</button>
      <button class="filter-tab ${checklistTab==='closing'?'active':''}" onclick="checklistTab='closing';renderChecklist()">🌙 Closing</button>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-head navy">
          <span class="card-title">Today — ${checklistTab==='opening'?'Opening':'Closing'}</span>
          <span class="badge badge-cream">${doneCount}/${list.length} done</span>
        </div>
        <div class="card-body">
          <div class="check-progress">
            <div class="progress-bar-bg" style="flex:1"><div class="progress-bar-fill ${pct===100?'green':pct>=70?'amber':'red'}" style="width:${pct}%"></div></div>
            <span class="check-pct">${pct}%</span>
          </div>
          <div id="checklistItems">
            ${list.map(item=>`
              <div class="checklist-item ${todayLog.items[item.id]?'done':''}" id="ci-${item.id}">
                <input type="checkbox" id="cb-${item.id}" ${todayLog.items[item.id]?'checked':''} onchange="toggleCheckItem('${item.id}')">
                <label for="cb-${item.id}">${esc(item.text)}</label>
                <button class="ci-del" onclick="deleteCheckItem('${item.id}')">✕</button>
              </div>`).join('')}
          </div>
          <div style="margin-top:16px;display:flex;gap:8px">
            <input id="newCheckText" placeholder="Add item…" style="flex:1;padding:8px 12px;border:1.5px solid var(--border);border-radius:7px;font-family:inherit;font-size:13px" onkeydown="if(event.key==='Enter')addCheckItem()">
            <button class="btn btn-primary btn-sm" onclick="addCheckItem()">+ Add</button>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">Recent Completions</span></div>
        <div class="card-body np">
          ${log.filter(l=>l.type===checklistTab).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7).map((l,i)=>{
            const it=items[checklistTab]||[];
            const done=it.filter(x=>l.items[x.id]).length;
            return `<div class="recent-item" style="padding:10px 20px">
              <span class="ri-date">${fmtDateShort(l.date)}</span>
              <span>${done}/${it.length} items</span>
              <span class="${done===it.length?'text-green':'text-amber'}">${done===it.length?'✓ Complete':'Partial'}</span>
            </div>`;
          }).join('') || '<div class="empty-state" style="padding:24px"><div class="es-icon">✓</div><div class="es-text">No history yet</div></div>'}
        </div>
      </div>
    </div>
  `;
}

function toggleCheckItem(id) {
  const today=todayStr(), log=DB.checklistLog();
  let entry=log.find(l=>l.date===today&&l.type===checklistTab);
  if(!entry){ entry={date:today,type:checklistTab,items:{}}; log.push(entry); }
  entry.items[id]=!entry.items[id];
  DB.saveChecklistLog(log); renderChecklist();
}

function addCheckItem() {
  const text=document.getElementById('newCheckText')?.value?.trim(); if(!text) return;
  const items=DB.checklistItems();
  items[checklistTab]=[...(items[checklistTab]||[]),{id:uuid(),text}];
  DB.saveChecklistItems(items); renderChecklist();
}

function deleteCheckItem(id) {
  const items=DB.checklistItems();
  items[checklistTab]=(items[checklistTab]||[]).filter(i=>i.id!==id);
  DB.saveChecklistItems(items); renderChecklist();
}

// ═══════════════════════════════════════════════════════════════════════
// PURCHASE LOG
// ═══════════════════════════════════════════════════════════════════════

function renderOrders() {
  const orders=[...DB.orders()].sort((a,b)=>b.date.localeCompare(a.date));
  const suppliers=DB.suppliers();
  const totalSpend=orders.reduce((a,o)=>a+(o.total||0),0);

  document.getElementById('content').innerHTML=`
    <div class="sec-header">
      <div><div class="sec-title">Purchase Log</div><div class="sec-sub">Track every order — supplier, items, cost</div></div>
      <button class="btn btn-primary" onclick="showAddOrderModal()">+ Log Purchase</button>
    </div>
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
      <div class="kpi-card dark"><div class="kpi-label">Total Spend</div><div class="kpi-value" style="font-size:18px">${R(totalSpend)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Orders Logged</div><div class="kpi-value">${orders.length}</div></div>
      <div class="kpi-card"><div class="kpi-label">Last Order</div><div class="kpi-value" style="font-size:15px">${orders[0]?fmtDateShort(orders[0].date):'—'}</div></div>
    </div>
    <div class="card">
      <div class="card-body np">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Supplier</th><th>Items</th><th>Total</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              ${orders.length?orders.map((o,i)=>{
                const sup=suppliers.find(s=>s.id===o.supplierId);
                const itemCount=(o.items||[]).length;
                return `<tr class="${i%2===0?'even':''}" style="cursor:pointer" onclick="showOrderDetail('${o.id}')">
                  <td><strong>${fmtDateShort(o.date)}</strong></td>
                  <td>${esc(sup?.name||o.supplierName||'—')}</td>
                  <td class="text-muted">${itemCount} line${itemCount!==1?'s':''}</td>
                  <td class="fw-bold text-navy">${R(o.total||0)}</td>
                  <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--muted)">${esc(o.notes||'')}</td>
                  <td><button class="btn btn-red btn-xs" onclick="event.stopPropagation();deleteOrder('${o.id}')">✕</button></td>
                </tr>`;
              }).join(''):`<tr><td colspan="6"><div class="empty-state"><div class="es-icon">⊕</div><div class="es-text">No purchases logged yet</div></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function showAddOrderModal() {
  const suppliers=DB.suppliers();
  openModal(`
    <div class="modal-head"><h2>Log Purchase</h2><p>Record an order or stock purchase</p></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field"><label>Date *</label><input id="or-date" type="date" value="${todayStr()}"></div>
        <div class="field"><label>Supplier</label>
          <select id="or-sup">
            <option value="">— Select or type below —</option>
            ${suppliers.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field span2"><label>Supplier Name (if not listed)</label><input id="or-supname" placeholder="e.g. Pick n Pay Stellenbosch"></div>
      </div>
      <hr class="divider">
      <div class="card-title mb-8" style="margin-bottom:8px">Items Purchased</div>
      <div id="or-items-list" class="order-items-list">
        <div class="order-item-row">
          <input placeholder="Item (e.g. Coffee beans)" class="oi-name" style="flex:2">
          <input type="number" placeholder="Qty" class="oi-qty" style="width:70px" oninput="recalcOrderTotal()">
          <input placeholder="Unit (kg/L)" class="oi-unit" style="width:60px">
          <input type="number" placeholder="R/unit" class="oi-price" style="width:80px" oninput="recalcOrderTotal()">
          <button class="oi-del" onclick="this.parentElement.remove();recalcOrderTotal()">✕</button>
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="addOrderItemRow()">+ Add item</button>
      <div class="order-total-row"><span>Total</span><span id="or-total">R 0,00</span></div>
      <div class="form-grid one" style="margin-top:4px">
        <div class="field"><label>Notes</label><input id="or-notes" placeholder="Invoice #, special price, etc."></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveOrder()">Save Order</button>
    </div>
  `);
}

function addOrderItemRow() {
  const list=document.getElementById('or-items-list'); if(!list) return;
  const row=document.createElement('div'); row.className='order-item-row';
  row.innerHTML=`<input placeholder="Item" class="oi-name" style="flex:2"><input type="number" placeholder="Qty" class="oi-qty" style="width:70px" oninput="recalcOrderTotal()"><input placeholder="Unit" class="oi-unit" style="width:60px"><input type="number" placeholder="R/unit" class="oi-price" style="width:80px" oninput="recalcOrderTotal()"><button class="oi-del" onclick="this.parentElement.remove();recalcOrderTotal()">✕</button>`;
  list.appendChild(row);
}

function recalcOrderTotal() {
  let total=0;
  document.querySelectorAll('#or-items-list .order-item-row').forEach(row=>{
    const qty=parseFloat(row.querySelector('.oi-qty')?.value)||0;
    const price=parseFloat(row.querySelector('.oi-price')?.value)||0;
    total+=qty*price;
  });
  const el=document.getElementById('or-total'); if(el) el.textContent=R(total);
}

function saveOrder() {
  const date=document.getElementById('or-date')?.value; if(!date){toast('Date required','error');return;}
  const supplierId=document.getElementById('or-sup')?.value||'';
  const supplierName=document.getElementById('or-supname')?.value?.trim()||'';
  const items=[];
  document.querySelectorAll('#or-items-list .order-item-row').forEach(row=>{
    const name=row.querySelector('.oi-name')?.value?.trim();
    if(!name) return;
    const qty=parseFloat(row.querySelector('.oi-qty')?.value)||0;
    const unit=row.querySelector('.oi-unit')?.value?.trim()||'';
    const price=parseFloat(row.querySelector('.oi-price')?.value)||0;
    items.push({name,qty,unit,price,total:qty*price});
  });
  const total=items.reduce((a,i)=>a+i.total,0);
  const order={id:uuid(),date,supplierId,supplierName,items,total,notes:document.getElementById('or-notes')?.value?.trim()||''};
  const list=DB.orders(); list.push(order); DB.saveOrders(list);
  closeModal(); toast('Purchase logged ✓','success'); renderOrders();
}

function showOrderDetail(id) {
  const order=DB.orders().find(o=>o.id===id); if(!order) return;
  const sup=DB.suppliers().find(s=>s.id===order.supplierId);
  openModal(`
    <div class="modal-head"><h2>${fmtDate(order.date)}</h2><p>${esc(sup?.name||order.supplierName||'Unknown supplier')}</p></div>
    <div class="modal-content">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>R/Unit</th><th>Total</th></tr></thead>
          <tbody>
            ${(order.items||[]).map((it,i)=>`<tr class="${i%2===0?'even':''}"><td>${esc(it.name)}</td><td>${it.qty}</td><td>${esc(it.unit)}</td><td>${R(it.price)}</td><td class="fw-bold">${R(it.total)}</td></tr>`).join('')}
          </tbody>
          <tfoot><tr class="pnl-row-total"><td colspan="4"><strong>TOTAL</strong></td><td class="fw-bold">${R(order.total||0)}</td></tr></tfoot>
        </table>
      </div>
      ${order.notes?`<div class="info-note mt-16">${esc(order.notes)}</div>`:''}
    </div>
  `);
}

function deleteOrder(id) {
  if(!confirm('Delete this order record?')) return;
  DB.saveOrders(DB.orders().filter(o=>o.id!==id)); toast('Order deleted'); renderOrders();
}

// ═══════════════════════════════════════════════════════════════════════
// SUPPLIERS
// ═══════════════════════════════════════════════════════════════════════

function renderSuppliers() {
  const suppliers=DB.suppliers();

  document.getElementById('content').innerHTML=`
    <div class="sec-header">
      <div><div class="sec-title">Suppliers</div><div class="sec-sub">Contact directory — phone numbers, lead times, minimum orders</div></div>
      <button class="btn btn-primary" onclick="showAddSupplierModal()">+ Add Supplier</button>
    </div>
    <div class="card">
      <div class="card-body np">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Supplier</th><th>Contact</th><th>Phone</th><th>Products</th><th>Min Order</th><th>Lead</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              ${suppliers.length?suppliers.map((s,i)=>`
                <tr class="${i%2===0?'even':''}">
                  <td><strong>${esc(s.name)}</strong>${s.email?`<div style="font-size:11px;color:var(--muted)">${esc(s.email)}</div>`:''}</td>
                  <td>${esc(s.contact||'—')}</td>
                  <td><a href="tel:${esc(s.phone)}" style="color:var(--navy);text-decoration:none;font-weight:600">${esc(s.phone||'—')}</a></td>
                  <td>${esc(s.products||'—')}</td>
                  <td class="text-muted">${esc(s.minOrder||'—')}</td>
                  <td class="text-center text-muted">${s.leadDays!=null?s.leadDays+'d':'—'}</td>
                  <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--muted)">${esc(s.notes||'')}</td>
                  <td>
                    <button class="btn btn-ghost btn-xs" onclick="showEditSupplierModal('${s.id}')">Edit</button>
                    <button class="btn btn-red btn-xs" onclick="deleteSupplier('${s.id}')">✕</button>
                  </td>
                </tr>`).join(''):`<tr><td colspan="8"><div class="empty-state"><div class="es-icon">◈</div><div class="es-text">No suppliers yet</div></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function showAddSupplierModal() {
  openModal(`
    <div class="modal-head"><h2>Add Supplier</h2></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field span2"><label>Business Name *</label><input id="sv-name" placeholder="e.g. Woolworths Food"></div>
        <div class="field"><label>Contact Name</label><input id="sv-contact" placeholder="e.g. Sandra"></div>
        <div class="field"><label>Phone</label><input id="sv-phone" type="tel" placeholder="082 000 0000"></div>
        <div class="field span2"><label>Email</label><input id="sv-email" type="email" placeholder="orders@supplier.co.za"></div>
        <div class="field span2"><label>Products Supplied</label><input id="sv-products" placeholder="e.g. Milk, oat milk, bakery items"></div>
        <div class="field"><label>Min Order</label><input id="sv-min" placeholder="e.g. R 500 or 1 case"></div>
        <div class="field"><label>Lead Time (days)</label><input id="sv-lead" type="number" min="0" placeholder="2"></div>
        <div class="field span2"><label>Notes</label><input id="sv-notes" placeholder="Delivery days, account number, etc."></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewSupplier()">Save</button>
    </div>
  `);
}

function saveNewSupplier() {
  const name=document.getElementById('sv-name')?.value?.trim(); if(!name){toast('Name required','error');return;}
  const s={id:uuid(),name,contact:document.getElementById('sv-contact')?.value?.trim()||'',
    phone:document.getElementById('sv-phone')?.value?.trim()||'',
    email:document.getElementById('sv-email')?.value?.trim()||'',
    products:document.getElementById('sv-products')?.value?.trim()||'',
    minOrder:document.getElementById('sv-min')?.value?.trim()||'',
    leadDays:parseInt(document.getElementById('sv-lead')?.value)||0,
    notes:document.getElementById('sv-notes')?.value?.trim()||''};
  const list=DB.suppliers(); list.push(s); DB.saveSuppliers(list);
  closeModal(); toast(`${name} added ✓`,'success'); renderSuppliers();
}

function showEditSupplierModal(id) {
  const list=DB.suppliers(); const s=list.find(x=>x.id===id); if(!s) return;
  openModal(`
    <div class="modal-head"><h2>Edit: ${esc(s.name)}</h2></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field span2"><label>Name</label><input id="ev-name" value="${esc(s.name)}"></div>
        <div class="field"><label>Contact</label><input id="ev-contact" value="${esc(s.contact||'')}"></div>
        <div class="field"><label>Phone</label><input id="ev-phone" value="${esc(s.phone||'')}"></div>
        <div class="field span2"><label>Email</label><input id="ev-email" value="${esc(s.email||'')}"></div>
        <div class="field span2"><label>Products</label><input id="ev-products" value="${esc(s.products||'')}"></div>
        <div class="field"><label>Min Order</label><input id="ev-min" value="${esc(s.minOrder||'')}"></div>
        <div class="field"><label>Lead Days</label><input id="ev-lead" type="number" value="${s.leadDays||0}"></div>
        <div class="field span2"><label>Notes</label><input id="ev-notes" value="${esc(s.notes||'')}"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditSupplier('${id}')">Save</button>
    </div>
  `);
}

function saveEditSupplier(id) {
  const list=DB.suppliers(); const s=list.find(x=>x.id===id); if(!s) return;
  s.name=document.getElementById('ev-name')?.value?.trim()||s.name;
  s.contact=document.getElementById('ev-contact')?.value?.trim()||'';
  s.phone=document.getElementById('ev-phone')?.value?.trim()||'';
  s.email=document.getElementById('ev-email')?.value?.trim()||'';
  s.products=document.getElementById('ev-products')?.value?.trim()||'';
  s.minOrder=document.getElementById('ev-min')?.value?.trim()||'';
  s.leadDays=parseInt(document.getElementById('ev-lead')?.value)||0;
  s.notes=document.getElementById('ev-notes')?.value?.trim()||'';
  DB.saveSuppliers(list); closeModal(); toast('Supplier updated ✓','success'); renderSuppliers();
}

function deleteSupplier(id) {
  if(!confirm('Remove this supplier?')) return;
  DB.saveSuppliers(DB.suppliers().filter(s=>s.id!==id)); toast('Supplier removed'); renderSuppliers();
}

// ═══════════════════════════════════════════════════════════════════════
// MAINTENANCE LOG
// ═══════════════════════════════════════════════════════════════════════

function renderMaintenance() {
  const items=[...DB.maintenance()].sort((a,b)=>(a.nextDue||'').localeCompare(b.nextDue||''));
  const today=todayStr();
  const overdue=items.filter(i=>i.nextDue&&i.nextDue<today).length;
  const dueSoon=items.filter(i=>i.nextDue&&i.nextDue>=today&&i.nextDue<=addDays(today,30)&&i.nextDue>=today).length;

  document.getElementById('content').innerHTML=`
    <div class="sec-header">
      <div><div class="sec-title">Maintenance Log</div><div class="sec-sub">Equipment service dates, calibration, safety checks</div></div>
      <button class="btn btn-primary" onclick="showAddMaintenanceModal()">+ Log Service</button>
    </div>
    ${overdue>0?`<div class="stock-alert-banner mb-16"><span class="sab-label">⚠ ${overdue} item${overdue!==1?'s':''} overdue for service</span></div>`:''}
    <div class="card">
      <div class="card-body np">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Equipment</th><th>Service Type</th><th>Last Done</th><th>Next Due</th><th>Status</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              ${items.length?items.map((it,i)=>{
                const od=it.nextDue&&it.nextDue<today;
                const ds=it.nextDue&&it.nextDue>=today&&it.nextDue<=addDays(today,30);
                return `<tr class="${od?'overdue-row':ds?'due-soon-row':i%2===0?'even':''}">
                  <td><strong>${esc(it.equipment)}</strong></td>
                  <td>${esc(it.type)}</td>
                  <td>${fmtDateShort(it.date)}</td>
                  <td>${it.nextDue?fmtDateShort(it.nextDue):'—'}</td>
                  <td>${od?'<span class="alert-pill">⚠ Overdue</span>':ds?'<span class="warn-pill">Due soon</span>':'<span class="ok-pill">✓ OK</span>'}</td>
                  <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;color:var(--muted)">${esc(it.notes||'')}</td>
                  <td>
                    <button class="btn btn-ghost btn-xs" onclick="showEditMaintenanceModal('${it.id}')">Edit</button>
                    <button class="btn btn-red btn-xs" onclick="deleteMaintenance('${it.id}')">✕</button>
                  </td>
                </tr>`;
              }).join(''):`<tr><td colspan="7"><div class="empty-state"><div class="es-icon">⚒</div><div class="es-text">No maintenance records yet</div></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="info-note">⚙ Keep records of every service — espresso machine descale, grinder burr replacement, gas regulator safety check. Set a <strong>Next Due</strong> date to get overdue alerts.</div>
  `;
}

function showAddMaintenanceModal() {
  openModal(`
    <div class="modal-head"><h2>Log Service / Maintenance</h2></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field"><label>Equipment *</label>
          <select id="mt-eq">
            <option>Espresso Machine</option><option>Grinder</option><option>Gas regulator</option>
            <option>Fridge / chiller</option><option>POS terminal</option><option>Generator</option><option>Other</option>
          </select>
        </div>
        <div class="field"><label>Service Type *</label>
          <select id="mt-type">
            <option>Full service</option><option>Calibration & clean</option><option>Safety check</option>
            <option>Descale</option><option>Repair</option><option>Part replacement</option><option>Inspection</option>
          </select>
        </div>
        <div class="field"><label>Date Done</label><input id="mt-date" type="date" value="${todayStr()}"></div>
        <div class="field"><label>Next Due</label><input id="mt-next" type="date"></div>
        <div class="field span2"><label>Notes</label><input id="mt-notes" placeholder="Technician, cost, parts replaced…"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveNewMaintenance()">Save</button>
    </div>
  `);
}

function saveNewMaintenance() {
  const equipment=document.getElementById('mt-eq')?.value; if(!equipment){toast('Equipment required','error');return;}
  const entry={id:uuid(),equipment,type:document.getElementById('mt-type')?.value||'',
    date:document.getElementById('mt-date')?.value||todayStr(),
    nextDue:document.getElementById('mt-next')?.value||'',
    notes:document.getElementById('mt-notes')?.value?.trim()||''};
  const list=DB.maintenance(); list.push(entry); DB.saveMaintenance(list);
  closeModal(); toast('Service logged ✓','success'); renderMaintenance();
}

function showEditMaintenanceModal(id) {
  const list=DB.maintenance(); const it=list.find(x=>x.id===id); if(!it) return;
  openModal(`
    <div class="modal-head"><h2>Edit: ${esc(it.equipment)}</h2></div>
    <div class="modal-content">
      <div class="form-grid">
        <div class="field"><label>Equipment</label><input id="em-eq" value="${esc(it.equipment)}"></div>
        <div class="field"><label>Service Type</label><input id="em-type" value="${esc(it.type)}"></div>
        <div class="field"><label>Date Done</label><input id="em-date" type="date" value="${esc(it.date||'')}"></div>
        <div class="field"><label>Next Due</label><input id="em-next" type="date" value="${esc(it.nextDue||'')}"></div>
        <div class="field span2"><label>Notes</label><input id="em-notes" value="${esc(it.notes||'')}"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditMaintenance('${id}')">Save</button>
    </div>
  `);
}

function saveEditMaintenance(id) {
  const list=DB.maintenance(); const it=list.find(x=>x.id===id); if(!it) return;
  it.equipment=document.getElementById('em-eq')?.value?.trim()||it.equipment;
  it.type=document.getElementById('em-type')?.value?.trim()||it.type;
  it.date=document.getElementById('em-date')?.value||it.date;
  it.nextDue=document.getElementById('em-next')?.value||'';
  it.notes=document.getElementById('em-notes')?.value?.trim()||'';
  DB.saveMaintenance(list); closeModal(); toast('Updated ✓','success'); renderMaintenance();
}

function deleteMaintenance(id) {
  if(!confirm('Remove this record?')) return;
  DB.saveMaintenance(DB.maintenance().filter(i=>i.id!==id)); toast('Record removed'); renderMaintenance();
}

// ═══════════════════════════════════════════════════════════════════════
// DATA MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

function exportAll() {
  const data={customers:DB.customers(),stock:DB.stock(),stockLog:DB.stockLog(),dailyLog:DB.dailyLog(),
    settings:DB.settings(),expenses:DB.expenses(),ingredients:DB.ingredients(),menuItems:DB.menuItems(),
    checklistItems:DB.checklistItems(),checklistLog:DB.checklistLog(),
    orders:DB.orders(),suppliers:DB.suppliers(),maintenance:DB.maintenance(),
    exported:new Date().toISOString()};
  const a=document.createElement('a');
  a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data,null,2));
  a.download='Apostello_Backup_'+todayStr()+'.json'; a.click(); toast('Full backup exported');
}

function importData() {
  const input=document.createElement('input'); input.type='file'; input.accept='.json';
  input.onchange=e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const data=JSON.parse(ev.target.result);
        if(data.customers)      DB.saveCustomers(data.customers);
        if(data.stock)          DB.saveStock(data.stock);
        if(data.stockLog)       DB.saveStockLog(data.stockLog);
        if(data.dailyLog)       DB.saveDailyLog(data.dailyLog);
        if(data.settings)       DB.saveSettings(data.settings);
        if(data.expenses)       DB.saveExpenses(data.expenses);
        if(data.ingredients)    DB.saveIngredients(data.ingredients);
        if(data.menuItems)      DB.saveMenuItems(data.menuItems);
        if(data.checklistItems) DB.saveChecklistItems(data.checklistItems);
        if(data.checklistLog)   DB.saveChecklistLog(data.checklistLog);
        if(data.orders)         DB.saveOrders(data.orders);
        if(data.suppliers)      DB.saveSuppliers(data.suppliers);
        if(data.maintenance)    DB.saveMaintenance(data.maintenance);
        toast('Data imported successfully ✓','success'); navigate('hub');
      }catch(err){ toast('Invalid backup file','error'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearSampleData() {
  if(!confirm('Clear all sample customers and daily log entries? Real data you have entered will also be removed.')) return;
  DB.saveCustomers([]); DB.saveDailyLog([]);
  toast('Sample data cleared ✓','success'); navigate('hub');
}

function clearData() {
  if(!confirm('⚠ This will permanently delete ALL data. Are you sure?')) return;
  if(!confirm('Last chance — this cannot be undone. Delete everything?')) return;
  // Write empty values via DB so Supabase is cleared in cloud mode
  DB.saveCustomers([]); DB.saveStock([]); DB.saveStockLog([]); DB.saveDailyLog([]);
  DB.saveSettings({}); DB.saveExpenses([]); DB.saveIngredients([]); DB.saveMenuItems([]);
  DB.saveChecklistItems({}); DB.saveChecklistLog([]); DB.saveOrders([]);
  DB.saveSuppliers([]); DB.saveMaintenance([]);
  // Clear localStorage residuals
  ['customers','stock','stockLog','dailyLog','settings','expenses','ingredients','menuItems',
   'checklistItems','checklistLog','orders','suppliers','maintenance',
   'session','sb_collapsed'].forEach(k=>localStorage.removeItem('apc_'+k));
  toast('All data cleared — reloading…','error');
  setTimeout(()=>location.reload(), 1500);
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL / TOAST / SIDEBAR
// ═══════════════════════════════════════════════════════════════════════

function openModal(html, size='') {
  document.getElementById('modalBody').innerHTML=html;
  const box=document.getElementById('modalBox');
  box.className='modal-box'+(size==='wide'?' wide':'');
  document.getElementById('modalBg').classList.add('open');
}
function closeModal() {
  document.getElementById('modalBg').classList.remove('open');
  document.getElementById('modalBody').innerHTML='';
}

let toastTimer=null;
function toast(msg,type='') {
  const el=document.getElementById('toast');
  el.textContent=msg; el.className='toast show '+type;
  if(toastTimer) clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),3200);
}

function openSidebar()  { document.getElementById('sidebar').classList.add('open');    document.querySelector('.sidebar-overlay').classList.add('open'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.querySelector('.sidebar-overlay').classList.remove('open'); }

// ═══════════════════════════════════════════════════════════════════════
// SEED
// ═══════════════════════════════════════════════════════════════════════

function migrateStockIngredientLinks() {
  // Add ingredientId/convFactor to existing stock items that are missing them,
  // by matching against the STOCK_DEFAULTS pre-linked entries.
  const stock = DB.stock();
  const defaults = STOCK_DEFAULTS;
  let changed = false;
  stock.forEach(item => {
    if(item.ingredientId) return; // already linked
    const def = defaults.find(d => d.name.toLowerCase() === item.name.toLowerCase());
    if(def?.ingredientId) {
      item.ingredientId = def.ingredientId;
      item.convFactor = def.convFactor || 1;
      changed = true;
    }
  });
  if(changed) DB.saveStock(stock);
}

function seedIfEmpty() {
  // In Supabase mode, only seed a collection if the key has never been written
  // (DB.has returns false). An empty array is a valid user choice — don't restore
  // deleted items. In localStorage mode (no DB.has), fall back to length check.
  const cloud = typeof DB.has === 'function';
  const needs = (key, len) => cloud ? !DB.has(key) : !len;

  if(needs('menuItems',    DB.menuItems().length))    DB.saveMenuItems(JSON.parse(JSON.stringify(MENU_DEFAULTS)));
  if(needs('ingredients',  DB.ingredients().length))  DB.saveIngredients(JSON.parse(JSON.stringify(INGREDIENT_DEFAULTS)));
  if(needs('stock',        DB.stock().length))        DB.saveStock(JSON.parse(JSON.stringify(STOCK_DEFAULTS)));
  if(needs('expenses',     DB.expenses().length))     DB.saveExpenses(JSON.parse(JSON.stringify(DEFAULT_EXPENSES)));
  if(needs('suppliers',    DB.suppliers().length))    DB.saveSuppliers(JSON.parse(JSON.stringify(SUPPLIER_DEFAULTS)));
  if(needs('maintenance',  DB.maintenance().length))  DB.saveMaintenance(JSON.parse(JSON.stringify(MAINTENANCE_DEFAULTS)));
  if(needs('users',        DB.users().length))        DB.saveUsers(JSON.parse(JSON.stringify(DEFAULT_USERS)));
  const _ci = DB.checklistItems();
  if(needs('checklistItems', _ci.opening?.length || _ci.closing?.length))
    DB.saveChecklistItems(JSON.parse(JSON.stringify(CHECKLIST_DEFAULTS)));

  migrateStockIngredientLinks();
}

// ═══════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// KIOSK MODE
// ═══════════════════════════════════════════════════════════════════════

// Kiosk PIN accepts any registered user's PIN so all staff can unlock/add stamps

function enterKiosk() {
  const kiosk=document.getElementById('kiosk'); if(!kiosk) return;
  kiosk.style.display='flex';
  document.body.style.overflow='hidden';
  if(kiosk.requestFullscreen) kiosk.requestFullscreen().catch(()=>{});
  renderKioskHome();
}

function exitKiosk() {
  const kiosk=document.getElementById('kiosk'); if(!kiosk) return;
  kiosk.style.display='none';
  document.body.style.overflow='';
  if(document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(()=>{});
}

function renderKioskHome() {
  document.getElementById('kioskBody').innerHTML=`
    <div class="kiosk-home">
      <div class="kiosk-prompt">Enter your phone number to check your loyalty card</div>
      <div class="kiosk-input-row">
        <input class="kiosk-phone-input" id="kioskPhone" type="tel" placeholder="e.g. 082 345 6789"
          inputmode="tel" autocomplete="tel" onkeydown="if(event.key==='Enter')kioskLookup()">
      </div>
      <button class="kiosk-action-btn kiosk-primary" onclick="kioskLookup()">Check In ☕</button>
      <button class="kiosk-action-btn kiosk-secondary" onclick="kioskRegisterPrompt()">New here? Register</button>
    </div>
  `;
  setTimeout(()=>document.getElementById('kioskPhone')?.focus(),80);
}

function kioskLookup() {
  const raw=document.getElementById('kioskPhone')?.value?.trim()||'';
  if(!raw){ kioskToast('Please enter your phone number'); return; }
  const norm=raw.replace(/\D/g,'');
  const customers=DB.customers();
  const match=customers.find(c=>{
    const cn=(c.phone||'').replace(/\D/g,'');
    return cn===norm || cn.endsWith(norm) || norm.endsWith(cn);
  });
  if(match) renderKioskCard(match);
  else {
    document.getElementById('kioskBody').innerHTML=`
      <div class="kiosk-home">
        <div class="kiosk-prompt" style="color:var(--gold)">No account found for that number</div>
        <div class="kiosk-sub-prompt">Would you like to join our loyalty programme?</div>
        <button class="kiosk-action-btn kiosk-primary" onclick="kioskQuickRegister('${esc(norm)}')">Yes, sign me up!</button>
        <button class="kiosk-action-btn kiosk-secondary" onclick="renderKioskHome()">← Try again</button>
      </div>
    `;
  }
}

function renderKioskCard(customer) {
  const s=DB.settings();
  const stampsNeeded=s.loyaltyFreeAt||10;
  const stamps=customer.stamps||0;
  const progress=stamps%stampsNeeded;
  const freeDue=stamps>0&&stamps%stampsNeeded===0;

  const dots=Array.from({length:stampsNeeded},(_,i)=>`
    <div class="kiosk-dot ${i<progress||(freeDue&&i<stampsNeeded)?'filled':''}">${i<progress||(freeDue&&i<stampsNeeded)?'☕':''}</div>
  `).join('');

  const daysSince=customer.lastVisit?Math.floor((new Date()-new Date(customer.lastVisit+'T12:00:00'))/(864e5)):null;

  document.getElementById('kioskBody').innerHTML=`
    <div class="kiosk-card">
      <div class="kiosk-welcome">Welcome back${customer.name?', <strong>'+esc(customer.name.split(' ')[0])+'</strong>':''}!</div>
      ${freeDue?`<div class="kiosk-free-banner">🎉 You've earned a FREE coffee — enjoy it today!</div>`:''}
      <div class="kiosk-stamp-label">${progress} / ${stampsNeeded} stamps</div>
      <div class="kiosk-dots">${dots}</div>
      <div class="kiosk-stat-row">
        <div class="kiosk-stat"><div class="ks-val">${customer.visits||0}</div><div class="ks-lbl">Visits</div></div>
        <div class="kiosk-stat"><div class="ks-val">${customer.freeCoffees||0}</div><div class="ks-lbl">Free coffees earned</div></div>
        ${daysSince!==null?`<div class="kiosk-stat"><div class="ks-val">${daysSince===0?'Today':daysSince+'d'}</div><div class="ks-lbl">Last visit</div></div>`:''}
      </div>
      <button class="kiosk-action-btn kiosk-secondary" onclick="kioskAddStamp('${customer.id}')">Add stamp (staff only)</button>
      <button class="kiosk-action-btn kiosk-ghost" onclick="renderKioskHome()">← Back</button>
    </div>
  `;
}

function kioskAddStamp(id) {
  kioskPinPrompt(()=>{
    const customers=DB.customers(); const c=customers.find(x=>x.id===id); if(!c) return;
    const s=DB.settings(); const stampsNeeded=s.loyaltyFreeAt||10;
    c.stamps=(c.stamps||0)+1;
    c.visits=(c.visits||0)+1;
    c.lastVisit=todayStr();
    if(c.stamps>0&&c.stamps%stampsNeeded===0) c.freeCoffees=(c.freeCoffees||0)+1;
    DB.saveCustomers(customers);
    kioskToast('Stamp added! ☕');
    renderKioskCard(c);
  });
}

function kioskRegisterPrompt() {
  document.getElementById('kioskBody').innerHTML=`
    <div class="kiosk-home">
      <div class="kiosk-prompt">Join our loyalty programme</div>
      <div class="kiosk-sub-prompt">Enter your details to start earning stamps</div>
      <div class="kiosk-input-row"><input class="kiosk-phone-input" id="krName" placeholder="Your name" style="margin-bottom:12px"></div>
      <div class="kiosk-input-row"><input class="kiosk-phone-input" id="krPhone" type="tel" placeholder="Phone number" inputmode="tel"></div>
      <button class="kiosk-action-btn kiosk-primary" onclick="kioskDoRegister()">Register</button>
      <button class="kiosk-action-btn kiosk-ghost" onclick="renderKioskHome()">← Back</button>
    </div>
  `;
  setTimeout(()=>document.getElementById('krName')?.focus(),80);
}

function kioskQuickRegister(normPhone) {
  document.getElementById('kioskBody').innerHTML=`
    <div class="kiosk-home">
      <div class="kiosk-prompt">Almost there!</div>
      <div class="kiosk-sub-prompt">Just add your name to get started</div>
      <div class="kiosk-input-row"><input class="kiosk-phone-input" id="krName2" placeholder="Your name"></div>
      <input type="hidden" id="krPhone2" value="${esc(normPhone)}">
      <button class="kiosk-action-btn kiosk-primary" onclick="kioskDoRegister2()">Register</button>
      <button class="kiosk-action-btn kiosk-ghost" onclick="renderKioskHome()">← Cancel</button>
    </div>
  `;
  setTimeout(()=>document.getElementById('krName2')?.focus(),80);
}

function kioskDoRegister() {
  const name=(document.getElementById('krName')?.value||'').trim();
  const phone=(document.getElementById('krPhone')?.value||'').trim();
  if(!phone){ kioskToast('Phone number required'); return; }
  _kioskCreateCustomer(name,phone);
}

function kioskDoRegister2() {
  const name=(document.getElementById('krName2')?.value||'').trim();
  const phone=(document.getElementById('krPhone2')?.value||'').trim();
  _kioskCreateCustomer(name,phone);
}

function _kioskCreateCustomer(name,phone) {
  const norm=phone.replace(/\D/g,'');
  const existing=DB.customers().find(c=>(c.phone||'').replace(/\D/g,'')===norm);
  if(existing){ renderKioskCard(existing); return; }
  const customer={id:uuid(),name:name||'Guest',phone,email:'',found:'Kiosk',
    dateJoined:todayStr(),lastVisit:todayStr(),visits:1,stamps:1,freeCoffees:0,savedDrinks:0,
    smsOptIn:false,emailOptIn:false,notes:'Registered via kiosk'};
  const list=DB.customers(); list.push(customer); DB.saveCustomers(list);
  kioskToast('Welcome to the family! ☕');
  renderKioskCard(customer);
}

let _kioskPinCallback=null;
let _kioskPinMode='exit';

function kioskPinPrompt(callback) {
  _kioskPinCallback=callback||null;
  _kioskPinMode=callback?'staff':'exit';
  const kiosk=document.getElementById('kiosk'); if(!kiosk) return;
  const existing=document.getElementById('kioskPinOverlay'); if(existing) existing.remove();
  const overlay=document.createElement('div');
  overlay.id='kioskPinOverlay'; overlay.className='kiosk-pin-overlay';
  overlay.innerHTML=`
    <div class="kiosk-pin-box">
      <div class="kiosk-pin-title">${_kioskPinMode==='exit'?'Staff login':'Confirm PIN'}</div>
      <input class="kiosk-pin-input" id="kioskPinInput" type="password" inputmode="numeric"
        maxlength="6" placeholder="••••••" onkeydown="if(event.key==='Enter')checkKioskPin()">
      <div style="display:flex;gap:12px;margin-top:8px">
        <button class="kiosk-action-btn kiosk-primary" onclick="checkKioskPin()" style="flex:1">Confirm</button>
        <button class="kiosk-action-btn kiosk-ghost" onclick="document.getElementById('kioskPinOverlay')?.remove()" style="flex:1">Cancel</button>
      </div>
      <div id="kioskPinError" style="color:#ff8a80;font-size:13px;margin-top:8px;min-height:20px"></div>
    </div>
  `;
  kiosk.appendChild(overlay);
  setTimeout(()=>document.getElementById('kioskPinInput')?.focus(),80);
}

let _kioskPinAttempts=0;
let _kioskPinLockedUntil=0;

function checkKioskPin() {
  if(Date.now()<_kioskPinLockedUntil) {
    const secs=Math.ceil((_kioskPinLockedUntil-Date.now())/1000);
    const err=document.getElementById('kioskPinError');
    if(err) err.textContent=`Too many attempts — wait ${secs}s`;
    return;
  }
  const entered=(document.getElementById('kioskPinInput')?.value||'').trim();
  const valid=DB.users().some(u=>u.pin===entered);
  if(valid) {
    _kioskPinAttempts=0;
    document.getElementById('kioskPinOverlay')?.remove();
    if(_kioskPinCallback) { _kioskPinCallback(); _kioskPinCallback=null; }
    else exitKiosk();
  } else {
    _kioskPinAttempts++;
    if(_kioskPinAttempts>=5) {
      _kioskPinLockedUntil=Date.now()+30000;
      _kioskPinAttempts=0;
    }
    const err=document.getElementById('kioskPinError');
    if(err) err.textContent='Incorrect PIN — try again';
    const inp=document.getElementById('kioskPinInput'); if(inp){ inp.value=''; inp.focus(); }
  }
}

let _kioskToastTimer=null;
function kioskToast(msg) {
  const kiosk=document.getElementById('kiosk'); if(!kiosk) return;
  let t=document.getElementById('kioskToast');
  if(!t){ t=document.createElement('div'); t.id='kioskToast'; t.className='kiosk-toast'; kiosk.appendChild(t); }
  t.textContent=msg; t.classList.add('visible');
  clearTimeout(_kioskToastTimer);
  _kioskToastTimer=setTimeout(()=>t.classList.remove('visible'),3000);
}

// ═══════════════════════════════════════════════════════════════════════
// AUTH / LOGIN
// ═══════════════════════════════════════════════════════════════════════

const SESSION_KEY = 'apc_session';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY)||'null');
    if (s && s.expiresAt > Date.now()) return s;
  } catch(e) {}
  return null;
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    userId:user.id, name:user.name, role:user.role, avatar:user.avatar||'☕',
    expiresAt: Date.now() + SESSION_TTL,
  }));
}

function currentUser() { return getSession(); }

function logout() {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
}

function showLoginScreen() {
  const overlay = document.createElement('div');
  overlay.id = 'loginOverlay';
  overlay.className = 'login-overlay';
  overlay.innerHTML = `
    <div class="login-box">
      <img src="logo.svg" alt="Apostellō" class="login-logo">
      <div class="login-tagline">not just served, Sent.</div>
      <div class="login-prompt">Enter your PIN to continue</div>
      <input class="login-pin-input" id="loginPin" type="password" inputmode="numeric"
        maxlength="8" placeholder="••••••" onkeydown="if(event.key==='Enter')attemptLogin()">
      <button class="login-btn" onclick="attemptLogin()">Sign In</button>
      <div id="loginErr" class="login-err"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('loginPin')?.focus(), 80);
}

let _loginAttempts=0;
let _loginLockedUntil=0;

function attemptLogin() {
  const errEl = document.getElementById('loginErr');
  if(Date.now()<_loginLockedUntil) {
    const secs=Math.ceil((_loginLockedUntil-Date.now())/1000);
    if(errEl) errEl.textContent=`Too many attempts — wait ${secs}s`;
    return;
  }
  const pin = (document.getElementById('loginPin')?.value || '').trim();
  if (!pin) { if (errEl) errEl.textContent = 'Enter your PIN'; return; }
  const users = DB.users();
  const user = users.find(u => u.pin === pin);
  if (!user) {
    _loginAttempts++;
    if(_loginAttempts>=5) {
      _loginLockedUntil=Date.now()+30000;
      _loginAttempts=0;
      if(errEl) errEl.textContent='Too many attempts — locked for 30s';
    } else {
      if (errEl) errEl.textContent = 'Incorrect PIN — try again';
    }
    const inp = document.getElementById('loginPin');
    if (inp) { inp.value = ''; inp.focus(); }
    document.querySelector('.login-box')?.classList.add('shake');
    setTimeout(() => document.querySelector('.login-box')?.classList.remove('shake'), 500);
    return;
  }
  _loginAttempts=0;
  setSession(user);
  document.getElementById('loginOverlay')?.remove();
  init();
}

// ═══════════════════════════════════════════════════════════════════════
function toggleSidebar() {
  const sb=document.getElementById('sidebar');
  const main=document.querySelector('.main');
  const icon=document.getElementById('collapseIcon');
  const collapsed=sb.classList.toggle('collapsed');
  main.classList.toggle('sb-collapsed',collapsed);
  if(icon) icon.textContent=collapsed?'▶':'◀';
  localStorage.setItem('apc_sb_collapsed',collapsed?'1':'');
}

function init() {
  seedIfEmpty();
  const s=DB.settings();
  const now=new Date();
  const dateStr=now.toLocaleDateString('en-ZA',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  document.getElementById('topbarDate').textContent=dateStr;
  const sess = currentUser();
  document.getElementById('sidebarDate').innerHTML=
    `<strong style="color:rgba(255,253,229,.7)">${now.toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short'})}</strong><br>${esc(s.businessName)}`;
  // Inject current-user footer above the date
  const userFooter = document.getElementById('sidebarUser');
  if (!userFooter && sess) {
    const el = document.createElement('div');
    el.id = 'sidebarUser';
    el.className = 'sidebar-user';
    el.innerHTML = `<span class="su-avatar">${esc(sess.avatar||'☕')}</span><span class="su-name nav-label">${esc(sess.name)}</span><button class="su-logout nav-label" title="Sign out" onclick="logout()">↩</button>`;
    document.getElementById('sidebar').insertBefore(el, document.getElementById('sidebarDate'));
  }

  if(localStorage.getItem('apc_sb_collapsed')==='1'){
    document.getElementById('sidebar')?.classList.add('collapsed');
    document.querySelector('.main')?.classList.add('sb-collapsed');
    const icon=document.getElementById('collapseIcon'); if(icon) icon.textContent='▶';
  }

  document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.sec)));
  // Hide admin-only nav items from staff
  if(sess?.role!=='admin'){
    ['pnl','monthly'].forEach(sec=>{
      const btn=document.querySelector(`.nav-btn[data-sec="${sec}"]`);
      if(btn) btn.style.display='none';
    });
  }

  const overlay=document.createElement('div');
  overlay.className='sidebar-overlay';
  overlay.addEventListener('click',closeSidebar);
  document.body.appendChild(overlay);
  document.getElementById('hamburger').addEventListener('click',openSidebar);

  document.getElementById('modalBg').addEventListener('click',e=>{ if(e.target===document.getElementById('modalBg')) closeModal(); });
  document.getElementById('modalClose').addEventListener('click',closeModal);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

  navigate('hub');
}

function boot() {
  if (typeof window._supabaseReady !== 'undefined') {
    // supabase.js present — it handles auth via its own email/password overlay.
    // Skip the PIN login screen; Supabase auth is sufficient.
    document.addEventListener('supabase:ready', () => {
      window._DEFAULT_SETTINGS = DEFAULT_SETTINGS;
      init();
    });
  } else {
    if (!getSession()) { showLoginScreen(); return; }
    init();
  }
}
document.addEventListener('DOMContentLoaded', boot);
