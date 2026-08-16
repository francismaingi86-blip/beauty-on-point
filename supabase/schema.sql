-- Beauty on Point — Products schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

-- Minimal suppliers stub so products.supplier_id has somewhere to point.
-- The full Suppliers module (contacts, KRA PIN, balances, statements) can
-- extend this table later without breaking the products FK.
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  kra_pin text,
  outstanding_balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  barcode text,
  sku text not null,
  name text not null,
  brand text,
  category text,
  subcategory text,
  buying_price numeric(12, 2) not null default 0,
  selling_price numeric(12, 2) not null default 0,
  wholesale_price numeric(12, 2),
  minimum_price numeric(12, 2),
  stock numeric(12, 2) not null default 0,
  minimum_stock numeric(12, 2) not null default 0,
  maximum_stock numeric(12, 2),
  expiry_date date,
  batch_number text,
  supplier_id uuid references suppliers(id) on delete set null,
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_sku_key on products (sku);
create index if not exists products_barcode_idx on products (barcode);
create index if not exists products_category_idx on products (category);

-- Keep updated_at fresh on every edit.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- Row Level Security: enable and allow authenticated staff full access.
-- Tighten this once roles (administrator/manager/cashier/storekeeper) are modeled.
alter table products enable row level security;

create policy "Authenticated staff can read products"
  on products for select
  to authenticated
  using (true);

create policy "Authenticated staff can write products"
  on products for insert
  to authenticated
  with check (true);

create policy "Authenticated staff can update products"
  on products for update
  to authenticated
  using (true);

create policy "Authenticated staff can delete products"
  on products for delete
  to authenticated
  using (true);

-- Product images bucket (run once; ignored if it already exists).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Product images: allow authenticated staff to upload/update/delete,
-- and let anyone read (so images render on the storefront/receipts).
create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Authenticated staff can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Authenticated staff can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated staff can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- Sales
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  items jsonb not null default '[]',
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  payment_method text not null default 'cash',
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists sales_set_updated_at on sales;
create trigger sales_set_updated_at
  before update on sales
  for each row execute function set_updated_at();

alter table sales enable row level security;

create policy "Authenticated staff can read sales"
  on sales for select to authenticated using (true);
create policy "Authenticated staff can write sales"
  on sales for insert to authenticated with check (true);
create policy "Authenticated staff can update sales"
  on sales for update to authenticated using (true);

-- Company / receipt settings — single row, id fixed to 1.
create table if not exists app_settings (
  id int primary key default 1,
  business_name text not null default 'Beauty on Point',
  address text,
  phone text,
  whatsapp text,
  email text,
  currency text not null default 'KES',
  receipt_header text,
  receipt_footer text,
  logo_url text,
  updated_at timestamptz not null default now()
);

insert into app_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists app_settings_set_updated_at on app_settings;
create trigger app_settings_set_updated_at
  before update on app_settings
  for each row execute function set_updated_at();

alter table app_settings enable row level security;

create policy "Authenticated staff can read settings"
  on app_settings for select to authenticated using (true);
create policy "Authenticated staff can update settings"
  on app_settings for update to authenticated using (true);

