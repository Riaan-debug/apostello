# Apostellō Coffee Co.

Public website, staff hub, and iPad loyalty kiosk — Next.js + Supabase.

**Read [`CONTINUE.md`](CONTINUE.md) first.** That file is the handoff from 8 Sep 2026: what we built today, what is still left, and how to run this on another PC.

```
git clone -b rebuild https://github.com/Riaan-debug/apostello.git
cd apostello
npm install
```

Copy `.env.example` to `.env.local` and fill the three keys from the **apostello** Supabase project. Never commit `.env.local`.

```
npm run dev
```

Opens at http://localhost:6589

The old static HTML hub is still on GitHub `main`. This Next.js rebuild lives on the **`rebuild`** branch.
