import { addDays, eachDay, today, weekRange } from '@/lib/domain/dates';
import { FALLBACK_HOURS, FALLBACK_INSTAGRAM_URL, FALLBACK_MAPS_URL } from '@/lib/fallback-site';
import {
  PREVIEW_BUSINESS,
  PREVIEW_BUSINESS_ID as BID,
  PREVIEW_PROFILE,
  PREVIEW_PROFILE_ID,
} from './session';

const T = '2026-01-01T00:00:00.000Z';

function weekdayLogs() {
  const day = today();
  const { from, to } = weekRange(day);
  return eachDay({ from, to })
    .filter((date) => {
      const weekday = new Date(`${date}T12:00:00`).getDay();
      return weekday !== 0 && weekday !== 6;
    })
    .map((date, index) => {
      const isToday = date === day;
      const cups = isToday ? 47 : 72 + index * 6;
      const revenue = isToday ? 1980 : 3100 + index * 180;
      return {
        id: `log-${date}`,
        business_id: BID,
        log_date: date,
        cups,
        revenue,
        tips: isToday ? 40 : 80,
        new_customers: isToday ? 2 : 3,
        loyalty_signups: isToday ? 1 : 2,
        weather: isToday ? 'Mild' : 'Sunny',
        notes: isToday ? '' : 'Steady office traffic.',
        prep_tomorrow: '',
        is_event: false,
        event_name: null,
        logged_by: PREVIEW_PROFILE_ID,
        created_at: T,
        updated_at: T,
      };
    });
}

