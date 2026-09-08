# Apostellō — where we left off (8 Sep 2026)

This folder is the **live product**: Next.js public site + staff hub + iPad kiosk, on a new Supabase project (not Luhandre’s, not the JSON-blob home hub).

The GitHub repo `Riaan-debug/apostello` still has the old static hub on `main`. **This rebuild is on the `rebuild` branch.** At home:

```
git clone -b rebuild https://github.com/Riaan-debug/apostello.git
cd apostello
npm install
```

Copy `.env.example` to `.env.local`. Fill the three keys from **Supabase → Project Settings → API Keys** (project `apostello`, org Riaan-debug). Do not commit `.env.local`. Then:

```
npm run dev
```

App: http://localhost:6589  
Hub: http://localhost:6589/login → **Owner** (your Gmail)  
Kiosk: http://localhost:6589/kiosk

---

## What we built today

- Wired a **new** Supabase project (EU / Ireland). Real tables, not `apc_data` JSON.
- Owner account is **you** (`vanrhynriaan85@gmail.com`). First user = admin.
- **Add person** in Hub → Settings → People (name, email, role, PIN). No need to use the Supabase dashboard for staff.
- Public site talks to that database (menu, hours, special, photos).
- Hero: photo or looping silent video, with a soft navy fade behind the words (not a hard box).
- Special of the week: full photo, small portrait frame (not a cropped landscape box).
- Kiosk number pad accepts a **keyboard** (digits, Backspace, Escape/Delete, Enter).
- **Videos** on the home page (“From the trailer”). Hub → Website → Videos.
- Bjorn’s three WhatsApp ads were compressed to 1080p MP4 and uploaded (7s, 22s, 29s). The 7s clip is also the hero video (silent loop). The other two play with sound in that band.
- Preview-without-keys still exists if `.env.local` is empty (yellow sample banner). With keys, it is live data.

## What we did *not* finish (do these next)

1. **Host it** — Netlify or Cloudflare Pages. Same three env vars as production. Then it is a real URL, not localhost.
2. **Domain** — point apostellocoffee.co.za DNS at that host (domain can stay on domains.co.za).
3. **Bjorn’s login** — Add person, role Owner, his email + his PIN.
4. **Café copy** — phone, Instagram, real trailer photos. Remove the Dreamstime stock hero when you have a real shot.
5. **Google Business Profile** — not code; Bjorn (or you) does this in Google.
6. **Old loyalty customers** — only if you have a JSON/CSV export from the old hub (`npm run migrate:legacy`). Otherwise the card list starts empty.
7. **Staff PINs** for baristas who are not you or Bjorn.
8. **Do not force-push** the old `main` (static hub) unless you mean to replace it.

## Accounts (no secrets in this file)

| Thing | Where |
|---|---|
| Supabase | Riaan-debug’s Org → project **apostello** (Free, West EU) |
| Database password | Word doc on this PC (Postgres only — not in `.env.local`) |
| App keys | `.env.local` on this PC; also in Supabase → API Keys |
| GitHub | https://github.com/Riaan-debug/apostello |

Publishable key goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Secret key goes in `SUPABASE_SERVICE_ROLE_KEY`. Never commit either.

## Intentionally not built

Suppliers, purchases, maintenance, online ordering, Yoco checkout (paste the day total at close). Instagram/WhatsApp/Canva stay links.
