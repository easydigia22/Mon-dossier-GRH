-- Rôles utilisateur : stagiaire (par défaut) ou formateur.
-- Le rôle est fixé au moment de l'inscription (passé en métadonnée au signUp) et copié
-- côté serveur par un trigger, pour être disponible même avant la confirmation de l'e-mail
-- et pour ne jamais pouvoir être modifié par le client lui-même.

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'stagiaire' check (role in ('stagiaire', 'formateur')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "self_read" on public.profiles;
create policy "self_read" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Lecture seule pour tout le monde : ni le client anonyme, ni l'utilisateur connecté
-- ne peuvent créer ou modifier une ligne (seul le trigger, en security definer, le fait).
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'formateur' then 'formateur' else 'stagiaire' end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rattrapage pour les comptes déjà créés avant cette migration
insert into public.profiles (user_id, role)
select id, 'stagiaire' from auth.users
on conflict (user_id) do nothing;
