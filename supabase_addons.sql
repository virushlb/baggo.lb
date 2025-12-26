-- Baggo addons: promo codes + orders + shipping
-- Run this in Supabase SQL editor.
-- Safe to run multiple times (uses IF NOT EXISTS where possible).

-- Needed for gen_random_uuid() (usually enabled by default on Supabase)
create extension if not exists pgcrypto;

-- =========================
-- PROMO CODES
-- =========================
create table if not exists public.promo_codes (
  code text primary key,
  type text not null check (type in ('percent','fixed')),
  value numeric(12,2) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger (uses set_updated_at if you already created it)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    if not exists (select 1 from pg_trigger where tgname = 'promo_codes_set_updated_at') then
      create trigger promo_codes_set_updated_at
      before update on public.promo_codes
      for each row execute function public.set_updated_at();
    end if;
  end if;
end $$;

alter table public.promo_codes enable row level security;

-- Public can read only active codes (needed for checkout validation)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Public read active promo codes' and tablename='promo_codes') then
    create policy "Public read active promo codes"
    on public.promo_codes
    for select
    to public
    using (active = true);
  end if;
end $$;

-- Admin can manage all promo codes
do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    if not exists (select 1 from pg_policies where policyname = 'Admin manage promo codes' and tablename='promo_codes') then
      create policy "Admin manage promo codes"
      on public.promo_codes
      for all
      to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
    end if;
  end if;
end $$;


-- =========================
-- SHIPPING SETTINGS
-- =========================
create table if not exists public.shipping_settings (
  id int primary key,
  methods jsonb not null default '[]'::jsonb,
  free_threshold numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.shipping_settings (id, methods, free_threshold)
values (1, '[]'::jsonb, null)
on conflict (id) do nothing;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    if not exists (select 1 from pg_trigger where tgname = 'shipping_settings_set_updated_at') then
      create trigger shipping_settings_set_updated_at
      before update on public.shipping_settings
      for each row execute function public.set_updated_at();
    end if;
  end if;
end $$;

alter table public.shipping_settings enable row level security;

-- Public can read shipping settings
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Public read shipping settings' and tablename='shipping_settings') then
    create policy "Public read shipping settings"
    on public.shipping_settings
    for select
    to public
    using (true);
  end if;
end $$;

-- Admin can manage shipping settings
do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    if not exists (select 1 from pg_policies where policyname = 'Admin manage shipping settings' and tablename='shipping_settings') then
      create policy "Admin manage shipping settings"
      on public.shipping_settings
      for all
      to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
    end if;
  end if;
end $$;


-- =========================
-- ORDERS
-- =========================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new',
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  promo_code text,
  delivery_method text,
  notes text not null default '',
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    if not exists (select 1 from pg_trigger where tgname = 'orders_set_updated_at') then
      create trigger orders_set_updated_at
      before update on public.orders
      for each row execute function public.set_updated_at();
    end if;
  end if;
end $$;

alter table public.orders enable row level security;

-- Public can insert orders (customers)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Public create orders' and tablename='orders') then
    create policy "Public create orders"
    on public.orders
    for insert
    to public
    with check (true);
  end if;
end $$;

-- Admin can read/update/delete orders
do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    if not exists (select 1 from pg_policies where policyname = 'Admin manage orders' and tablename='orders') then
      create policy "Admin manage orders"
      on public.orders
      for all
      to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
    end if;
  end if;
end $$;