-- Staff accounts and roles.
-- New logins are created via the `create-staff` edge function (which uses
-- the service role key), and that function also inserts the matching row
-- here. The very first user ever created bootstraps themselves as
-- administrator the first time they open the app.
create table if not exists staff (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'cashier'
    check (role in ('administrator', 'manager', 'cashier', 'storekeeper')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists staff_set_updated_at on staff;
create trigger staff_set_updated_at
  before update on staff
  for each row execute function set_updated_at();

alter table staff enable row level security;

-- security definer so it can check the staff table without recursing into
-- the RLS policies that themselves call this function.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff where id = auth.uid() and role = 'administrator'
  );
$$;

create policy "Users can view own staff row, admins view all"
  on staff for select
  to authenticated
  using (id = auth.uid() or is_admin());

create policy "First user bootstraps as administrator"
  on staff for insert
  to authenticated
  with check (
    id = auth.uid()
    and role = 'administrator'
    and (select count(*) from staff) = 0
  );

create policy "Admins can add staff"
  on staff for insert
  to authenticated
  with check (is_admin());

create policy "Admins can update staff"
  on staff for update
  to authenticated
  using (is_admin());

create policy "Admins can remove staff"
  on staff for delete
  to authenticated
  using (is_admin());

-- Customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  credit_limit numeric(12, 2) not null default 0,
  current_balance numeric(12, 2) not null default 0,
  loyalty_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customers_set_updated_at on customers;
create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

alter table customers enable row level security;

create policy "Authenticated staff can read customers"
  on customers for select to authenticated using (true);
create policy "Authenticated staff can write customers"
  on customers for insert to authenticated with check (true);
create policy "Authenticated staff can update customers"
  on customers for update to authenticated using (true);
create policy "Authenticated staff can delete customers"
  on customers for delete to authenticated using (true);

-- Expenses
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric(12, 2) not null default 0,
  note text,
  receipt_url text,
  incurred_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists expenses_set_updated_at on expenses;
create trigger expenses_set_updated_at
  before update on expenses
  for each row execute function set_updated_at();

alter table expenses enable row level security;

create policy "Authenticated staff can read expenses"
  on expenses for select to authenticated using (true);
create policy "Authenticated staff can write expenses"
  on expenses for insert to authenticated with check (true);
create policy "Authenticated staff can update expenses"
  on expenses for update to authenticated using (true);
create policy "Authenticated staff can delete expenses"
  on expenses for delete to authenticated using (true);

-- Purchases (purchase orders from suppliers)
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete set null,
  items jsonb not null default '[]',
  total numeric(12, 2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'ordered', 'received', 'cancelled')),
  notes text,
  ordered_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists purchases_set_updated_at on purchases;
create trigger purchases_set_updated_at
  before update on purchases
  for each row execute function set_updated_at();

alter table purchases enable row level security;

create policy "Authenticated staff can read purchases"
  on purchases for select to authenticated using (true);
create policy "Authenticated staff can write purchases"
  on purchases for insert to authenticated with check (true);
create policy "Authenticated staff can update purchases"
  on purchases for update to authenticated using (true);
create policy "Authenticated staff can delete purchases"
  on purchases for delete to authenticated using (true);

-- Company assets (logo) bucket.
insert into storage.buckets (id, name, public)
values ('company-assets', 'company-assets', true)
on conflict (id) do nothing;

create policy "Public can view company assets"
  on storage.objects for select
  using (bucket_id = 'company-assets');

create policy "Authenticated staff can upload company assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'company-assets');

create policy "Authenticated staff can update company assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'company-assets');

-- Track who made each sale, so reports can be scoped per-cashier.
alter table sales add column if not exists staff_id uuid references auth.users(id) on delete set null;
alter table sales add column if not exists staff_name text;

-- Everyone's current role, for use in policies (separate from is_admin()
-- so managers can be granted report access too, without being full admins).
create or replace function current_staff_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from staff where id = auth.uid();
$$;

-- Replace the old "any authenticated staff can read all sales" policy with
-- one that limits cashiers (and storekeepers) to their own sales only.
-- Administrators and managers continue to see everything, including profit
-- figures computed from the full sales history.
drop policy if exists "Authenticated staff can read sales" on sales;

create policy "Sales visibility by role"
  on sales for select
  to authenticated
  using (
    current_staff_role() in ('administrator', 'manager')
    or staff_id = auth.uid()
  );

