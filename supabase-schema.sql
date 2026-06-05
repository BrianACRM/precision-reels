-- Run this in the Supabase SQL editor.

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  stock_number text not null unique,
  year text not null,
  model text not null,
  price text not null,
  note text not null,
  status text not null default 'Available' check (status in ('Available', 'Pending', 'Sold')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.admin_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = auth.uid()
  );
$$;

create policy "Admins can read admin profiles"
on public.admin_profiles for select
to authenticated
using (public.is_admin());

create policy "Public can read active listings"
on public.listings for select
to anon, authenticated
using (status in ('Available', 'Pending') or public.is_admin());

create policy "Admins can insert listings"
on public.listings for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update listings"
on public.listings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete listings"
on public.listings for delete
to authenticated
using (public.is_admin());

create policy "Public can read active listing images"
on public.listing_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.listings
    where listings.id = listing_images.listing_id
    and (listings.status in ('Available', 'Pending') or public.is_admin())
  )
);

create policy "Admins can insert listing images"
on public.listing_images for insert
to authenticated
with check (public.is_admin());

create policy "Admins can delete listing images"
on public.listing_images for delete
to authenticated
using (public.is_admin());

create policy "Admins can update listing images"
on public.listing_images for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Storage setup:
-- 1. Create a public bucket named listing-images in Supabase Storage.
-- 2. Keep signups disabled in Authentication settings.
-- 3. Create one auth user for Brandon.
-- 4. Add that auth user to admin_profiles:
-- insert into public.admin_profiles (user_id, email)
-- values ('AUTH_USER_UUID_HERE', 'brandon@precisionreels.com');

create policy "Public can read listing images bucket"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'listing-images');

create policy "Admins can upload listing images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-images' and public.is_admin());

create policy "Admins can delete listing images"
on storage.objects for delete
to authenticated
using (bucket_id = 'listing-images' and public.is_admin());

create policy "Admins can update listing images"
on storage.objects for update
to authenticated
using (bucket_id = 'listing-images' and public.is_admin())
with check (bucket_id = 'listing-images' and public.is_admin());