export function createPreviewTables(): Record<string, Record<string, unknown>[]> {
  const day = today();

  const customers = [
    {
      id: 'cust-thandi',
      business_id: BID,
      name: 'Thandi Moyo',
      phone: '082 441 2290',
      phone_normalised: '0824412290',
      email: 'thandi@example.com',
      birthday: null,
      found_via: 'Kiosk',
      notes: null,
      sms_opt_in: true,
      email_opt_in: false,
      stamps: 10,
      visits: 22,
      free_coffees: 2,
      banked_drinks: 0,
      joined_on: addDays(day, -80),
      last_visit: day,
      archived: false,
      created_at: T,
      updated_at: T,
    },
    {
      id: 'cust-johan',
      business_id: BID,
      name: 'Johan van Wyk',
      phone: '083 112 7781',
      phone_normalised: '0831127781',
      email: null,
      birthday: null,
      found_via: 'Trailer',
      notes: 'Flat white, extra hot',
      sms_opt_in: true,
      email_opt_in: false,
      stamps: 4,
      visits: 9,
      free_coffees: 0,
      banked_drinks: 1,
      joined_on: addDays(day, -40),
      last_visit: addDays(day, -1),
      archived: false,
      created_at: T,
      updated_at: T,
    },
    {
      id: 'cust-ayesha',
      business_id: BID,
      name: 'Ayesha Khan',
      phone: '071 555 0199',
      phone_normalised: '0715550199',
      email: 'ayesha@example.com',
      birthday: null,
      found_via: 'QR sign-up',
      notes: null,
      sms_opt_in: false,
      email_opt_in: true,
      stamps: 7,
      visits: 14,
      free_coffees: 1,
      banked_drinks: 0,
      joined_on: addDays(day, -120),
      last_visit: addDays(day, -32),
      archived: false,
      created_at: T,
      updated_at: T,
    },
    {
      id: 'cust-sipho',
      business_id: BID,
      name: 'Sipho Dlamini',
      phone: '076 330 4412',
      phone_normalised: '0763304412',
      email: null,
      birthday: null,
      found_via: 'Kiosk',
      notes: null,
      sms_opt_in: true,
      email_opt_in: false,
      stamps: 2,
      visits: 2,
      free_coffees: 0,
      banked_drinks: 0,
      joined_on: addDays(day, -3),
      last_visit: day,
      archived: false,
      created_at: T,
      updated_at: T,
    },
  ];

  const stock = [
    { id: 'stk-beans', name: 'Coffee beans', category: 'Coffee', unit: 'g', reorder: 100, on_hand: 80 },
    { id: 'stk-milk', name: 'Full cream milk', category: 'Dairy', unit: 'L', reorder: 2, on_hand: 1.5 },
    { id: 'stk-oat', name: 'Oat milk', category: 'Dairy alt', unit: 'L', reorder: 1, on_hand: 0.5 },
    { id: 'stk-cups-m', name: 'Cups medium (12oz)', category: 'Packaging', unit: 'each', reorder: 20, on_hand: 18 },
    { id: 'stk-lids', name: 'Cup lids', category: 'Packaging', unit: 'each', reorder: 40, on_hand: 90 },
    { id: 'stk-gas', name: 'Gas (LPG)', category: 'Energy', unit: 'cyl', reorder: 1, on_hand: 2 },
    { id: 'stk-crois', name: 'Croissants', category: 'Bakery', unit: 'each', reorder: 4, on_hand: 3 },
    { id: 'stk-choc', name: 'Chocolate powder', category: 'Dry goods', unit: 'g', reorder: 50, on_hand: 120 },
  ].map((item, position) => ({
    id: item.id,
    business_id: BID,
    name: item.name,
    category: item.category,
    unit: item.unit,
    reorder_level: item.reorder,
    on_hand: item.on_hand,
    ingredient_id: null,
    conv_factor: 1,
    archived: false,
    position: position + 1,
    created_at: T,
    updated_at: T,
  }));

  const counted = new Set(['stk-beans', 'stk-milk', 'stk-oat', 'stk-crois']);
  const stock_counts = stock
    .filter((item) => counted.has(item.id))
    .map((item) => {
      const opening = Number(item.on_hand) + 2;
      const used = 2;
      const waste = item.id === 'stk-crois' ? 1 : 0;
      return {
        id: `cnt-${item.id}`,
        business_id: BID,
        stock_item_id: item.id,
        count_date: day,
        opening,
        used,
        waste,
        waste_reason: waste ? 'Dropped' : null,
        closing: Math.round(Math.max(0, opening - used - waste) * 1000) / 1000,
        counted_by: PREVIEW_PROFILE_ID,
        created_at: T,
        updated_at: T,
      };
    });

  const openingItems = [
    'Equipment on & preheated (machine, grinder)',
    'Milk stock checked & in fridge',
    'Coffee beans in grinder — fresh',
    'Cash float counted & correct',
    'Trailer / space clean & presentable',
    'Specials board updated',
    'Wi-Fi connected & POS active',
  ];
  const closingItems = [
    'Machine & grinder turned off',
    'Milk stored correctly / disposed',
    'Counter, steam wand & surfaces wiped',
    'Waste taken out',
    'Cash counted, float secured',
    'Gas valve off',
    'Daily log completed in app',
  ];

  const checklist_items = [
    ...openingItems.map((text, i) => ({
      id: `chk-open-${i + 1}`,
      business_id: BID,
      kind: 'opening',
      text,
      position: i + 1,
      archived: false,
    })),
    ...closingItems.map((text, i) => ({
      id: `chk-close-${i + 1}`,
      business_id: BID,
      kind: 'closing',
      text,
      position: i + 1,
      archived: false,
    })),
  ];

  const openingDone = Object.fromEntries(
    checklist_items.filter((item) => item.kind === 'opening' && item.position <= 5).map((item) => [item.id, true]),
  );

  const menu = [
    { id: 'm-esp', name: 'Espresso', category: 'Espresso', description: 'Straight shot, dialled in fresh every morning.' },
    { id: 'm-ame', name: 'Americano', category: 'Espresso', description: 'Espresso lengthened with hot water.' },
    { id: 'm-cap', name: 'Cappuccino', category: 'Milk-based', description: 'Espresso, steamed milk, a proper cap of foam.' },
    { id: 'm-lat', name: 'Latte', category: 'Milk-based', description: 'Longer, milkier, easy going.' },
    { id: 'm-fw', name: 'Flat White', category: 'Milk-based', description: 'Double shot, silky micro-foam, one size only.' },
    { id: 'm-moc', name: 'Mocha', category: 'Speciality', description: 'Chocolate and espresso, properly balanced.' },
    { id: 'm-hc', name: 'Hot Chocolate', category: 'Speciality', description: 'No coffee, all comfort.' },
    { id: 'm-cb', name: 'Cold Brew', category: 'Cold', description: 'Steeped overnight, served over ice.' },
  ].map((item, position) => ({
    ...item,
    business_id: BID,
    active: true,
    show_on_site: true,
    position: position + 1,
    created_at: T,
    updated_at: T,
  }));

  const sizeRows: { item: string; size: string; label: string; price: number; position: number }[] = [
    { item: 'm-esp', size: 'S', label: 'Single', price: 25, position: 1 },
    { item: 'm-esp', size: 'M', label: 'Double', price: 32, position: 2 },
    { item: 'm-ame', size: 'S', label: 'Small', price: 30, position: 1 },
    { item: 'm-ame', size: 'M', label: 'Medium', price: 35, position: 2 },
    { item: 'm-ame', size: 'L', label: 'Large', price: 40, position: 3 },
    { item: 'm-cap', size: 'S', label: 'Small (8oz)', price: 35, position: 1 },
    { item: 'm-cap', size: 'M', label: 'Medium (12oz)', price: 40, position: 2 },
    { item: 'm-cap', size: 'L', label: 'Large (16oz)', price: 46, position: 3 },
    { item: 'm-lat', size: 'S', label: 'Small (8oz)', price: 36, position: 1 },
    { item: 'm-lat', size: 'M', label: 'Medium (12oz)', price: 42, position: 2 },
    { item: 'm-lat', size: 'L', label: 'Large (16oz)', price: 48, position: 3 },
    { item: 'm-fw', size: 'M', label: 'Standard', price: 38, position: 1 },
    { item: 'm-moc', size: 'S', label: 'Small (8oz)', price: 40, position: 1 },
    { item: 'm-moc', size: 'M', label: 'Medium (12oz)', price: 46, position: 2 },
    { item: 'm-moc', size: 'L', label: 'Large (16oz)', price: 52, position: 3 },
    { item: 'm-hc', size: 'S', label: 'Small (8oz)', price: 38, position: 1 },
    { item: 'm-hc', size: 'M', label: 'Medium (12oz)', price: 44, position: 2 },
    { item: 'm-hc', size: 'L', label: 'Large (16oz)', price: 50, position: 3 },
    { item: 'm-cb', size: 'M', label: 'Regular', price: 45, position: 1 },
    { item: 'm-cb', size: 'L', label: 'Large', price: 52, position: 2 },
  ];

  const ingredients = [
    { id: 'ing-beans', name: 'Coffee beans', category: 'Coffee', unit: 'g', cost: 0.45 },
    { id: 'ing-milk', name: 'Full cream milk', category: 'Dairy', unit: 'ml', cost: 0.024 },
    { id: 'ing-oat', name: 'Oat milk', category: 'Dairy alt', unit: 'ml', cost: 0.038 },
    { id: 'ing-choc', name: 'Choc powder', category: 'Dry goods', unit: 'g', cost: 0.18 },
    { id: 'ing-cup8', name: 'Cup 8oz', category: 'Packaging', unit: 'each', cost: 1.8 },
    { id: 'ing-cup12', name: 'Cup 12oz', category: 'Packaging', unit: 'each', cost: 2.2 },
    { id: 'ing-lid', name: 'Lids', category: 'Packaging', unit: 'each', cost: 0.6 },
  ].map((item) => ({
    id: item.id,
    business_id: BID,
    name: item.name,
    category: item.category,
    unit: item.unit,
    cost_per: item.cost,
    archived: false,
    created_at: T,
    updated_at: T,
  }));

  return {
    businesses: [PREVIEW_BUSINESS],
    profiles: [PREVIEW_PROFILE],
    customers,
    loyalty_events: Array.from({ length: 18 }, (_, i) => ({
      id: `evt-${i + 1}`,
      business_id: BID,
      customer_id: customers[i % customers.length].id,
      kind: 'stamp',
      source: 'kiosk',
      stamps_delta: 1,
      free_delta: 0,
      banked_delta: 0,
      visits_delta: 1,
      device_time: `${day}T0${8 + (i % 6)}:${String((i * 7) % 60).padStart(2, '0')}:00`,
      note: null,
      created_by: PREVIEW_PROFILE_ID,
      created_at: T,
    })),
    ingredients,
    menu_items: menu,
    menu_item_sizes: sizeRows.map((size) => ({
      id: `${size.item}-${size.size}`,
      business_id: BID,
      menu_item_id: size.item,
      size: size.size,
      label: size.label,
      price: size.price,
      position: size.position,
    })),
    recipe_lines: [
      { menu_item_id: 'm-esp', ingredient_id: 'ing-beans', amount_s: 9, amount_m: 18, amount_l: 0 },
      { menu_item_id: 'm-cap', ingredient_id: 'ing-beans', amount_s: 18, amount_m: 21, amount_l: 21 },
      { menu_item_id: 'm-cap', ingredient_id: 'ing-milk', amount_s: 100, amount_m: 140, amount_l: 180 },
      { menu_item_id: 'm-fw', ingredient_id: 'ing-beans', amount_s: 0, amount_m: 18, amount_l: 0 },
      { menu_item_id: 'm-fw', ingredient_id: 'ing-milk', amount_s: 0, amount_m: 130, amount_l: 0 },
    ].map((line) => ({
      id: `${line.menu_item_id}-${line.ingredient_id}`,
      business_id: BID,
      ...line,
      amount_xl: 0,
    })),
    stock_items: stock,
    stock_counts,
    daily_logs: weekdayLogs(),
    daily_log_tally: [],
    expenses: [
      { name: 'Wages / Salary', category: 'Labour', monthly_amount: 12000, admin_only: true },
      { name: 'Site rental / pitch fee', category: 'Rent', monthly_amount: 3500, admin_only: true },
      { name: 'Wi-Fi / data', category: 'Operations', monthly_amount: 999, admin_only: false },
      { name: 'Trailer payment/rental', category: 'Equipment', monthly_amount: 2500, admin_only: true },
      { name: 'Insurance', category: 'Operations', monthly_amount: 800, admin_only: true },
      { name: 'Gas / LPG', category: 'Operations', monthly_amount: 1120, admin_only: false },
    ].map((row, i) => ({
      id: `exp-${i + 1}`,
      business_id: BID,
      ...row,
      active: true,
      created_at: T,
      updated_at: T,
    })),
    checklist_items,
    checklist_runs: [
      {
        id: `run-open-${day}`,
        business_id: BID,
        kind: 'opening',
        run_date: day,
        completed: openingDone,
        completed_by: PREVIEW_PROFILE_ID,
        created_at: T,
        updated_at: T,
      },
    ],
    site_content: [
      {
        business_id: BID,
        hero_headline: 'Speciality coffee at CMV Business Park',
        hero_subline: 'not just served, Sent.',
        hero_image_path: null,
        hero_video_path: null,
        about_heading: 'Est. 26',
        about_body:
          'A small trailer with a serious espresso machine, parked where the working day actually happens.',
        special_title: 'Oat cortado',
        special_body: 'Double shot, oat milk, no extra charge this week.',
        special_image_path: null,
        special_active: true,
        address_line: 'CMV Business Park',
        maps_url: FALLBACK_MAPS_URL,
        maps_embed_url: '',
        phone: '',
        email: '',
        whatsapp_url: '',
        instagram_url: FALLBACK_INSTAGRAM_URL,
        facebook_url: '',
        hours: FALLBACK_HOURS,
        hours_note: 'Public holidays vary — check Instagram.',
        gallery: [],
        videos: [],
        food_heading: "What's cooking",
        food_body: 'Bites from the trailer — ask what is on today.',
        food_photos: [],
        coffee_heading: 'Home Blend',
        coffee_body: 'Roasted for the park. Cups at the trailer, bags to take home.',
        coffee_photos: [],
        updated_at: T,
      },
    ],
    staff_links: [
      { label: 'Yoco portal', url: 'https://portal.yoco.com', icon: 'credit-card' },
      { label: 'Instagram', url: 'https://www.instagram.com', icon: 'instagram' },
      { label: 'WhatsApp Web', url: 'https://web.whatsapp.com', icon: 'message-circle' },
      { label: 'Google Business', url: 'https://business.google.com', icon: 'map-pin' },
    ].map((link, i) => ({
      id: `link-${i + 1}`,
      business_id: BID,
      ...link,
      position: i + 1,
    })),
  };
}
