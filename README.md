# Beauty on Point — Cosmetics Shop ERP & AI POS

An AI-powered, offline-first ERP and point-of-sale system for a cosmetics
shop. Works on phone, tablet, and desktop; installable as an app (PWA);
keeps working with no internet and syncs automatically once you're back
online.

## What's working right now

- **Login** — the app is locked behind Supabase Auth. No one can view or
  edit your data without a staff account.
- **Products** — full CRUD, photo upload (Supabase Storage), camera barcode
  scanning, offline-first (saves instantly with no signal, syncs in the
  background).
- **Sales / POS** — search or scan a product, build a cart, apply a
  discount, choose a payment method (cash/M-Pesa/card/bank/credit), hold a
  sale and resume it later, complete the sale (this deducts stock
  automatically), then print or view the receipt.
- **Settings** — business name, address, phone, and receipt header/footer,
  used on every printed receipt.
- **Dashboard** — shell is real; the stats and charts are still placeholder
  numbers, not computed from your actual sales yet.

Everything else (Inventory adjustments, Customers, Suppliers, Purchases,
Expenses, Credit Notes, Reports, AI Insights) is scaffolded with its route
and folder ready, but not built out yet.

## Getting it online

1. **Create the Supabase project**
   - supabase.com → new project (free tier is fine to start).
   - Open **SQL Editor**, paste in the full contents of `supabase/schema.sql`
     from this project, and run it. This creates the `products`, `sales`,
     `suppliers`, and `app_settings` tables, the product-images storage
     bucket, and all the access policies — run it once.
   - **Project Settings → API** → copy the **Project URL** and **anon
     public key**.

2. **Create your staff login**
   - In Supabase: **Authentication → Users → Add user**. Add yourself (and
     any staff) with an email and password. That's the login for the app —
     there's no public sign-up screen by design.

3. **Add your Supabase keys locally**
   - Copy `.env.example` to `.env` and paste in your Project URL and anon
     key.

4. **Push to GitHub, then deploy on Netlify**
   - Push this folder to a new GitHub repo.
   - Netlify: **Add new site → Import from GitHub**, pick the repo.
   - Build command: `npm run build` · Publish directory: `dist`
     (already set in `netlify.toml`, so Netlify should detect these
     automatically).
   - **Before the first deploy**, add the two `VITE_SUPABASE_URL` and
     `VITE_SUPABASE_ANON_KEY` environment variables under
     **Site settings → Environment variables**, then deploy (or trigger a
     redeploy if you added them after the first build).
   - `netlify.toml` also includes the redirect rule that keeps pages like
     `/sales` working when someone refreshes or opens the link directly —
     without it, Netlify would 404 on anything but the homepage.

Once deployed, log in with the staff account you created in step 2 and
you're working — add a product with a photo, then ring up a sale.

## Local development (optional, if you're on a laptop)

```bash
npm install
npm run dev
```

## What "offline-first" means here

Every product save and every completed sale writes instantly to the
browser's local database (IndexedDB, via Dexie) — the app never waits on a
network request and never loses your work if the signal drops. When back
online, it automatically pushes anything unsynced up to Supabase and pulls
the latest data down. A small cloud icon marks any row that hasn't synced
yet.

## Design system

Pink (primary) / black (secondary) / gold (accent) / white background —
rounded cards, glass-blur panels, and a "freshness bar" on stock levels
(red → gold → green, factoring in expiry dates) matching the visual
language from your pharmacy POS builds.

## Known gaps to be aware of

- Everyone who logs in currently has full access — role-based permissions
  (Administrator/Manager/Cashier/Storekeeper) aren't wired up yet, even
  though the roles exist in the type system.
- Dashboard numbers are placeholder, not computed from real sales.
- No M-Pesa Daraja integration yet — "M-Pesa" is just a payment-method
  label on a sale, it doesn't trigger an STK push.
- Customers aren't linked to sales yet (no credit accounts, no loyalty
  points accrual).

## Next modules to build

Inventory (stock adjustments, transfers, stock take) and Customers (credit
accounts tied to Sales) are the natural next steps.
