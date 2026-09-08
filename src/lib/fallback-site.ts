import type { Business, MenuItem, MenuItemSize, OpeningHour, SiteContent } from '@/lib/db/types';

type PublicMenuGroup = {
  category: string;
  items: (MenuItem & { sizes: MenuItemSize[] })[];
};

const BUSINESS_ID = 'fallback';
const STAMP = '2026-01-01T00:00:00.000Z';

export const FALLBACK_HOURS: OpeningHour[] = [
  { day: 'Monday', open: '06:30', close: '15:30', closed: false },
  { day: 'Tuesday', open: '06:30', close: '15:30', closed: false },
  { day: 'Wednesday', open: '06:30', close: '15:30', closed: false },
  { day: 'Thursday', open: '06:30', close: '15:30', closed: false },
  { day: 'Friday', open: '06:30', close: '15:30', closed: false },
  { day: 'Saturday', open: '', close: '', closed: true },
  { day: 'Sunday', open: '', close: '', closed: true },
];

export const FALLBACK_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=CMV+Business+Park';

const FALLBACK_BUSINESS: Business = {
  id: BUSINESS_ID,
  name: 'Apostellō Coffee Co.',
  slogan: 'not just served, Sent.',
  currency: 'ZAR',
  timezone: 'Africa/Johannesburg',
  operating_days: 5,
  vat_rate: 15,
  card_fee_rate: 2.9,
  loyalty_free_at: 10,
  daily_cup_target: 100,
  weekly_revenue_target: 58968,
  monthly_net_target: 75916,
  created_at: STAMP,
  updated_at: STAMP,
};

const FALLBACK_CONTENT: SiteContent = {
  business_id: BUSINESS_ID,
  hero_headline: 'Speciality coffee at CMV Business Park',
  hero_subline: 'not just served, Sent.',
  hero_image_path: null,
  hero_video_path: null,
  about_heading: 'Est. 26',
  about_body:
    'A small trailer with a serious espresso machine, parked where the working day actually happens. We dial in every morning and get you back to your desk with something worth the walk.',
  special_title: '',
  special_body: '',
  special_image_path: null,
  special_active: false,
  address_line: 'CMV Business Park',
  maps_url: FALLBACK_MAPS_URL,
  maps_embed_url: '',
  phone: '',
  email: '',
  whatsapp_url: '',
  instagram_url: '',
  facebook_url: '',
  hours: FALLBACK_HOURS,
  hours_note: 'Public holidays vary — check Instagram.',
  gallery: [],
  videos: [],
  updated_at: STAMP,
};

interface Drink {
  id: string;
  name: string;
  category: string;
  description: string;
  sizes: { size: MenuItemSize['size']; label: string; price: number }[];
}

const DRINKS: Drink[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    category: 'Espresso',
    description: 'Straight shot, dialled in fresh every morning.',
    sizes: [
      { size: 'S', label: 'Single', price: 25 },
      { size: 'M', label: 'Double', price: 32 },
    ],
  },
  {
    id: 'americano',
    name: 'Americano',
    category: 'Espresso',
    description: 'Espresso lengthened with hot water.',
    sizes: [
      { size: 'S', label: 'Small', price: 30 },
      { size: 'M', label: 'Medium', price: 35 },
      { size: 'L', label: 'Large', price: 40 },
    ],
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    category: 'Milk-based',
    description: 'Espresso, steamed milk, a proper cap of foam.',
    sizes: [
      { size: 'S', label: 'Small (8oz)', price: 35 },
      { size: 'M', label: 'Medium (12oz)', price: 40 },
      { size: 'L', label: 'Large (16oz)', price: 46 },
    ],
  },
  {
    id: 'latte',
    name: 'Latte',
    category: 'Milk-based',
    description: 'Longer, milkier, easy going.',
    sizes: [
      { size: 'S', label: 'Small (8oz)', price: 36 },
      { size: 'M', label: 'Medium (12oz)', price: 42 },
      { size: 'L', label: 'Large (16oz)', price: 48 },
    ],
  },
  {
    id: 'flat-white',
    name: 'Flat White',
    category: 'Milk-based',
    description: 'Double shot, silky micro-foam, one size only.',
    sizes: [{ size: 'M', label: 'Standard', price: 38 }],
  },
  {
    id: 'mocha',
    name: 'Mocha',
    category: 'Speciality',
    description: 'Chocolate and espresso, properly balanced.',
    sizes: [
      { size: 'S', label: 'Small (8oz)', price: 40 },
      { size: 'M', label: 'Medium (12oz)', price: 46 },
      { size: 'L', label: 'Large (16oz)', price: 52 },
    ],
  },
  {
    id: 'hot-chocolate',
    name: 'Hot Chocolate',
    category: 'Speciality',
    description: 'No coffee, all comfort.',
    sizes: [
      { size: 'S', label: 'Small (8oz)', price: 38 },
      { size: 'M', label: 'Medium (12oz)', price: 44 },
      { size: 'L', label: 'Large (16oz)', price: 50 },
    ],
  },
  {
    id: 'cold-brew',
    name: 'Cold Brew',
    category: 'Cold',
    description: 'Steeped overnight, served over ice.',
    sizes: [
      { size: 'M', label: 'Regular', price: 45 },
      { size: 'L', label: 'Large', price: 52 },
    ],
  },
];

const CATEGORY_ORDER = ['Espresso', 'Milk-based', 'Speciality', 'Cold'];

function toMenu(): PublicMenuGroup[] {
  const grouped = new Map<string, PublicMenuGroup>();

  DRINKS.forEach((drink, position) => {
    const item: MenuItem & { sizes: MenuItemSize[] } = {
      id: drink.id,
      business_id: BUSINESS_ID,
      name: drink.name,
      category: drink.category,
      description: drink.description,
      active: true,
      show_on_site: true,
      position,
      created_at: STAMP,
      updated_at: STAMP,
      sizes: drink.sizes.map((size, index) => ({
        id: `${drink.id}-${size.size}`,
        business_id: BUSINESS_ID,
        menu_item_id: drink.id,
        size: size.size,
        label: size.label,
        price: size.price,
        position: index,
      })),
    };

    const group = grouped.get(drink.category) ?? { category: drink.category, items: [] };
    group.items.push(item);
    grouped.set(drink.category, group);
  });

  return CATEGORY_ORDER.flatMap((category) => {
    const group = grouped.get(category);
    return group ? [group] : [];
  });
}

/** Menu, hours and copy the public site can serve before Supabase is connected. */
export function fallbackSiteData(): {
  business: Business;
  content: SiteContent;
  menu: PublicMenuGroup[];
} {
  return {
    business: FALLBACK_BUSINESS,
    content: FALLBACK_CONTENT,
    menu: toMenu(),
  };
}
