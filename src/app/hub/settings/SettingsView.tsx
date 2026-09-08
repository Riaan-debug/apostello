'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Instagram,
  KeyRound,
  Link as LinkIcon,
  Mail,
  MapPin,
  MessageCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import type { Expense, Profile, StaffRole } from '@/lib/db/types';
import { Badge, FilterTabs } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, EmptyState, SectionHeading } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Table, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { Checkbox, Field, FormGrid, Input, Select } from '@/components/ui/form';
import { useToast } from '@/components/ui/Toast';
import { EXPENSE_CATEGORIES, monthlyFixedCosts, weeklyFixedCosts } from '@/lib/domain/finance';
import { money } from '@/lib/domain/format';
import {
  deleteExpense,
  deleteStaffLink,
  addPerson,
  saveBusiness,
  saveExpense,
  saveProfile,
  saveStaffLink,
  setStaffPin,
  type ActionResult,
} from './actions';

export interface BusinessBasics {
  name: string;
  slogan: string;
}

export interface BusinessSettings extends BusinessBasics {
  operating_days: number;
  vat_rate: number;
  card_fee_rate: number;
  loyalty_free_at: number;
  daily_cup_target: number;
  weekly_revenue_target: number;
  monthly_net_target: number;
}

export interface ShortcutLink {
  id: string;
  label: string;
  url: string;
  icon: string;
  position: number;
}

type Tab = 'business' | 'loyalty' | 'money' | 'people' | 'shortcuts';

const TAB_LABELS: Record<Tab, string> = {
  business: 'Business',
  loyalty: 'Loyalty',
  money: 'Money',
  people: 'People',
  shortcuts: 'Shortcuts',
};

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: 'Owner',
  staff: 'Barista',
  kiosk: 'Kiosk iPad',
};

const ICON_OPTIONS = [
  'link',
  'credit-card',
  'instagram',
  'message-circle',
  'map-pin',
  'image',
  'mail',
  'globe',
  'calendar',
  'file-text',
];

const ICONS: Record<string, typeof LinkIcon> = {
  link: LinkIcon,
  'credit-card': CreditCard,
  instagram: Instagram,
  'message-circle': MessageCircle,
  'map-pin': MapPin,
  image: ImageIcon,
  mail: Mail,
  globe: Globe,
  calendar: Calendar,
  'file-text': FileText,
};

function toNumber(value: string): number {
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function SettingsView({
  basics,
  settings,
  profiles,
  expenses,
  links,
  isAdmin,
  currentProfileId,
}: {
  basics: BusinessBasics;
  settings: BusinessSettings | null;
  profiles: Profile[] | null;
  expenses: Expense[] | null;
  links: ShortcutLink[];
  isAdmin: boolean;
  currentProfileId: string;
}) {
  const tabs: Tab[] = isAdmin
    ? ['business', 'loyalty', 'money', 'people', 'shortcuts']
    : ['shortcuts'];
  const [tab, setTab] = useState<Tab>(tabs[0]);

  return (
    <div>
      <SectionHeading
        title="Settings"
        subtitle={`How ${basics.name} is set up: targets, running costs, people and the links you use every day.`}
      />

      {tabs.length > 1 && (
        <div className="mb-5">
          <FilterTabs
            options={tabs.map((value) => ({ value, label: TAB_LABELS[value] }))}
            value={tab}
            onChange={setTab}
          />
        </div>
      )}

      {!isAdmin && (
        <Card className="mb-5">
          <CardBody>
            <p className="text-sm text-ink">
              Money, targets and people are on the owner&rsquo;s login only. Everything else you
              need for a shift is on the other screens.
            </p>
          </CardBody>
        </Card>
      )}

      {tab === 'business' && settings && <BusinessCard settings={settings} />}
      {tab === 'loyalty' && settings && <LoyaltyCard settings={settings} />}
      {tab === 'money' && settings && expenses && (
        <MoneyTab settings={settings} expenses={expenses} />
      )}
      {tab === 'people' && profiles && (
        <PeopleTab profiles={profiles} currentProfileId={currentProfileId} />
      )}
      {tab === 'shortcuts' && <ShortcutsTab links={links} isAdmin={isAdmin} />}
    </div>
  );
}

/** Shared submit plumbing: one pending flag, a toast, and a data refresh. */
function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, successMessage: string, onDone?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successMessage);
        router.refresh();
        onDone?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return { pending, run };
}

