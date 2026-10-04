-- Mon Dossier GRH — schéma initial
-- Une table par entité métier. Chaque ligne appartient à un utilisateur (Supabase Auth)
-- et conserve l'objet applicatif complet dans `data` (jsonb), ce qui garde les types TypeScript intacts.
-- RLS activée partout : un utilisateur ne voit et ne modifie que ses propres lignes.

create table if not exists public.entreprises (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.salaries (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  matricule  text,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.contrats (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  salarie_id text,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.evenements_presence (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id            text not null,
  salarie_id    text,
  periode_mois  text,
  data          jsonb not null,
  updated_at    timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.demandes_conges (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  salarie_id text,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.bulletins (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id            text not null,
  salarie_id    text,
  periode_mois  text,
  data          jsonb not null,
  updated_at    timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.regles (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.tentatives (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  mission_id text,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.classes (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Paramètres d'exécution (période active, mode, niveau, stagiaire actif) : une ligne par utilisateur
create table if not exists public.parametres_app (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Index de recherche sur les colonnes de liaison
create index if not exists contrats_salarie_idx            on public.contrats (user_id, salarie_id);
create index if not exists evenements_presence_salarie_idx on public.evenements_presence (user_id, salarie_id, periode_mois);
create index if not exists demandes_conges_salarie_idx     on public.demandes_conges (user_id, salarie_id);
create index if not exists bulletins_periode_idx           on public.bulletins (user_id, periode_mois, salarie_id);
create index if not exists tentatives_mission_idx          on public.tentatives (user_id, mission_id);

-- RLS : accès strictement limité au propriétaire de la ligne
do $$
declare
  t text;
begin
  foreach t in array array[
    'entreprises', 'salaries', 'contrats', 'evenements_presence', 'demandes_conges',
    'bulletins', 'regles', 'tentatives', 'classes', 'parametres_app'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "owner_all" on public.%I', t);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', t);
    -- Aucun accès pour les visiteurs non connectés
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;
