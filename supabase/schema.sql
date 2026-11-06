-- =====================================================================
-- IMPANO — base de données Supabase (à coller dans SQL Editor → Run)
-- Sécurité : Row Level Security activée partout.
--   • Visiteurs : peuvent LIRE le catalogue et PASSER commande, rien d'autre.
--   • Clients connectés : voient uniquement LEURS commandes.
--   • Admin : seul à gérer catalogue, contenu, photos et toutes les commandes.
-- =====================================================================

-- 1) Administrateurs ---------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins lisent leur ligne" on public.admins;
create policy "admins lisent leur ligne" on public.admins for select to authenticated using (user_id = auth.uid());

-- Promeut un utilisateur existant en admin (à lancer depuis SQL Editor uniquement)
create or replace function public.make_admin(p_email text)
returns text language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then return 'Utilisateur introuvable : créez-le d''abord dans Authentication → Users.'; end if;
  insert into public.admins(user_id) values (uid) on conflict do nothing;
  return 'OK : ' || p_email || ' est administrateur.';
end $$;
revoke all on function public.make_admin(text) from public, anon, authenticated;

-- 2) Contenu du site (articles, textes, réglages) ----------------------
create table if not exists public.site_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_data enable row level security;

drop policy if exists "catalogue lisible par tous" on public.site_data;
create policy "catalogue lisible par tous" on public.site_data for select to anon, authenticated using (true);
drop policy if exists "catalogue modifiable par admin" on public.site_data;
create policy "catalogue modifiable par admin" on public.site_data for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 3) Commandes ---------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  client jsonb not null,
  items jsonb not null,
  total numeric not null check (total >= 0),
  shipping numeric not null default 0 check (shipping >= 0),
  delivery text,
  payment text,
  note text,
  status text not null default 'nouveau' check (status in ('nouveau','confirmé','payé','expédié','livré','annulé'))
);
alter table public.orders enable row level security;

drop policy if exists "tout visiteur peut commander" on public.orders;
create policy "tout visiteur peut commander" on public.orders for insert to anon, authenticated
  with check (
    status = 'nouveau'
    and (user_id is null or user_id = auth.uid())
    and jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50
    and length(coalesce(note, '')) <= 1000
  );
drop policy if exists "client voit ses commandes" on public.orders;
create policy "client voit ses commandes" on public.orders for select to authenticated using (user_id = auth.uid());
drop policy if exists "admin gère les commandes" on public.orders;
create policy "admin gère les commandes" on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 4) Photos & vidéos (stockage public en lecture, écriture admin) ------
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "media: admin ajoute" on storage.objects;
create policy "media: admin ajoute" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media: admin modifie" on storage.objects;
create policy "media: admin modifie" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media: admin supprime" on storage.objects;
create policy "media: admin supprime" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