// ── Business ───────────────────────────────────────────────────────────────

function BusinessCard({ settings }: { settings: BusinessSettings }) {
  const { pending, run } = useAction();
  const [form, setForm] = useState({
    name: settings.name,
    slogan: settings.slogan,
    operating_days: String(settings.operating_days),
    daily_cup_target: String(settings.daily_cup_target),
    weekly_revenue_target: String(settings.weekly_revenue_target),
    monthly_net_target: String(settings.monthly_net_target),
  });

  function submit() {
    run(
      () =>
        saveBusiness({
          ...settings,
          name: form.name,
          slogan: form.slogan,
          operating_days: toNumber(form.operating_days),
          daily_cup_target: toNumber(form.daily_cup_target),
          weekly_revenue_target: toNumber(form.weekly_revenue_target),
          monthly_net_target: toNumber(form.monthly_net_target),
        }),
      'Business details saved.',
    );
  }

  return (
    <Card>
      <CardHeader
        title="Business"
        subtitle="The name and the numbers every other screen measures against."
      />
      <CardBody className="space-y-4">
        <FormGrid>
          <Field label="Business name" hint="Appears on the website footer and the loyalty page.">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </Field>

          <Field label="Slogan" hint="Used as the fallback line under the website headline.">
            <Input
              value={form.slogan}
              onChange={(event) => setForm({ ...form, slogan: event.target.value })}
            />
          </Field>

          <Field
            label="Trading days a week"
            hint="Turns weekly costs into a daily break-even figure."
          >
            <Input
              type="number"
              min={1}
              max={7}
              value={form.operating_days}
              onChange={(event) => setForm({ ...form, operating_days: event.target.value })}
            />
          </Field>

          <Field label="Daily cup target" hint="The line on the Today screen you are chasing.">
            <Input
              type="number"
              min={0}
              value={form.daily_cup_target}
              onChange={(event) => setForm({ ...form, daily_cup_target: event.target.value })}
            />
          </Field>

          <Field label="Weekly revenue target (R)" hint="Drives the weekly progress bars.">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.weekly_revenue_target}
              onChange={(event) => setForm({ ...form, weekly_revenue_target: event.target.value })}
            />
          </Field>

          <Field
            label="Monthly net profit target (R)"
            hint="What you want left after every cost, not turnover."
          >
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.monthly_net_target}
              onChange={(event) => setForm({ ...form, monthly_net_target: event.target.value })}
            />
          </Field>
        </FormGrid>

        <div className="flex justify-end">
          <Button onClick={submit} loading={pending}>
            Save business
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Loyalty ────────────────────────────────────────────────────────────────

