'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import { SITE_TAG } from '@/lib/content';
import { EXPENSE_CATEGORIES } from '@/lib/domain/finance';

export type ActionResult = { ok: true } | { ok: false; error: string };

const businessSchema = z.object({
  name: z.string().trim().min(2, 'The business needs a name.').max(80),
  slogan: z.string().trim().max(120),
  operating_days: z.number().int().min(1, 'At least one trading day.').max(7),
  vat_rate: z.number().min(0).max(100),
  card_fee_rate: z.number().min(0).max(100),
  loyalty_free_at: z.number().int().min(1, 'A card needs at least one stamp.').max(50),
  daily_cup_target: z.number().int().min(0).max(10000),
  weekly_revenue_target: z.number().min(0).max(100000000),
  monthly_net_target: z.number().min(0).max(100000000),
});

const expenseSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(2, 'Give the cost a name.').max(80),
  category: z
    .string()
    .trim()
    .refine((value) => EXPENSE_CATEGORIES.includes(value), 'Pick a category from the list.'),
  monthly_amount: z.number().min(0, 'A monthly amount cannot be negative.').max(10000000),
  active: z.boolean(),
  admin_only: z.boolean(),
});

const profileSchema = z.object({
  id: z.uuid(),
  display_name: z.string().trim().min(2, 'A name of at least two letters.').max(60),
  role: z.enum(['admin', 'staff', 'kiosk']),
  active: z.boolean(),
});

const pinSchema = z.object({
  profileId: z.uuid(),
  pin: z.string().regex(/^\d{4,8}$/, 'A PIN is 4 to 8 digits, numbers only.'),
});

const addPersonSchema = z.object({
  display_name: z.string().trim().min(2, 'A name of at least two letters.').max(60),
  email: z.string().trim().toLowerCase().pipe(z.email('Need a real email address.')),
  role: z.enum(['admin', 'staff', 'kiosk']),
  pin: z.string().regex(/^\d{4,8}$/, 'A PIN is 4 to 8 digits, numbers only.'),
});

const staffLinkSchema = z.object({
  id: z.uuid().nullable(),
  label: z.string().trim().min(2, 'Give the shortcut a label.').max(40),
  url: z.url('Paste the full address, starting with https://'),
  icon: z.string().trim().min(1).max(40),
  position: z.number().int().min(0).max(999),
});

export type BusinessInput = z.infer<typeof businessSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type StaffLinkInput = z.infer<typeof staffLinkSchema>;

const SAVE_FAILED = 'That did not save. Please try again in a moment.';

function firstIssue(issues: { message: string }[]): string {
  return issues[0]?.message ?? 'Please check the fields and try again.';
}

export async function saveBusiness(input: BusinessInput): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = businessSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };

  const nameChanged =
    parsed.data.name !== session.business.name || parsed.data.slogan !== session.business.slogan;

  try {
    const supabase = await supabaseServer();
    const { error } = await supabase
      .from('businesses')
      .update(parsed.data)
      .eq('id', session.business.id);
    if (error) return { ok: false, error: SAVE_FAILED };
  } catch {
    return { ok: false, error: SAVE_FAILED };
  }

  revalidatePath('/hub/settings');
  revalidatePath('/hub');
  if (nameChanged) revalidateTag(SITE_TAG);

  return { ok: true };
}

export async function saveExpense(input: ExpenseInput): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };

  const { id, ...fields } = parsed.data;

  try {
    const supabase = await supabaseServer();
    const { error } = id
      ? await supabase
          .from('expenses')
          .update(fields)
          .eq('id', id)
          .eq('business_id', session.business.id)
      : await supabase.from('expenses').insert({ ...fields, business_id: session.business.id });
    if (error) return { ok: false, error: SAVE_FAILED };
  } catch {
    return { ok: false, error: SAVE_FAILED };
  }

  revalidatePath('/hub/settings');
  revalidatePath('/hub/reports');

  return { ok: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  if (!z.uuid().safeParse(id).success) return { ok: false, error: 'That cost no longer exists.' };

  try {
    const supabase = await supabaseServer();
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('business_id', session.business.id);
    if (error) return { ok: false, error: SAVE_FAILED };
  } catch {
    return { ok: false, error: SAVE_FAILED };
  }

  revalidatePath('/hub/settings');
  revalidatePath('/hub/reports');

  return { ok: true };
}

