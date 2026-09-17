/**
 * Hand-maintained mirror of supabase/migrations. Keep in step when the schema
 * changes, or regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/db/types.ts
 */

export type StaffRole = 'admin' | 'staff' | 'kiosk';
export type DrinkSize = 'S' | 'M' | 'L' | 'XL';
export type LoyaltyEventKind = 'stamp' | 'redeem' | 'bank' | 'use_banked' | 'adjust';
export type EventSource = 'kiosk' | 'hub' | 'web';
export type ChecklistKind = 'opening' | 'closing';

export const DRINK_SIZES: DrinkSize[] = ['S', 'M', 'L', 'XL'];

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * Row types are type aliases, not interfaces, on purpose: supabase-js
 * constrains a schema to `Record<string, unknown>`, and TypeScript only gives
 * an implicit index signature to type aliases. Declared as interfaces, every
 * query silently infers `never`.
 */
export type Business = {
  id: string;
  name: string;
  slogan: string;
  currency: string;
  timezone: string;
  operating_days: number;
  vat_rate: number;
  card_fee_rate: number;
  loyalty_free_at: number;
  daily_cup_target: number;
  weekly_revenue_target: number;
  monthly_net_target: number;
  created_at: string;
  updated_at: string;
}

export type Profile = {
  id: string;
  business_id: string;
  email: string | null;
  display_name: string;
  role: StaffRole;
  avatar: string;
  active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  phone_normalised: string | null;
  email: string | null;
  birthday: string | null;
  found_via: string | null;
  notes: string | null;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  stamps: number;
  visits: number;
  free_coffees: number;
  banked_drinks: number;
  joined_on: string;
  last_visit: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type LoyaltyEvent = {
  id: string;
  business_id: string;
  customer_id: string;
  kind: LoyaltyEventKind;
  source: EventSource;
  stamps_delta: number;
  free_delta: number;
  banked_delta: number;
  visits_delta: number;
  device_time: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export type Ingredient = {
  id: string;
  business_id: string;
  name: string;
  category: string;
  unit: string;
  cost_per: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type MenuItem = {
  id: string;
  business_id: string;
  name: string;
  category: string;
  description: string;
  active: boolean;
  show_on_site: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export type MenuItemSize = {
  id: string;
  business_id: string;
  menu_item_id: string;
  size: DrinkSize;
  label: string;
  price: number;
  position: number;
}

export type RecipeLine = {
  id: string;
  business_id: string;
  menu_item_id: string;
  ingredient_id: string;
  amount_s: number;
  amount_m: number;
  amount_l: number;
  amount_xl: number;
}

export type StockItem = {
  id: string;
  business_id: string;
  name: string;
  category: string;
  unit: string;
  reorder_level: number;
  on_hand: number;
  ingredient_id: string | null;
  conv_factor: number;
  archived: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export type StockCount = {
  id: string;
  business_id: string;
  stock_item_id: string;
  count_date: string;
  opening: number;
  used: number;
  waste: number;
  waste_reason: string | null;
  closing: number;
  counted_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DailyLog = {
  id: string;
  business_id: string;
  log_date: string;
  cups: number;
  revenue: number;
  tips: number;
  new_customers: number;
  loyalty_signups: number;
  weather: string | null;
  notes: string | null;
  prep_tomorrow: string | null;
  is_event: boolean;
  event_name: string | null;
  logged_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DailyLogTally = {
  id: string;
  business_id: string;
  daily_log_id: string;
  menu_item_size_id: string;
  qty: number;
}

export type Expense = {
  id: string;
  business_id: string;
  name: string;
  category: string;
  monthly_amount: number;
  active: boolean;
  admin_only: boolean;
  created_at: string;
  updated_at: string;
}

export type ChecklistItem = {
  id: string;
  business_id: string;
  kind: ChecklistKind;
  text: string;
  position: number;
  archived: boolean;
}

export type ChecklistRun = {
  id: string;
  business_id: string;
  kind: ChecklistKind;
  run_date: string;
  completed: Record<string, boolean>;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export type OpeningHour = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export type GalleryImage = {
  path: string;
  alt: string;
}

export type SiteVideo = {
  path: string;
  title: string;
}

export type SiteContent = {
  business_id: string;
  hero_headline: string;
  hero_subline: string;
  hero_image_path: string | null;
  hero_video_path: string | null;
  about_heading: string;
  about_body: string;
  special_title: string;
  special_body: string;
  special_image_path: string | null;
  special_active: boolean;
  address_line: string;
  maps_url: string;
  maps_embed_url: string;
  phone: string;
  email: string;
  whatsapp_url: string;
  instagram_url: string;
  facebook_url: string;
  hours: OpeningHour[];
  hours_note: string;
  gallery: GalleryImage[];
  videos: SiteVideo[];
  food_heading: string;
  food_body: string;
  food_photos: GalleryImage[];
  coffee_heading: string;
  coffee_body: string;
  coffee_photos: GalleryImage[];
  updated_at: string;
}

export type StaffLink = {
  id: string;
  business_id: string;
  label: string;
  url: string;
  icon: string;
  position: number;
}

type Writable<Row, Required extends keyof Row = never> = Partial<Omit<Row, Required>> &
  Pick<Row, Required>;

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Def<Row, Required extends keyof Row = never> = TableDef<
  Row,
  Writable<Row, Required>,
  Partial<Row>
>;

export interface Database {
  public: {
    Tables: {
      businesses: Def<Business, 'name'>;
      profiles: Def<Profile, 'id' | 'business_id' | 'display_name'>;
      customers: Def<Customer, 'business_id' | 'name'>;
      loyalty_events: Def<LoyaltyEvent, 'id' | 'business_id' | 'customer_id' | 'kind'>;
      ingredients: Def<Ingredient, 'business_id' | 'name'>;
      menu_items: Def<MenuItem, 'business_id' | 'name'>;
      menu_item_sizes: Def<MenuItemSize, 'business_id' | 'menu_item_id' | 'size' | 'label'>;
      recipe_lines: Def<RecipeLine, 'business_id' | 'menu_item_id' | 'ingredient_id'>;
      stock_items: Def<StockItem, 'business_id' | 'name'>;
      // `closing` is a generated column: always present on read, never written.
      stock_counts: TableDef<
        StockCount,
        Writable<Omit<StockCount, 'closing'>, 'business_id' | 'stock_item_id' | 'count_date'>,
        Partial<Omit<StockCount, 'closing'>>
      >;
      daily_logs: Def<DailyLog, 'business_id' | 'log_date'>;
      daily_log_tally: Def<DailyLogTally, 'business_id' | 'daily_log_id' | 'menu_item_size_id'>;
      expenses: Def<Expense, 'business_id' | 'name'>;
      checklist_items: Def<ChecklistItem, 'business_id' | 'kind' | 'text'>;
      checklist_runs: Def<ChecklistRun, 'business_id' | 'kind'>;
      site_content: Def<SiteContent, 'business_id'>;
      staff_links: Def<StaffLink, 'business_id' | 'label' | 'url'>;
    };
    Views: Record<string, never>;
    Functions: {
      record_stamp: {
        Args: {
          p_event_id: string;
          p_customer_id: string;
          p_source?: EventSource;
          p_device_time?: string;
        };
        Returns: Customer;
      };
      redeem_reward: {
        Args: {
          p_event_id: string;
          p_customer_id: string;
          p_bank?: boolean;
          p_source?: EventSource;
          p_device_time?: string;
        };
        Returns: Customer;
      };
      use_banked_drink: {
        Args: {
          p_event_id: string;
          p_customer_id: string;
          p_source?: EventSource;
          p_device_time?: string;
        };
        Returns: Customer;
      };
      set_staff_pin: {
        Args: { p_profile_id: string; p_pin: string };
        Returns: undefined;
      };
      verify_staff_pin: {
        Args: { p_pin: string; p_device_id: string };
        Returns: {
          profile_id: string | null;
          email: string | null;
          display_name: string | null;
          role: StaffRole | null;
          locked_until: string | null;
          fails: number;
        }[];
      };
      public_loyalty_signup: {
        Args: {
          p_business_id: string;
          p_name: string;
          p_phone: string;
          p_email?: string | null;
          p_sms_opt_in?: boolean;
          p_email_opt_in?: boolean;
          p_found_via?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      staff_role: StaffRole;
      drink_size: DrinkSize;
      loyalty_event: LoyaltyEventKind;
      event_source: EventSource;
      checklist_kind: ChecklistKind;
    };
    CompositeTypes: Record<string, never>;
  };
}
