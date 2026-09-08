# Apostellō rebuild

Do not rebuild Luhandre’s café OS as another all-in-one app. Split the public website from the staff hub, put both on a real database, and only rebuild what the trailer uses every day.

Do **not** lead tomorrow’s call with a rebuild. Bjorn asked for hosting, upkeep, and a Google page. Rescue first, watch what they actually use for two to four weeks, then rebuild only the pieces that justify it.

A one-trailer café does not need a custom ERP. It needs a site Google can find, a kiosk that stamps loyalty, a 5-minute close of day, and someone who can change a price without breaking the iPad.

---

## The trap in the current files

The hub is Excel rebuilt as a website:

- one giant `app.js`
- one Supabase table of JSON blobs (`apc_data`)
- PIN login for local use, email login for cloud
- a kiosk bolted on

That is a decent prototype. It is a poor production system for a business you will be paid to keep alive.

Two devices saving the customer list at the same time can overwrite each other, because the whole array is one row. There is no offline queue once you force the cloud. The public café website Bjorn thinks he has is **not in the Files folder**.

---

## What I would actually do

| Move | Why |
|---|---|
| Two surfaces, one brand | Public site for customers. Hub + kiosk for staff. Same menu data. |
| Real Postgres tables | Customers, visits, stock, daily logs as rows. Not spreadsheet JSON. |
| Offline-capable iPad | Trailer Wi-Fi is the constraint. Kiosk and stock must queue writes. |
| Bjorn owns the accounts | GitHub, Supabase, Netlify/Cloudflare, domain, Google. You are admin. |
| Cut the fake accounting suite | Yoco already has sales. Keep a simple daily close. Export CSV for the books. |

---

## Two products, one source of truth

Customers never see the hub. Staff never edit the public site in a page builder. Menu, hours, and this week’s special live in the database.

```
Customer  →  Google listing  →  Public website  →  Supabase
Staff iPad →  Loyalty kiosk  →  Staff hub       →  Supabase
Bjorn      →  Staff hub
```

### Public website + Google (what he asked for)

Hours, CMV Business Park, menu, photos, Instagram, contact, map. Fast on mobile. Easy for you to swap a special or a photo.

This is the monthly “new stuff we upload” surface. Google Business Profile stays a separate checklist, not code.

### Hub + iPad kiosk (what they already use)

Loyalty stamps, customer list, daily cups and Yoco total, stock alerts, recipes. Runs as a home-screen app on the iPad.

Owner sees P&L-style numbers as a report, not as a second set of books. Staff never see wages or net profit.

Luhandre said not to use the formatted-text version of the domain. Believe him. Transfer the domain, point DNS at the new public site, and leave that builder behind.

---

## Keep, rebuild, or drop

| Feature | Verdict | Notes |
|---|---|---|
| Public website | **Build new** | Not in the files. This is the actual website job. |
| Loyalty kiosk + CRM | **Rebuild** | Core daily use. Needs rows, not one JSON array. |
| Daily log | **Rebuild** | Five-minute close. Feeds weekly numbers. |
| Stock take | **Rebuild** | ~20 items. Reorder alerts. Must work offline. |
| Recipes / menu | **Rebuild thin** | One menu table feeds the public site and costing. |
| Checklists | **Rebuild thin** | Opening and closing. Simple done/not-done log. |
| Weekly / monthly numbers | **Simplify** | Derive from daily log + a few cost fields. CSV export. |
| Suppliers / maintenance / purchases | **Phase 2** | Useful, not why the iPad exists. |
| Yoco | **Link only** | Do not rebuild payments. Paste the day’s total at close. |
| Instagram, WhatsApp, Canva, Mailchimp | **Link only** | Hub shortcuts are enough. |
| Google Form → paste into CRM | **Drop** | Sign-up happens on the kiosk or a QR page you own. |
| Excel hub (`build_hub.py`) | **Drop** | Export from the live app if they want a spreadsheet. |
| Local PIN users + cloud users | **Drop dual system** | One auth model. Owner email, staff PIN hashed server-side. |

