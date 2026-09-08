# Apostellō Café hub (new)

Staff app + iPad loyalty kiosk. Old Luhandre files in `files/` are reference only. This app does **not** use his Netlify or Supabase keys.

## Open it

From this folder (needs a local server if you want to test like a phone — double-clicking `index.html` usually works for PIN/localStorage mode):

- Staff: `hub/index.html`
- iPad kiosk: `hub/kiosk.html` (or `index.html?kiosk=1`) — Add to Home Screen, then Guided Access

First staff visit: create a 4–8 digit PIN. Same PIN unlocks stamps on the kiosk.

Starter menu and stock come from the old hub. Loyalty starts empty unless you import a JSON backup.

## When you are ready for the cloud (iPad + phone sharing)

1. Create a **new** Supabase project (your account or Bjorn’s).
2. Run `sql/schema.sql` in the SQL editor.
3. Authentication → add a staff user (email + password).
4. Put the project URL and anon key in `js/supabase-client.js`.
5. Host the `hub/` folder on HTTPS (domains.co.za, Netlify, Cloudflare Pages — any static host).

Until those keys are filled, data stays in this browser only.

## Backup

Settings → Download backup. Import accepts the old hub’s JSON export if someone still has one (`customers`, `menuItems`, `stock`, `dailyLog`, `settings`).
