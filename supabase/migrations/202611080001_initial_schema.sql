create extension if not exists btree_gist with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('guest', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.hotels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  name text not null,
  slug text not null unique,
  city text not null,
  neighborhood text,
  description text not null default '',
  category text not null default 'Boutique hotel',
  cover_image_url text,
  cover_image_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  name text not null,
  description text not null default '',
  max_guests smallint not null default 2 check (max_guests between 1 and 12),
  price_per_night numeric(10, 2) not null check (price_per_night > 0),
  created_at timestamptz not null default now(),
  unique (hotel_id, name)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete restrict,
  check_in date not null,
  check_out date not null,
  guests smallint not null check (guests between 1 and 12),
  total_price numeric(10, 2) not null check (total_price > 0),
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint booking_dates_valid check (check_out > check_in),
  constraint room_dates_do_not_overlap exclude using gist (
    room_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotels (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (hotel_id, user_id)
);

create index hotels_city_published_idx on public.hotels (city, is_published);
create index rooms_hotel_id_idx on public.rooms (hotel_id);
create index bookings_user_dates_idx on public.bookings (user_id, check_in desc);
create index bookings_room_id_idx on public.bookings (room_id);
create index reviews_hotel_id_idx on public.reviews (hotel_id);

create or replace function public.set_booking_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  room_rate numeric(10, 2);
  room_capacity smallint;
begin
  select price_per_night, max_guests
    into room_rate, room_capacity
    from public.rooms
    where id = new.room_id;

  if not found then
    raise exception 'Room not found';
  end if;
  if new.guests > room_capacity then
    raise exception 'Guest count exceeds room capacity';
  end if;

  new.total_price := room_rate * (new.check_out - new.check_in);
  new.status := 'confirmed';
  return new;
end;
$$;

create trigger set_booking_price_before_insert
  before insert on public.bookings
  for each row execute procedure public.set_booking_price();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'guest');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.hotels enable row level security;
alter table public.rooms enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;

create policy "Users can read their profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "Users can update their profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users can read their roles"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins can manage roles"
  on public.user_roles for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Published hotels are public"
  on public.hotels for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy "Admins can create hotels"
  on public.hotels for insert to authenticated
  with check ((select public.is_admin()));
create policy "Admins can update hotels"
  on public.hotels for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Admins can delete hotels"
  on public.hotels for delete to authenticated
  using ((select public.is_admin()));

create policy "Rooms of visible hotels are public"
  on public.rooms for select to anon, authenticated
  using (
    exists (
      select 1 from public.hotels
      where hotels.id = rooms.hotel_id
        and (hotels.is_published or (select public.is_admin()))
    )
  );
create policy "Admins can manage rooms"
  on public.rooms for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Guests can read their bookings"
  on public.bookings for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Guests can create their own bookings"
  on public.bookings for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.rooms
      join public.hotels on hotels.id = rooms.hotel_id
      where rooms.id = bookings.room_id and hotels.is_published
        and bookings.guests <= rooms.max_guests
    )
  );
create policy "Guests can cancel their own bookings"
  on public.bookings for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (
    (user_id = (select auth.uid()) and status = 'cancelled')
    or (select public.is_admin())
  );

create policy "Reviews are public"
  on public.reviews for select to anon, authenticated
  using (true);
create policy "Guests can create one review per hotel"
  on public.reviews for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Guests can update their review"
  on public.reviews for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hotel-images', 'hotel-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Hotel images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'hotel-images');
create policy "Admins can upload hotel images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'hotel-images' and (select public.is_admin()));
create policy "Admins can update hotel images"
  on storage.objects for update to authenticated
  using (bucket_id = 'hotel-images' and (select public.is_admin()))
  with check (bucket_id = 'hotel-images' and (select public.is_admin()));
create policy "Admins can delete hotel images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'hotel-images' and (select public.is_admin()));