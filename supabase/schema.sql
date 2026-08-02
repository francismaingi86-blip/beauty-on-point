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

