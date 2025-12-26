-- Baggo (UUID) — Supabase schema
-- Run this in Supabase SQL editor.

-- Extensions
create extension if not exists pgcrypto;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Admins table (links to Supabase Auth users)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now()
);

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category_slug text references public.categories(slug) on update cascade on delete set null,
  price numeric(12,2) not null default 0,
  featured boolean not null default false,
  visible boolean not null default true,
  images text[] not null default '{}'::text[],
  sizes text[] not null default '{}'::text[],
  stock jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Site settings (single row: id=1)
create table if not exists public.site_settings (
  id int primary key,
  site_name text not null default 'Baggo',

  banner_enabled boolean not null default true,
  banner_text text not null default 'This is Baggo',
  banner_button_label text not null default '',
  banner_button_href text not null default '',

  hero_badge_text text not null default 'New drop • Minimal, premium pieces',
  hero_title text not null default 'Carry better. Shop Baggo.',
  hero_subtitle text not null default 'A clean storefront built for speed now — and a Pro-ready admin later.',

  hero_primary_cta_label text not null default 'Shop now',
  hero_primary_cta_href text not null default '/shop',
  hero_secondary_cta_label text not null default 'Explore bags',
  hero_secondary_cta_href text not null default '/shop?category=bags',

  hero_main_product_id uuid null,
  hero_side_product_id uuid null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- Seed the single settings row (id=1)
insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

-- Helper: is_admin
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.admins a where a.user_id = uid
  );
$$;

-- =====================
-- Row Level Security
-- =====================

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;

-- Public read (storefront)
drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories
for select to public
using (true);

drop policy if exists "Public read products" on public.products;
create policy "Public read products" on public.products
for select to public
using (true);

drop policy if exists "Public read site settings" on public.site_settings;
create policy "Public read site settings" on public.site_settings
for select to public
using (true);

-- Admins table: users can read their own row (so the app can check admin access)
drop policy if exists "Read own admin row" on public.admins;
create policy "Read own admin row" on public.admins
for select to authenticated
using (user_id = auth.uid());

-- Admin write policies
-- Categories
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories
for all to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Products
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
for all to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Site settings
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings
for all to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Admins table: only admins can manage admins
-- (Bootstrap your first admin by inserting in SQL editor, which bypasses RLS)
drop policy if exists "Admins manage admins" on public.admins;
create policy "Admins manage admins" on public.admins
for all to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- =====================
-- Seed demo categories + products
-- =====================

insert into public.categories (slug, label, visible, sort_order)
values
  ('bags', 'Bags', true, 0),
  ('accessories', 'Accessories', true, 1)
on conflict (slug) do update set
  label = excluded.label,
  visible = excluded.visible,
  sort_order = excluded.sort_order;

-- Demo products (local images in /public/products)
-- You can delete these later from Admin.
insert into public.products (name, description, category_slug, price, featured, visible, images, sizes, stock)
values
  (
    'Saffiano Tote',
    '',
    'bags',
    180,
    true,
    true,
    array['/products/p001_1.jpg','/products/p001_2.jpg','/products/p001_3.jpg']::text[],
    array['S','M','L']::text[],
    '{"S":6,"M":4,"L":2}'::jsonb
  ),
  (
    'Quilted Mini Shoulder',
    '',
    'bags',
    140,
    false,
    true,
    array['/products/p002_1.jpg','/products/p002_2.jpg','/products/p002_3.jpg']::text[],
    array['S','M','L']::text[],
    '{"S":8,"M":5,"L":3}'::jsonb
  ),
  (
    'Smooth Leather Crossbody',
    '',
    'bags',
    160,
    true,
    true,
    array['/products/p003_1.jpg','/products/p003_2.jpg','/products/p003_3.jpg']::text[],
    array['S','M','L']::text[],
    '{"S":7,"M":4,"L":2}'::jsonb
  ),
  (
    'Structured Top-Handle',
    '',
    'bags',
    190,
    false,
    true,
    array['/products/p004_1.jpg','/products/p004_2.jpg','/products/p004_3.jpg']::text[],
    array['S','M','L']::text[],
    '{"S":5,"M":3,"L":1}'::jsonb
  ),
  (
    'Everyday Hobo Bag',
    '',
    'bags',
    155,
    false,
    true,
    array['/products/p005_1.jpg','/products/p005_2.jpg','/products/p005_3.jpg']::text[],
    array['S','M','L']::text[],
    '{"S":9,"M":6,"L":3}'::jsonb
  ),
  (
    'Chain Strap Flap Bag',
    '',
    'bags',
    175,
    true,
    true,
    array['/products/p006_1.jpg','/products/p006_2.jpg','/products/p006_3.jpg']::text[],
    array['S','M','L']::text[],
    '{"S":6,"M":4,"L":2}'::jsonb
  ),
  (
    'Leather Cardholder',
    '',
    'accessories',
    35,
    true,
    true,
    array['/products/p101_1.jpg','/products/p101_2.jpg','/products/p101_3.jpg']::text[],
    array['One Size']::text[],
    '{"One Size":30}'::jsonb
  ),
  (
    'Compact Wallet',
    '',
    'accessories',
    45,
    false,
    true,
    array['/products/p102_1.jpg','/products/p102_2.jpg','/products/p102_3.jpg']::text[],
    array['One Size']::text[],
    '{"One Size":22}'::jsonb
  ),
  (
    'Chain Bag Strap',
    '',
    'accessories',
    28,
    false,
    true,
    array['/products/p103_1.jpg','/products/p103_2.jpg','/products/p103_3.jpg']::text[],
    array['One Size']::text[],
    '{"One Size":40}'::jsonb
  ),
  (
    'Silk Scarf',
    '',
    'accessories',
    30,
    true,
    true,
    array['/products/p104_1.jpg','/products/p104_2.jpg','/products/p104_3.jpg']::text[],
    array['One Size']::text[],
    '{"One Size":18}'::jsonb
  )
on conflict do nothing;

-- =====================
-- After you create a Supabase Auth user, add them as admin:
--
-- insert into public.admins (user_id, email)
-- values ('PASTE_AUTH_USER_UUID_HERE', 'you@example.com');
-- =====================
