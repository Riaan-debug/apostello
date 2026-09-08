'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardCheck,
  Coffee,
  Globe,
  Heart,
  LayoutGrid,
  LogOut,
  Menu as MenuIcon,
  Monitor,
  Package,
  Settings,
  TrendingUp,
  X,
} from 'lucide-react';
import { Wordmark } from '@/components/Wordmark';
import { cn } from '@/lib/cn';
import { hasSupabaseEnv } from '@/lib/env';
import { OutboxProvider } from '@/lib/offline/OutboxProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { SyncBadge } from './SyncBadge';
import { ServiceWorker } from './ServiceWorker';

interface NavItem {
  href: string;
  label: string;
  Icon: typeof LayoutGrid;
  adminOnly?: boolean;
}

const PRIMARY: NavItem[] = [
  { href: '/hub', label: 'Today', Icon: LayoutGrid },
  { href: '/hub/crm', label: 'Loyalty & customers', Icon: Heart },
  { href: '/hub/daily', label: 'Close of day', Icon: ClipboardCheck },
  { href: '/hub/stock', label: 'Stock take', Icon: Package },
  { href: '/hub/checklists', label: 'Checklists', Icon: ClipboardCheck },
];

const SECONDARY: NavItem[] = [
  { href: '/hub/menu', label: 'Menu & costing', Icon: Coffee },
  { href: '/hub/reports', label: 'Reports', Icon: TrendingUp, adminOnly: true },
  { href: '/hub/site', label: 'Website', Icon: Globe },
  { href: '/hub/settings', label: 'Settings', Icon: Settings },
];

export function HubShell({
  children,
  displayName,
  role,
  businessName,
  isAdmin,
}: {
  children: ReactNode;
  displayName: string;
  role: string;
  businessName: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const visible = (items: NavItem[]) => items.filter((item) => !item.adminOnly || isAdmin);

  const isActive = (href: string) =>
    href === '/hub' ? pathname === '/hub' : pathname.startsWith(href);

  return (
    <ToastProvider>
      <OutboxProvider>
        <ServiceWorker />
        <div className="min-h-dvh bg-cream lg:pl-64">
          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink transition-transform duration-200 lg:translate-x-0',
              open ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-5">
              <Link href="/hub" onClick={() => setOpen(false)}>
                <Wordmark tone="cream" size="md" withTagline />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-cream/40 hover:text-cream lg:hidden"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto pb-4">
              <NavGroup
                items={visible(PRIMARY)}
                isActive={isActive}
                onNavigate={() => setOpen(false)}
              />
              <p className="mt-6 mb-1 px-6 text-[10px] font-semibold tracking-[0.16em] text-cream/25 uppercase">
                Manage
              </p>
              <NavGroup
                items={visible(SECONDARY)}
                isActive={isActive}
                onNavigate={() => setOpen(false)}
              />

              <div className="mt-6 px-4">
                <Link
                  href="/kiosk"
                  className="flex items-center gap-2.5 rounded-[10px] border border-cream/15 px-3.5 py-3 text-sm font-semibold text-cream/70 transition-colors hover:border-cream/40 hover:text-cream"
                >
                  <Monitor className="size-4" />
                  Open kiosk mode
                </Link>
              </div>
            </nav>

            <div className="border-t border-cream/10 px-6 py-4">
              <p className="truncate text-sm font-semibold text-cream">{displayName}</p>
              <p className="text-[11px] text-cream/40 capitalize">
                {role} · {businessName}
              </p>
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/auth/signout', { method: 'POST' });
                  window.location.assign('/login');
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-cream/40 hover:text-cream"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          </aside>

          {open && (
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-ink-deep/50 lg:hidden"
            />
          )}

          {/* ── Topbar ──────────────────────────────────────────────── */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-ink lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="size-5" />
            </button>

            <span className="hidden text-xs font-semibold text-steel sm:block">
              {new Date().toLocaleDateString('en-ZA', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>

            <div className="ml-auto flex items-center gap-3">
              <SyncBadge />
            </div>
          </header>

          <main className="px-4 py-6 pb-20 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-6xl">
              {!hasSupabaseEnv() && (
                <p className="mb-5 rounded-[10px] border border-gold/30 bg-[#fff8dc] px-4 py-2.5 text-sm text-ink">
                  Preview with sample data. Nothing here is the live trailer until Supabase is
                  connected.
                </p>
              )}
              {children}
            </div>
          </main>
        </div>
      </OutboxProvider>
    </ToastProvider>
  );
}

function NavGroup({
  items,
  isActive,
  onNavigate,
}: {
  items: NavItem[];
  isActive: (href: string) => boolean;
  onNavigate: () => void;
}) {
  return (
    <ul>
      {items.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 border-l-[3px] px-6 py-2.5 text-sm transition-colors',
                active
                  ? 'border-cream bg-cream/10 font-semibold text-cream'
                  : 'border-transparent text-cream/55 hover:bg-cream/[0.06] hover:text-cream',
              )}
            >
              <Icon className={cn('size-4 shrink-0', active ? 'opacity-100' : 'opacity-70')} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
