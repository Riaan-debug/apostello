'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, EventSource } from '@/lib/db/types';
import type { OutboxJob, OutboxKind } from './db';

type Client = SupabaseClient<Database>;

export interface StampPayload {
  customerId: string;
  source: EventSource;
  deviceTime: string;
}

export interface RedeemPayload extends StampPayload {
  bank: boolean;
}

export interface CustomerCreatePayload {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  phoneNormalised: string;
  email: string | null;
  foundVia: string;
  smsOptIn: boolean;
  emailOptIn: boolean;
  notes: string | null;
  birthday: string | null;
}

export interface StockCountPayload {
  businessId: string;
  stockItemId: string;
  countDate: string;
  opening: number;
  used: number;
  waste: number;
  wasteReason: string | null;
}

export interface DailyLogPayload {
  businessId: string;
  logDate: string;
  cups: number;
  revenue: number;
  tips: number;
  newCustomers: number;
  loyaltySignups: number;
  weather: string | null;
  notes: string | null;
  prepTomorrow: string | null;
  isEvent: boolean;
  eventName: string | null;
  tally: Record<string, number>;
}

export interface ChecklistRunPayload {
  businessId: string;
  kind: 'opening' | 'closing';
  runDate: string;
  completed: Record<string, boolean>;
}

export interface PayloadMap {
  stamp: StampPayload;
  redeem: RedeemPayload;
  use_banked: StampPayload;
  customer_create: CustomerCreatePayload;
  stock_count: StockCountPayload;
  daily_log: DailyLogPayload;
  checklist_run: ChecklistRunPayload;
}

/**
 * Every job is written so that running it twice leaves the same result as
 * running it once: loyalty RPCs take the job id as the ledger row id, and the
 * rest are upserts on a natural key.
 */
export async function runJob(supabase: Client, job: OutboxJob): Promise<void> {
  switch (job.kind) {
    case 'stamp': {
      const p = job.payload as StampPayload;
      const { error } = await supabase.rpc('record_stamp', {
        p_event_id: job.id,
        p_customer_id: p.customerId,
        p_source: p.source,
        p_device_time: p.deviceTime,
      });
      if (error) throw new Error(error.message);
      return;
    }

    case 'redeem': {
      const p = job.payload as RedeemPayload;
      const { error } = await supabase.rpc('redeem_reward', {
        p_event_id: job.id,
        p_customer_id: p.customerId,
        p_bank: p.bank,
        p_source: p.source,
        p_device_time: p.deviceTime,
      });
      if (error) throw new Error(error.message);
      return;
    }

    case 'use_banked': {
      const p = job.payload as StampPayload;
      const { error } = await supabase.rpc('use_banked_drink', {
        p_event_id: job.id,
        p_customer_id: p.customerId,
        p_source: p.source,
        p_device_time: p.deviceTime,
      });
      if (error) throw new Error(error.message);
      return;
    }

    case 'customer_create': {
      const p = job.payload as CustomerCreatePayload;
      const { error } = await supabase.from('customers').upsert(
        {
          id: p.id,
          business_id: p.businessId,
          name: p.name,
          phone: p.phone,
          phone_normalised: p.phoneNormalised,
          email: p.email,
          found_via: p.foundVia,
          sms_opt_in: p.smsOptIn,
          email_opt_in: p.emailOptIn,
          notes: p.notes,
          birthday: p.birthday,
        },
        { onConflict: 'id' },
      );
      // Two iPads signing up the same phone number is a race the unique index
      // is there to win. The second one loses politely.
      if (error && !isDuplicatePhone(error.message)) throw new Error(error.message);
      return;
    }

    case 'stock_count': {
      const p = job.payload as StockCountPayload;
      const { error } = await supabase.from('stock_counts').upsert(
        {
          business_id: p.businessId,
          stock_item_id: p.stockItemId,
          count_date: p.countDate,
          opening: p.opening,
          used: p.used,
          waste: p.waste,
          waste_reason: p.wasteReason,
        },
        { onConflict: 'stock_item_id,count_date' },
      );
      if (error) throw new Error(error.message);
      return;
    }

    case 'daily_log': {
      const p = job.payload as DailyLogPayload;
      const { data, error } = await supabase
        .from('daily_logs')
        .upsert(
          {
            business_id: p.businessId,
            log_date: p.logDate,
            cups: p.cups,
            revenue: p.revenue,
            tips: p.tips,
            new_customers: p.newCustomers,
            loyalty_signups: p.loyaltySignups,
            weather: p.weather,
            notes: p.notes,
            prep_tomorrow: p.prepTomorrow,
            is_event: p.isEvent,
            event_name: p.eventName,
          },
          { onConflict: 'business_id,log_date' },
        )
        .select('id')
        .single();
      if (error) throw new Error(error.message);

      const rows = Object.entries(p.tally)
        .filter(([, qty]) => qty > 0)
        .map(([menu_item_size_id, qty]) => ({
          business_id: p.businessId,
          daily_log_id: data.id,
          menu_item_size_id,
          qty,
        }));

      if (rows.length > 0) {
        const { error: tallyError } = await supabase
          .from('daily_log_tally')
          .upsert(rows, { onConflict: 'daily_log_id,menu_item_size_id' });
        if (tallyError) throw new Error(tallyError.message);
      }
      return;
    }

    case 'checklist_run': {
      const p = job.payload as ChecklistRunPayload;
      const { error } = await supabase.from('checklist_runs').upsert(
        {
          business_id: p.businessId,
          kind: p.kind,
          run_date: p.runDate,
          completed: p.completed,
        },
        { onConflict: 'business_id,kind,run_date' },
      );
      if (error) throw new Error(error.message);
      return;
    }

    default: {
      const exhaustive: never = job.kind;
      throw new Error(`Unknown outbox job: ${String(exhaustive)}`);
    }
  }
}

function isDuplicatePhone(message: string): boolean {
  return message.includes('customers_phone_uniq');
}

export const JOB_LABEL: Record<OutboxKind, string> = {
  stamp: 'loyalty stamp',
  redeem: 'free drink',
  use_banked: 'banked drink',
  customer_create: 'new sign-up',
  stock_count: 'stock count',
  daily_log: 'daily log',
  checklist_run: 'checklist',
};