function LoyaltyCard({ settings }: { settings: BusinessSettings }) {
  const { pending, run } = useAction();
  const [freeAt, setFreeAt] = useState(String(settings.loyalty_free_at));

  const next = toNumber(freeAt);
  const changed = next !== settings.loyalty_free_at;

  return (
    <Card>
      <CardHeader title="Loyalty card" subtitle="One rule, used by the kiosk and the hub alike." />
      <CardBody className="space-y-4">
        <Field
          label="Stamps for a free drink"
          hint="Every customer's card is measured against this number."
          className="max-w-xs"
        >
          <Input
            type="number"
            min={1}
            max={50}
            value={freeAt}
            onChange={(event) => setFreeAt(event.target.value)}
          />
        </Field>

        <div className="rounded-[10px] border-l-4 border-warn bg-warn/8 px-4 py-3">
          <p className="text-sm font-semibold text-ink">This changes existing cards immediately.</p>
          <p className="mt-1 text-xs text-steel">
            {changed && next > 0
              ? `Someone sitting on ${settings.loyalty_free_at} of ${settings.loyalty_free_at} stamps becomes ${settings.loyalty_free_at} of ${next}. Raising it takes a free drink away from anyone who was ready to claim one.`
              : 'Raising the number takes a free drink away from anyone who was ready to claim one. Lowering it hands out free drinks the moment you save.'}
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() =>
              run(
                () => saveBusiness({ ...settings, loyalty_free_at: next }),
                'Loyalty card updated.',
              )
            }
            loading={pending}
          >
            Save loyalty rule
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ── Money ──────────────────────────────────────────────────────────────────

interface ExpenseDraft {
  id: string | null;
  name: string;
  category: string;
  monthly_amount: string;
  active: boolean;
  admin_only: boolean;
}

function MoneyTab({ settings, expenses }: { settings: BusinessSettings; expenses: Expense[] }) {
  const rates = useAction();
  const rows = useAction();
  const [vat, setVat] = useState(String(settings.vat_rate));
  const [cardFee, setCardFee] = useState(String(settings.card_fee_rate));
  const [draft, setDraft] = useState<ExpenseDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null);

  const perMonth = monthlyFixedCosts(expenses);
  const perWeek = weeklyFixedCosts(expenses);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Rates" subtitle="Used by every profit figure in the reports." />
        <CardBody className="space-y-4">
          <FormGrid>
            <Field label="VAT rate (%)" hint="Prices include VAT, so this splits it back out.">
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={vat}
                onChange={(event) => setVat(event.target.value)}
              />
            </Field>

            <Field
              label="Yoco card fee (%)"
              hint="Taken off every card sale before anything is profit."
            >
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={cardFee}
                onChange={(event) => setCardFee(event.target.value)}
              />
            </Field>
          </FormGrid>

          <div className="flex justify-end">
            <Button
              onClick={() =>
                rates.run(
                  () =>
                    saveBusiness({
                      ...settings,
                      vat_rate: toNumber(vat),
                      card_fee_rate: toNumber(cardFee),
                    }),
                  'Rates saved.',
                )
              }
              loading={rates.pending}
            >
              Save rates
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Monthly running costs"
          subtitle="What the trailer costs whether it sells a cup or not."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDraft({
                  id: null,
                  name: '',
                  category: 'Operations',
                  monthly_amount: '',
                  active: true,
                  admin_only: false,
                })
              }
            >
              <Plus className="size-3.5" />
              Add cost
            </Button>
          }
        />
        <CardBody className="pt-0">
          <p className="py-3 text-xs text-steel">
            Costs marked <span className="font-semibold text-ink">Owner only</span> are invisible to
            staff logins — that is where wages and rent belong.
          </p>

          {expenses.length === 0 ? (
            <EmptyState
              title="No running costs yet"
              body="Add rent, wages, gas, insurance and Wi-Fi so break-even means something."
            />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Cost</Th>
                    <Th>Category</Th>
                    <Th align="right">Per month</Th>
                    <Th>Status</Th>
                    <Th align="right">&nbsp;</Th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <Tr key={expense.id} tone={expense.active ? undefined : 'warn'}>
                      <Td>
                        <span className="font-semibold text-ink">{expense.name}</span>
                      </Td>
                      <Td>
                        <span className="text-steel">{expense.category}</span>
                      </Td>
                      <Td align="right">{money(Number(expense.monthly_amount))}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1.5">
                          {expense.active ? (
                            <Badge tone="good">Active</Badge>
                          ) : (
                            <Badge tone="neutral">Paused</Badge>
                          )}
                          {expense.admin_only && <Badge tone="ink">Owner only</Badge>}
                        </div>
                      </Td>
                      <Td align="right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setDraft({
                                id: expense.id,
                                name: expense.name,
                                category: expense.category,
                                monthly_amount: String(Number(expense.monthly_amount)),
                                active: expense.active,
                                admin_only: expense.admin_only,
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Delete ${expense.name}`}
                            onClick={() => setConfirmDelete(expense)}
                          >
                            <Trash2 className="size-4 text-bad" />
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}

          <div className="mt-4 flex flex-wrap gap-6 rounded-[10px] bg-cream px-4 py-3">
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.09em] text-steel uppercase">
                Active per month
              </p>
              <p className="tabular mt-1 text-lg font-bold text-ink">{money(perMonth)}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.09em] text-steel uppercase">
                Active per week
              </p>
              <p className="tabular mt-1 text-lg font-bold text-ink">{money(perWeek)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit running cost' : 'Add running cost'}
        subtitle="Monthly amounts only. The weekly figure is worked out for you."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              loading={rows.pending}
              onClick={() => {
                if (!draft) return;
                rows.run(
                  () =>
                    saveExpense({
                      id: draft.id,
                      name: draft.name,
                      category: draft.category,
                      monthly_amount: toNumber(draft.monthly_amount),
                      active: draft.active,
                      admin_only: draft.admin_only,
                    }),
                  'Running cost saved.',
                  () => setDraft(null),
                );
              }}
            >
              Save cost
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Name" hint="How you would describe it on a bank statement.">
              <Input
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                placeholder="Site rental / pitch fee"
              />
            </Field>

            <FormGrid>
              <Field label="Category" hint="Groups the cost in the reports.">
                <Select
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Amount per month (R)" hint="An average is fine for things that vary.">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.monthly_amount}
                  onChange={(event) => setDraft({ ...draft, monthly_amount: event.target.value })}
                />
              </Field>
            </FormGrid>

            <div className="space-y-2.5 rounded-[10px] bg-cream p-4">
              <Checkbox
                checked={draft.active}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
                label="Counting towards costs right now"
                hint="Untick to keep the row but leave it out of break-even."
              />
              <Checkbox
                checked={draft.admin_only}
                onChange={(event) => setDraft({ ...draft, admin_only: event.target.checked })}
                label="Owner only"
                hint="Hidden from staff logins, in the app and in the database."
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this cost?"
        subtitle="Past reports will be recalculated without it."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              loading={rows.pending}
              onClick={() => {
                if (!confirmDelete) return;
                rows.run(() => deleteExpense(confirmDelete.id), 'Running cost deleted.', () =>
                  setConfirmDelete(null),
                );
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-steel">
          {confirmDelete?.name} at {money(Number(confirmDelete?.monthly_amount ?? 0))} a month. If
          you only want it out of the sums for now, untick &ldquo;counting towards costs&rdquo;
          instead.
        </p>
      </Modal>
    </div>
  );
}

// ── People ─────────────────────────────────────────────────────────────────

function PeopleTab({
  profiles,
  currentProfileId,
}: {
  profiles: Profile[];
  currentProfileId: string;
}) {
  const [pinFor, setPinFor] = useState<Profile | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="People"
          subtitle="Who can sign in, and what they are allowed to see."
          action={
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" />
              Add person
            </Button>
          }
        />
        <CardBody className="space-y-4">
          <div className="rounded-[10px] bg-cream px-4 py-3 text-xs leading-relaxed text-steel">
            <p>
              Each person gets their own PIN. They see their own name on the hub. Five wrong tries
              locks that device for a minute.
            </p>
            <p className="mt-1.5">
              They sign in with the PIN on the iPad. The email is only so the account is real — they
              do not need to open it, and they should not share your Gmail.
            </p>
          </div>

          {profiles.length === 0 ? (
            <EmptyState title="Nobody to show" body="Add the first person with the button above." />
          ) : (
            <ul className="space-y-3">
              {profiles.map((profile) => (
                <PersonRow
                  key={profile.id}
                  profile={profile}
                  isSelf={profile.id === currentProfileId}
                  onSetPin={() => setPinFor(profile)}
                />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <AddPersonModal open={adding} onClose={() => setAdding(false)} />
      <PinModal profile={pinFor} onClose={() => setPinFor(null)} />
    </div>
  );
}

function AddPersonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pending, run } = useAction();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [pin, setPin] = useState('');

  function close() {
    setDisplayName('');
    setEmail('');
    setRole('staff');
    setPin('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a person"
      subtitle="They get their own hub login. Give them the PIN in person."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            loading={pending}
            onClick={() =>
              run(
                () =>
                  addPerson({
                    display_name: displayName,
                    email,
                    role,
                    pin,
                  }),
                `${displayName.trim() || 'They'} can sign in with their PIN.`,
                close,
              )
            }
          >
            Add person
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" hint="Shown on the hub: Morning, Sipho.">
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
            placeholder="Sipho"
          />
        </Field>
        <Field
          label="Email"
          hint="Needed for the account. They use the PIN day to day, not this inbox."
        >
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="off"
            placeholder="sipho@example.com"
          />
        </Field>
        <Field label="Role" hint={ROLE_HINTS[role]}>
          <Select value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>
            {(['staff', 'admin', 'kiosk'] as StaffRole[]).map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="PIN" hint="4 to 8 digits. Unique to this person. Not your PIN.">
          <Input
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="••••"
            className="tabular text-center text-lg tracking-[0.4em]"
          />
        </Field>
      </div>
    </Modal>
  );
}

function PersonRow({
  profile,
  isSelf,
  onSetPin,
}: {
  profile: Profile;
  isSelf: boolean;
  onSetPin: () => void;
}) {
  const { pending, run } = useAction();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [role, setRole] = useState<StaffRole>(profile.role);
  const [active, setActive] = useState(profile.active);

  return (
    <li className="rounded-[10px] border border-line p-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <div className="min-w-0 space-y-3">
          <Field label="Name" hint="Shown on the hub and against every log entry.">
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </Field>

          <p className="truncate text-xs text-steel">
            {profile.email ?? 'No email on this login'}
            {isSelf && <span className="ml-2 font-semibold text-ink">· you</span>}
          </p>
        </div>

        <div className="space-y-3">
          <Field label="Role" hint={ROLE_HINTS[role]}>
            <Select value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>
              {(['admin', 'staff', 'kiosk'] as StaffRole[]).map((option) => (
                <option key={option} value={option}>
                  {ROLE_LABELS[option]}
                </option>
              ))}
            </Select>
          </Field>

          <Checkbox
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            label="Can sign in"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onSetPin}>
          <KeyRound className="size-3.5" />
          Set PIN
        </Button>
        <Button
          size="sm"
          loading={pending}
          onClick={() =>
            run(
              () => saveProfile({ id: profile.id, display_name: displayName, role, active }),
              `${displayName} saved.`,
            )
          }
        >
          Save
        </Button>
      </div>
    </li>
  );
}

const ROLE_HINTS: Record<StaffRole, string> = {
  admin: 'Sees money, wages and every setting.',
  staff: 'Runs the shift. No wages, no net profit.',
  kiosk: 'Locked to the loyalty screen on the iPad.',
};

function PinModal({ profile, onClose }: { profile: Profile | null; onClose: () => void }) {
  const { pending, run } = useAction();
  const [pin, setPin] = useState('');

  function close() {
    setPin('');
    onClose();
  }

  return (
    <Modal
      open={profile !== null}
      onClose={close}
      title={profile ? `PIN for ${profile.display_name}` : 'Set PIN'}
      subtitle="Used to unlock the hub on a shared phone or tablet."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            loading={pending}
            onClick={() => {
              if (!profile) return;
              run(() => setStaffPin({ profileId: profile.id, pin }), 'PIN set.', close);
            }}
          >
            Set PIN
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="New PIN" hint="4 to 8 digits. Tell them in person, not over WhatsApp.">
          <Input
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="••••"
            className="tabular text-center text-lg tracking-[0.4em]"
          />
        </Field>

        <p className="text-xs leading-relaxed text-steel">
          The PIN is hashed on the server, so nobody — including you — can read it back. Five wrong
          tries locks that device for a minute. Setting a new PIN replaces the old one straight away.
        </p>
      </div>
    </Modal>
  );
}

// ── Shortcuts ──────────────────────────────────────────────────────────────

interface LinkDraft {
  id: string | null;
  label: string;
  url: string;
  icon: string;
  position: string;
}

function ShortcutsTab({ links, isAdmin }: { links: ShortcutLink[]; isAdmin: boolean }) {
  const { pending, run } = useAction();
  const [draft, setDraft] = useState<LinkDraft | null>(null);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Shortcuts"
          subtitle="The tools you already pay for, one tap away."
          action={
            isAdmin ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    id: null,
                    label: '',
                    url: '',
                    icon: 'link',
                    position: String(links.length + 1),
                  })
                }
              >
                <Plus className="size-3.5" />
                Add shortcut
              </Button>
            ) : undefined
          }
        />
        <CardBody className="space-y-3">
          <p className="text-xs text-steel">
            These open Yoco, Instagram and the rest in a new tab. The app does not rebuild those
            tools or read anything back from them.
          </p>

          {links.length === 0 ? (
            <EmptyState
              title="No shortcuts yet"
              body="Add the sites you open every week: Yoco, Instagram, WhatsApp Web."
            />
          ) : (
            <ul className="divide-y divide-line-soft">
              {links.map((link) => {
                const Icon = ICONS[link.icon] ?? LinkIcon;
                return (
                  <li key={link.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-ink-wash text-ink">
                      <Icon className="size-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{link.label}</p>
                      <p className="truncate text-xs text-steel">{link.url}</p>
                    </div>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:underline"
                    >
                      Open
                      <ExternalLink className="size-3.5" />
                    </a>

                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setDraft({
                              id: link.id,
                              label: link.label,
                              url: link.url,
                              icon: link.icon,
                              position: String(link.position),
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Remove ${link.label}`}
                          loading={pending}
                          onClick={() =>
                            run(() => deleteStaffLink(link.id), `${link.label} removed.`)
                          }
                        >
                          <Trash2 className="size-4 text-bad" />
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit shortcut' : 'Add shortcut'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              loading={pending}
              onClick={() => {
                if (!draft) return;
                run(
                  () =>
                    saveStaffLink({
                      id: draft.id,
                      label: draft.label,
                      url: draft.url,
                      icon: draft.icon,
                      position: toNumber(draft.position),
                    }),
                  'Shortcut saved.',
                  () => setDraft(null),
                );
              }}
            >
              Save shortcut
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Label" hint="What you would call it out loud.">
              <Input
                value={draft.label}
                onChange={(event) => setDraft({ ...draft, label: event.target.value })}
                placeholder="Yoco portal"
              />
            </Field>

            <Field label="Address" hint="Paste the full link, including https://">
              <Input
                value={draft.url}
                onChange={(event) => setDraft({ ...draft, url: event.target.value })}
                placeholder="https://portal.yoco.com"
              />
            </Field>

            <FormGrid>
              <Field label="Icon" hint="Only changes the little square beside the label.">
                <Select
                  value={draft.icon}
                  onChange={(event) => setDraft({ ...draft, icon: event.target.value })}
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Position" hint="Lower numbers sit higher in the list.">
                <Input
                  type="number"
                  min={0}
                  value={draft.position}
                  onChange={(event) => setDraft({ ...draft, position: event.target.value })}
                />
              </Field>
            </FormGrid>
          </div>
        )}
      </Modal>
    </div>
  );
}