export async function saveProfile(input: ProfileInput): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };

  const { id, ...fields } = parsed.data;

  if (id === session.profile.id && (fields.role !== 'admin' || !fields.active)) {
    return {
      ok: false,
      error: 'You cannot take away your own owner access. Ask the other owner to do it.',
    };
  }

  try {
    const supabase = await supabaseServer();
    const { error } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', id)
      .eq('business_id', session.business.id);
    if (error) return { ok: false, error: SAVE_FAILED };
  } catch {
    return { ok: false, error: SAVE_FAILED };
  }

  revalidatePath('/hub/settings');

  return { ok: true };
}

export async function addPerson(input: {
  display_name: string;
  email: string;
  role: 'admin' | 'staff' | 'kiosk';
  pin: string;
}): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = addPersonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: 'Staff accounts are not connected yet.' };
  }

  const { display_name, email, role, pin } = parsed.data;
  const password = randomBytes(24).toString('base64url');

  let userId: string | undefined;

  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name },
    });

    if (error || !data.user) {
      const message = error?.message ?? '';
      if (/already/i.test(message)) {
        return { ok: false, error: 'That email already has a login. Open their row below.' };
      }
      return { ok: false, error: 'Could not create that person. Check the email and try again.' };
    }

    userId = data.user.id;

    const supabase = await supabaseServer();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      const { error: insertError } = await admin.from('profiles').insert({
        id: userId,
        business_id: session.business.id,
        email,
        display_name,
        role,
        active: true,
      });
      if (insertError) {
        await admin.auth.admin.deleteUser(userId);
        return { ok: false, error: 'The login was created but their hub profile did not save.' };
      }
    } else {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ display_name, role, email, active: true })
        .eq('id', userId)
        .eq('business_id', session.business.id);
      if (updateError) {
        return { ok: false, error: 'They were added but the role did not save. Edit their row.' };
      }
    }

    const { error: pinError } = await supabase.rpc('set_staff_pin', {
      p_profile_id: userId,
      p_pin: pin,
    });
    if (pinError) {
      return { ok: false, error: 'They were added but the PIN did not save. Set it on their row.' };
    }
  } catch {
    if (userId) {
      try {
        await supabaseAdmin().auth.admin.deleteUser(userId);
      } catch {
        // The auth user may already exist; the form error below is enough.
      }
    }
    return { ok: false, error: SAVE_FAILED };
  }

  revalidatePath('/hub/settings');

  return { ok: true };
}

export async function setStaffPin(input: { profileId: string; pin: string }): Promise<ActionResult> {
  await requireAdmin();

  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };

  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.rpc('set_staff_pin', {
      p_profile_id: parsed.data.profileId,
      p_pin: parsed.data.pin,
    });
    if (error) return { ok: false, error: 'The PIN did not save. Please try again.' };
  } catch {
    return { ok: false, error: 'The PIN did not save. Please try again.' };
  }

  revalidatePath('/hub/settings');

  return { ok: true };
}

export async function saveStaffLink(input: StaffLinkInput): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = staffLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error.issues) };

  const { id, ...fields } = parsed.data;

  try {
    const supabase = await supabaseServer();
    const { error } = id
      ? await supabase
          .from('staff_links')
          .update(fields)
          .eq('id', id)
          .eq('business_id', session.business.id)
      : await supabase.from('staff_links').insert({ ...fields, business_id: session.business.id });
    if (error) return { ok: false, error: SAVE_FAILED };
  } catch {
    return { ok: false, error: SAVE_FAILED };
  }

  revalidatePath('/hub/settings');
  revalidatePath('/hub');

  return { ok: true };
}

export async function deleteStaffLink(id: string): Promise<ActionResult> {
  const session = await requireAdmin();

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, error: 'That shortcut no longer exists.' };
  }

  try {
    const supabase = await supabaseServer();
    const { error } = await supabase
      .from('staff_links')
      .delete()
      .eq('id', id)
      .eq('business_id', session.business.id);
    if (error) return { ok: false, error: SAVE_FAILED };
  } catch {
    return { ok: false, error: SAVE_FAILED };
  }

  revalidatePath('/hub/settings');
  revalidatePath('/hub');

  return { ok: true };
}