-- Stock takes: physical counts compared against system stock, with the
-- resulting variance recorded for audit purposes.
create table if not exists stock_takes (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null default '[]',
  status text not null default 'completed' check (status in ('draft', 'completed')),
  notes text,
  staff_id uuid references auth.users(id) on delete set null,
  staff_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists stock_takes_set_updated_at on stock_takes;
create trigger stock_takes_set_updated_at
  before update on stock_takes
  for each row execute function set_updated_at();

alter table stock_takes enable row level security;

create policy "Authenticated staff can read stock takes"
  on stock_takes for select to authenticated using (true);
create policy "Authenticated staff can write stock takes"
  on stock_takes for insert to authenticated with check (true);
create policy "Authenticated staff can update stock takes"
  on stock_takes for update to authenticated using (true);

-- Credit notes: customer returns/refunds. Recorded items go back into
-- stock, and if the customer paid on credit, their balance is reduced.
create table if not exists credit_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  customer_name text,
  sale_id uuid references sales(id) on delete set null,
  items jsonb not null default '[]',
  total numeric(12, 2) not null default 0,
  reason text,
  staff_id uuid references auth.users(id) on delete set null,
  staff_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists credit_notes_set_updated_at on credit_notes;
create trigger credit_notes_set_updated_at
  before update on credit_notes
  for each row execute function set_updated_at();

alter table credit_notes enable row level security;

create policy "Authenticated staff can read credit notes"
  on credit_notes for select to authenticated using (true);
create policy "Authenticated staff can write credit notes"
  on credit_notes for insert to authenticated with check (true);

-- Purchase returns (Goods Return Note): stock sent back to a supplier.
-- Reduces stock and reduces what's owed to that supplier.
create table if not exists purchase_returns (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete set null,
  supplier_name text,
  purchase_id uuid references purchases(id) on delete set null,
  items jsonb not null default '[]',
  total numeric(12, 2) not null default 0,
  reason text,
  staff_id uuid references auth.users(id) on delete set null,
  staff_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists purchase_returns_set_updated_at on purchase_returns;
create trigger purchase_returns_set_updated_at
  before update on purchase_returns
  for each row execute function set_updated_at();

alter table purchase_returns enable row level security;

create policy "Authenticated staff can read purchase returns"
  on purchase_returns for select to authenticated using (true);
create policy "Authenticated staff can write purchase returns"
  on purchase_returns for insert to authenticated with check (true);

-- Next-price-when-empty: when new stock arrives at a different cost while
-- old stock is still on the shelf, the new price is queued here instead of
-- overwriting the active price. It's applied automatically once stock
-- reaches zero (see the app's applyPendingPriceIfDepleted logic).
alter table products add column if not exists pending_buying_price numeric(12, 2);
alter table products add column if not exists pending_selling_price numeric(12, 2);

-- Beauty on Point — atomic stock adjustment
--
-- Every sale, purchase receipt, purchase return, and credit note used to
-- push its own calculated "final" stock number straight to the products
-- table. If two devices adjusted the same product's stock at close to the
-- same time (two staff selling at once, a sale and a stock receipt
-- overlapping), whichever push landed second would silently overwrite the
-- first — the earlier change would just vanish, causing stock to drift
-- from reality over time (the "stock losing/gaining itself" symptom).
--
-- This function makes stock changes additive and atomic at the database
-- level: instead of "set stock to X", every change now says "add/subtract
-- X from whatever the current value is", computed inside a single
-- database operation. Concurrent changes from any number of devices now
-- correctly accumulate instead of racing each other.

create or replace function adjust_product_stock(p_id uuid, delta numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  new_stock numeric;
begin
  update products
  set stock = greatest(stock + delta, 0)
  where id = p_id
  returning stock into new_stock;

  return new_stock;
end;
$$;

grant execute on function adjust_product_stock(uuid, numeric) to authenticated;

-- Batch version: applies many stock adjustments in a single database round
-- trip instead of one network call per line item. A 5-item sale used to
-- mean 5 separate requests to the server, each waiting on the last —
-- meaningfully slower on mobile data. This does them all at once.
create or replace function adjust_product_stock_batch(items jsonb)
returns table(id uuid, new_stock numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update products p
  set stock = greatest(p.stock + (i.delta)::numeric, 0)
  from jsonb_to_recordset(items) as i(id uuid, delta numeric)
  where p.id = i.id
  returning p.id, p.stock;
end;
$$;

grant execute on function adjust_product_stock_batch(jsonb) to authenticated;