### Why the JSON store has to die

`apc_data` stores the entire customer list as one value. That cannot query “inactive 30 days” cheaply, cannot sync two iPads safely, and will get slower as loyalty grows. A rebuild that keeps that model is not a rebuild.

---

## Stack

Chosen so you can maintain it in Cursor, host it without domains.co.za cPanel fighting the app, and hand the keys to Bjorn.

| Layer | Choice | Why |
|---|---|---|
| Public + hub | Next.js App Router | One repo, one deploy. `/` for the café, `/hub` for staff, `/kiosk` for the iPad. |
| Language | TypeScript | Small files by domain (crm, stock, daily). Cursor can change a price without hunting 3,000 lines. |
| Database / auth | Supabase Postgres | They already know this name. Use it properly: tables, RLS, migrations in git. |
| Hosting | Cloudflare Pages or Netlify | Fits this stack. Domain stays on domains.co.za; DNS points here. |
| iPad | PWA | Add to Home Screen. Service worker + outbox for stamps, stock, daily log. |
| Images / specials | Supabase Storage + hub form | No extra CMS. Bjorn updates this week’s special in the hub; the public site reads it. |
| Region | Supabase EU | Closest sensible region for South Africa unless they open Johannesburg later. |

Do **not** put the app on ordinary domains.co.za shared hosting. Keep the **domain** there. Keep the **app** on Netlify or Cloudflare.

### Data shape (minimum)

One café for now, but still a `business_id` on every row so you never paint yourself into a single-tenant corner.

| Table | Holds |
|---|---|
| `profiles` | Staff: role admin or staff, display name |
| `customers` | Name, phone, email, opt-ins, stamps, last visit |
| `visits` / `stamp_events` | Each stamp or free coffee, with device time |
| `menu_items` + recipes | Prices, sizes, ingredient amounts |
| `stock_items` + `stock_counts` | Opening, sold, waste, reorder |
| `daily_logs` | Date, cups, Yoco total, notes, weather |
| `expenses` | Simple repeating costs for the weekly view |
| `site_content` | Hours, location, this week’s special, hero photo |

**Auth:** Owner signs in with email. Staff use a 4–8 digit PIN checked on the server, not stored in `app.js`. Sessions persist. Kiosk route cannot open P&L. After five bad PINs, lockout.

**Security:** Anon key in the browser is fine. Service role never ships to the iPad. RLS: staff can write ops data, only admin reads wages and net profit. GitHub org or Bjorn’s account; you as collaborator.

---

## How to sequence it

Sell three packages, not one vague monthly. The rebuild is optional and priced after you have seen the iPad in real use.

### Phase 0 — Takeover (this week)

Drive download, Bjorn-owned GitHub/Supabase/Netlify, domain DNS, Google owner transfer, hub live again on the existing code if needed so the iPad does not die.

### Phase 1 — Public site

Fast café site: menu, hours, location, photos, specials form in the hub, Google listing kept current. This matches what Bjorn asked for.

### Phase 2 — Hub rebuild

Real tables, PWA offline, kiosk, daily log, stock, CRM. Migrate `apc_data` JSON into rows. Kill the Excel generator.

### Phase 3 — Only if they use it

Suppliers, maintenance, purchase log, Mailchimp export, richer costing. Do not build this on speculation.

---

## How this maps to money

| Package | What it is |
|---|---|
| Once-off | Takeover + public site |
| Monthly | Hosting, Google, capped edits |
| Project (quoted separately) | Hub rebuild |

Monthly retainer should cover uptime, backups, domain, a few content swaps, and Google posts or photo updates. It should not silently include “rebuild the dashboard when we feel like it.”

### What to tell Bjorn if he asks about rebuilding

> I can keep what you have running, put a proper public website online, and move everything into your accounts. If we rebuild the iPad hub, we do it as its own project so loyalty and stock do not live in a spreadsheet-in-the-cloud anymore.
