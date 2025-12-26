-- Baggo (fix + addons)
-- Use this if you already ran old SQL and got errors like:
--  - "column id is of type uuid but expression is integer"
--  - "relation shipping_settings already exists"
--
-- It will:
-- 1) Replace a wrong shipping_settings table (uuid id) with the correct one (int id = 1)
-- 2) Ensure promo_codes + orders tables exist
-- 3) Add a couple helpful indexes

create extension if not exists pgcrypto;

-- =========================
-- FIX: SHIPPING SETTINGS id type
-- =========================
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'shipping_settings'
      and column_name = 'id'
      and data_type = 'uuid'
  ) then
    drop table if exists public.shipping_settings cascade;
  end if;
end $$;

-- Correct shipping_settings table (single row: id = 1)
create table if not exists public.shipping_settings (
  id int primary key,
  methods jsonb not null default '[]'::jsonb,
  free_threshold numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_settings_single_row check (id = 1)
);

insert into public.shipping_settings (id, methods, free_threshold)
values (1, '[]'::jsonb, null)
on conflict (id) do nothing;

-- Trigger: updated_at (only if you have set_updated_at from supabase.sql)
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

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='shipping_settings' and policyname='Public read shipping settings'
  ) then
    create policy "Public read shipping settings"
    on public.shipping_settings
    for select to public
    using (true);
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='shipping_settings' and policyname='Admin manage shipping settings'
    ) then
      create policy "Admin manage shipping settings"
      on public.shipping_settings
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
    end if;
  end if;
end $$;

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

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='promo_codes' and policyname='Public read active promo codes'
  ) then
    create policy "Public read active promo codes"
    on public.promo_codes
    for select to public
    using (active = true);
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='promo_codes' and policyname='Admin manage promo codes'
    ) then
      create policy "Admin manage promo codes"
      on public.promo_codes
      for all to authenticated
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
  updated_at timestamptz not null default now(),
  constraint orders_status_check check (status in ('new','preparing','delivered','canceled'))
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

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='Public create orders'
  ) then
    create policy "Public create orders"
    on public.orders
    for insert to public
    with check (true);
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_admin') then
    if not exists (
      select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='Admin manage orders'
    ) then
      create policy "Admin manage orders"
      on public.orders
      for all to authenticated
      using (public.is_admin(auth.uid()))
      with check (public.is_admin(auth.uid()));
    end if;
  end if;
end $$;

-- Helpful indexes
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
