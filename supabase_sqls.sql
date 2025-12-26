-- Baggo Add-ons: Promo Codes + Orders + Delivery/Shipping
-- Run this in Supabase SQL Editor.
-- Safe to run multiple times.

-- =====================================================
-- 0) EXTENSION (gen_random_uuid)
-- =====================================================
create extension if not exists "pgcrypto";

-- =====================================================
-- 1) PROMO CODES
-- =====================================================
create table if not exists public.promo_codes (
  code text primary key,
  type text not null default 'percent' check (type in ('percent','fixed')),
  value numeric not null check (value > 0),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='promo_codes' and policyname='Public can read promo codes'
  ) then
    create policy "Public can read promo codes"
    on public.promo_codes
    for select
    using (true);
  end if;

  -- NOTE: This is OPEN access so your admin page can manage promos using the anon key.
  -- For production, replace this with authenticated/admin-only policies.
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='promo_codes' and policyname='Public can manage promo codes'
  ) then
    create policy "Public can manage promo codes"
    on public.promo_codes
    for all
    using (true)
    with check (true);
  end if;
end $$;

-- =====================================================
-- 2) DELIVERY / SHIPPING SETTINGS (single-row table)
-- =====================================================
create table if not exists public.shipping_settings (
  id integer primary key,
  methods jsonb not null default '[]'::jsonb,
  free_threshold numeric,
  updated_at timestamptz not null default now(),
  constraint shipping_settings_single_row check (id = 1)
);

insert into public.shipping_settings (id, methods, free_threshold)
values (
  1,
  '[{"code":"delivery","label":"Delivery","fee":0,"active":true,"sort_order":0}]'::jsonb,
  null
)
on conflict (id) do nothing;

alter table public.shipping_settings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='shipping_settings' and policyname='Public can read shipping settings'
  ) then
    create policy "Public can read shipping settings"
    on public.shipping_settings
    for select
    using (true);
  end if;

  -- NOTE: This is OPEN access so your admin page can save shipping using the anon key.
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='shipping_settings' and policyname='Public can manage shipping settings'
  ) then
    create policy "Public can manage shipping settings"
    on public.shipping_settings
    for all
    using (true)
    with check (true);
  end if;
end $$;

-- =====================================================
-- 3) ORDERS
-- =====================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new' check (status in ('new','preparing','delivered','canceled')),
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  promo_code text,
  delivery_method text,
  notes text not null default '',
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  shipping numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

do $$ begin
  -- Allow anyone to insert orders (checkout uses anon key)
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='Public can create orders'
  ) then
    create policy "Public can create orders"
    on public.orders
    for insert
    with check (true);
  end if;

  -- NOTE: OPEN access so your admin page can read/update/delete orders using the anon key.
  -- For production, replace with authenticated/admin-only policies.
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='Public can manage orders'
  ) then
    create policy "Public can manage orders"
    on public.orders
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='Public can update orders'
  ) then
    create policy "Public can update orders"
    on public.orders
    for update
    using (true)
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='Public can delete orders'
  ) then
    create policy "Public can delete orders"
    on public.orders
    for delete
    using (true);
  end if;
end $$;
