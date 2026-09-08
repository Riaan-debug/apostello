import type { Customer } from '@/lib/db/types';
import { daysSince } from './format';

/** Digits only. The kiosk matches on this so 082 123 4567, 0821234567 and
 *  +27 82 123 4567 all find the same person. */
export function normalisePhone(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\D/g, '');
}

/**
 * South African numbers get written three ways. Reduce to a comparable tail so
 * +27821234567 and 0821234567 match.
 */
export function phoneTail(raw: string | null | undefined): string {
  const digits = normalisePhone(raw);
  if (digits.length <= 9) return digits;
  return digits.slice(-9);
}

export function phoneMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  const ta = phoneTail(a);
  const tb = phoneTail(b);
  return ta.length >= 7 && ta === tb;
}

export const INACTIVE_AFTER_DAYS = 30;
export const WINBACK_AFTER_DAYS = 45;
export const LOST_AFTER_DAYS = 90;

export type CustomerStatus = 'new' | 'active' | 'win-back' | 'lapsed';

export function customerStatus(customer: Pick<Customer, 'last_visit' | 'visits'>): CustomerStatus {
  const days = daysSince(customer.last_visit);
  if (days === null || customer.visits === 0) return 'new';
  if (days <= INACTIVE_AFTER_DAYS) return 'active';
  if (days <= WINBACK_AFTER_DAYS) return 'win-back';
  return 'lapsed';
}

export const STATUS_LABEL: Record<CustomerStatus, string> = {
  new: 'Not visited yet',
  active: 'Active',
  'win-back': 'Win back',
  lapsed: 'Lapsed',
};

export interface LoyaltyCard {
  /** Stamps on the current card, capped at the reward threshold for display. */
  progress: number;
  needed: number;
  /** A full card waiting to be redeemed by staff. */
  rewardReady: boolean;
  /** Stamps carried past a full card, if staff have not redeemed yet. */
  overflow: number;
  bankedDrinks: number;
}

/**
 * One rule for the kiosk and the hub. The prototype had two: the kiosk showed
 * `stamps % 10` and silently granted a free coffee at every tenth stamp
 * without clearing the card, while the CRM parked at 10/10 and waited. A
 * customer could therefore see 0/10 on the iPad and 10/10 on the owner's
 * screen on the same afternoon.
 *
 * Now: stamps accumulate, a full card is *ready*, and redeeming is an explicit
 * act that subtracts the threshold. Nothing happens behind anyone's back.
 */
export function loyaltyCard(stamps: number, bankedDrinks: number, freeAt: number): LoyaltyCard {
  const needed = Math.max(1, freeAt);
  const rewardReady = stamps >= needed;
  return {
    progress: Math.min(stamps, needed),
    needed,
    rewardReady,
    overflow: Math.max(0, stamps - needed),
    bankedDrinks,
  };
}

/** Anything the customer can claim right now. */
export function claimableDrinks(customer: Pick<Customer, 'stamps' | 'banked_drinks'>, freeAt: number) {
  return Math.floor(customer.stamps / Math.max(1, freeAt)) + customer.banked_drinks;
}

export function searchCustomers(customers: Customer[], term: string): Customer[] {
  const q = term.trim().toLowerCase();
  if (!q) return customers;
  const digits = normalisePhone(q);
  return customers.filter((c) => {
    if (c.name.toLowerCase().includes(q)) return true;
    if ((c.email ?? '').toLowerCase().includes(q)) return true;
    if (digits.length >= 3 && normalisePhone(c.phone).includes(digits)) return true;
    return false;
  });
}

export function findByPhone(customers: Customer[], phone: string): Customer | undefined {
  return customers.find((c) => phoneMatches(c.phone_normalised ?? c.phone, phone));
}

export const FOUND_VIA_OPTIONS = [
  'Walk-by',
  'Referred by a friend',
  'Instagram',
  'Facebook',
  'WhatsApp',
  'Google Maps',
  'Kiosk',
  'QR sign-up',
  'Other',
];
