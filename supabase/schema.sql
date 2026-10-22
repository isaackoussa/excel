-- Schéma Supabase de Tableur Pro.
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  -- Offre de l'utilisateur. Modifiable uniquement côté serveur (futur paiement).
  plan text not null default 'free' check (plan in ('free', 'premium')),
  progress jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Lire son profil" on public.profiles;
create policy "Lire son profil" on public.profiles
  for select using ((select auth.uid()) = id);

drop policy if exists "Modifier son profil" on public.profiles;
create policy "Modifier son profil" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- L'utilisateur ne peut modifier que son nom et sa progression, jamais son offre.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, progress, updated_at) on public.profiles to authenticated;

-- Création automatique du profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
