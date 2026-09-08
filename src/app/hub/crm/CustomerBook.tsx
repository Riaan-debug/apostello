'use client';

import { useMemo, useState } from 'react';
import { Gift, Plus, Search, Stamp, UserPlus } from 'lucide-react';
import type { Customer } from '@/lib/db/types';
import { Button } from '@/components/ui/Button';
import { Badge, FilterTabs } from '@/components/ui/Badge';
import { Card, CardHeader, EmptyState, StatTile } from '@/components/ui/Card';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { Modal } from '@/components/ui/Modal';
import { Table, TableWrap, Td, Th, Tr } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { useOutbox } from '@/lib/offline/OutboxProvider';
import { newId } from '@/lib/offline/db';
import { count, relativeDays, shortDate } from '@/lib/domain/format';
import {
  FOUND_VIA_OPTIONS,
  STATUS_LABEL,
  customerStatus,
  normalisePhone,
  searchCustomers,
} from '@/lib/domain/loyalty';
import { CustomerDetail } from './CustomerDetail';

type Filter = 'all' | 'ready' | 'active' | 'lapsed' | 'banked';

export function CustomerBook({
  businessId,
  freeAt,
  initialCustomers,
}: {
  businessId: string;
  freeAt: number;
  initialCustomers: Customer[];
}) {
  const toast = useToast();
  const { submit } = useOutbox();

  const [customers, setCustomers] = useState(initialCustomers);
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: customers.length,
      ready: customers.filter((c) => c.stamps >= freeAt).length,
      active: customers.filter((c) => customerStatus(c) === 'active').length,
      lapsed: customers.filter((c) => customerStatus(c) === 'lapsed').length,
      banked: customers.filter((c) => c.banked_drinks > 0).length,
    }),
    [customers, freeAt],
  );

  const visible = useMemo(() => {
    const matched = searchCustomers(customers, term);
    switch (filter) {
      case 'ready':
        return matched.filter((c) => c.stamps >= freeAt);
      case 'active':
        return matched.filter((c) => customerStatus(c) === 'active');
      case 'lapsed':
        return matched.filter((c) => customerStatus(c) === 'lapsed');
      case 'banked':
        return matched.filter((c) => c.banked_drinks > 0);
      default:
        return matched;
    }
  }, [customers, term, filter, freeAt]);

  const openCustomer = customers.find((c) => c.id === openId) ?? null;

  /** Applies the change locally so the screen keeps up with the queue. */
  function patch(id: string, change: Partial<Customer>) {
    setCustomers((current) => current.map((c) => (c.id === id ? { ...c, ...change } : c)));
  }

  async function addStamp(customer: Customer) {
    await submit('stamp', {
      customerId: customer.id,
      source: 'hub',
      deviceTime: new Date().toISOString(),
    });

    const stamps = customer.stamps + 1;
    patch(customer.id, {
      stamps,
      visits: customer.visits + 1,
      last_visit: new Date().toISOString().slice(0, 10),
    });

    toast.success(
      stamps >= freeAt
        ? `${customer.name} has a full card — a free drink is ready`
        : `Stamped. ${stamps} of ${freeAt}`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Loyalty &amp; customers</h1>
          <p className="mt-1 text-sm text-steel">
            Every {freeAt}th cup is free. Stamps go on here or at the kiosk.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <UserPlus className="size-4" />
          Add customer
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="On the card" value={count(counts.all)} />
        <StatTile
          label="Free drinks ready"
          value={count(counts.ready)}
          tone={counts.ready > 0 ? 'good' : 'default'}
          icon={<Gift className="size-5" />}
        />
        <StatTile
          label="Active"
          value={count(counts.active)}
          hint="Visited in the last 30 days"
        />
        <StatTile
          label="Lapsed"
          value={count(counts.lapsed)}
          tone={counts.lapsed > 0 ? 'warn' : 'default'}
          hint="Not seen in over 45 days"
        />
      </div>

      <Card>
        <CardHeader
          title={`${count(visible.length)} ${visible.length === 1 ? 'customer' : 'customers'}`}
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel-light" />
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Name, number or email"
                className="w-full pl-9 sm:w-64"
              />
            </div>
          }
        />

        <div className="border-b border-line px-5 py-3">
          <FilterTabs<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Everyone', count: counts.all },
              { value: 'ready', label: 'Free drink ready', count: counts.ready },
              { value: 'active', label: 'Active', count: counts.active },
              { value: 'banked', label: 'Banked', count: counts.banked },
              { value: 'lapsed', label: 'Lapsed', count: counts.lapsed },
            ]}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Stamp className="size-7" />}
            title={term ? 'Nobody matches that' : 'No customers yet'}
            body={
              term
                ? 'Try part of a name or the last few digits of a number.'
                : 'Sign-ups come from the kiosk, the QR page or the button above.'
            }
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Card</Th>
                  <Th align="right">Visits</Th>
                  <Th>Last in</Th>
                  <Th>Status</Th>
                  <Th align="right" />
                </tr>
              </thead>
              <tbody>
                {visible.map((customer) => {
                  const status = customerStatus(customer);
                  const full = customer.stamps >= freeAt;
                  return (
                    <Tr key={customer.id} onClick={() => setOpenId(customer.id)}>
                      <Td>
                        <p className="font-semibold text-ink">{customer.name}</p>
                        <p className="text-[11px] text-steel">{customer.phone ?? '—'}</p>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1.5">
                          <Badge tone={full ? 'gold' : 'neutral'}>
                            {customer.stamps}/{freeAt}
                          </Badge>
                          {customer.banked_drinks > 0 && (
                            <Badge tone="ink">{customer.banked_drinks} banked</Badge>
                          )}
                        </span>
                      </Td>
                      <Td align="right">{count(customer.visits)}</Td>
                      <Td>
                        <span className="text-xs text-steel">
                          {relativeDays(customer.last_visit)}
                        </span>
                      </Td>
                      <Td>
                        <Badge
                          tone={
                            status === 'active'
                              ? 'good'
                              : status === 'win-back'
                                ? 'warn'
                                : status === 'lapsed'
                                  ? 'bad'
                                  : 'neutral'
                          }
                        >
                          {STATUS_LABEL[status]}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <Button
                          size="sm"
                          variant={full ? 'success' : 'outline'}
                          onClick={(event) => {
                            event.stopPropagation();
                            void addStamp(customer);
                          }}
                        >
                          <Plus className="size-3.5" />
                          Stamp
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      {openCustomer && (
        <CustomerDetail
          customer={openCustomer}
          freeAt={freeAt}
          onClose={() => setOpenId(null)}
          onPatch={patch}
        />
      )}

      <AddCustomer
        open={adding}
        businessId={businessId}
        onClose={() => setAdding(false)}
        onCreated={(customer) => setCustomers((current) => [customer, ...current])}
      />
    </div>
  );
}

/* ── Add customer ──────────────────────────────────────────────────────── */

function AddCustomer({
  open,
  businessId,
  onClose,
  onCreated,
}: {
  open: boolean;
  businessId: string;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}) {
  const toast = useToast();
  const { submit } = useOutbox();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [foundVia, setFoundVia] = useState('Walk-by');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setPhone('');
    setEmail('');
    setBirthday('');
    setNotes('');
    setFoundVia('Walk-by');
    setSmsOptIn(true);
    setEmailOptIn(false);
    setError(null);
  }

  async function save() {
    if (name.trim().length < 2) {
      setError('A first name is enough, but we need one.');
      return;
    }
    const digits = normalisePhone(phone);
    if (digits.length < 9) {
      setError('The cell number is how the kiosk finds their card.');
      return;
    }

    setBusy(true);
    const id = newId();
    const now = new Date().toISOString();

    await submit(
      'customer_create',
      {
        id,
        businessId,
        name: name.trim(),
        phone: phone.trim(),
        phoneNormalised: digits,
        email: email.trim() || null,
        foundVia,
        smsOptIn,
        emailOptIn,
        notes: notes.trim() || null,
        birthday: birthday || null,
      },
      id,
    );
    setBusy(false);

    onCreated({
      id,
      business_id: businessId,
      name: name.trim(),
      phone: phone.trim(),
      phone_normalised: digits,
      email: email.trim() || null,
      birthday: birthday || null,
      found_via: foundVia,
      notes: notes.trim() || null,
      sms_opt_in: smsOptIn,
      email_opt_in: emailOptIn,
      stamps: 0,
      visits: 0,
      free_coffees: 0,
      banked_drinks: 0,
      joined_on: now.slice(0, 10),
      last_visit: null,
      archived: false,
      created_at: now,
      updated_at: now,
    });

    toast.success(`${name.trim()} is on the card`);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add a customer"
      subtitle="Name and cell number is all that is needed"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button loading={busy} onClick={() => void save()}>
            Add to the card
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" required className="sm:col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Thandi" />
        </Field>
        <Field label="Cell number" required>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            placeholder="082 123 4567"
          />
        </Field>
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </Field>
        <Field label="How did they find us">
          <Select value={foundVia} onChange={(e) => setFoundVia(e.target.value)}>
            {FOUND_VIA_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Birthday" hint="Optional">
          <Input value={birthday} onChange={(e) => setBirthday(e.target.value)} type="date" />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Oat cappuccino, no sugar"
          />
        </Field>
      </div>

      <div className="mt-4 space-y-2.5 rounded-[10px] bg-cream p-4">
        <Checkbox
          checked={smsOptIn}
          onChange={(e) => setSmsOptIn(e.target.checked)}
          label="Happy to be texted when a free drink is waiting"
        />
        <Checkbox
          checked={emailOptIn}
          onChange={(e) => setEmailOptIn(e.target.checked)}
          label="Happy to get the occasional email"
        />
      </div>

      {error && <p className="mt-4 text-sm font-medium text-bad">{error}</p>}
    </Modal>
  );
}
