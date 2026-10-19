-- =====================================================================
-- CMS du portail public : table des contenus + stockage des fichiers.
--
-- Objectif : permettre à un administrateur d'ajouter / modifier / publier /
-- dépublier des contenus (cours, exercices, QCM, articles, ressources) et
-- d'uploader des fichiers (PDF…) SANS toucher au code.
--
-- Sécurité (RLS) :
--   - Lecture publique UNIQUEMENT des contenus dont le statut = 'publie'.
--   - Écriture réservée aux comptes dont le profil a le rôle admin/superadmin.
-- =====================================================================

-- Détermine si l'utilisateur connecté est administrateur du portail.
create or replace function public.est_admin_portail()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.role in ('admin', 'superadmin')
  );
$$;

-- -------------------------------------------------------------------
-- Table des contenus
-- -------------------------------------------------------------------
create table if not exists public.portail_contenus (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  type             text not null check (type in ('cours', 'exercice', 'qcm', 'article', 'ressource')),
  rubrique         text not null check (rubrique in ('grh', 'paie', 'droit-du-travail', 'fiscalite', 'actualites', 'ofppt', 'ressources')),
  titre            text not null,
  resume           text not null default '',
  publics          text[] not null default '{}',
  niveau           text not null default 'debutant' check (niveau in ('debutant', 'intermediaire', 'avance')),
  statut           text not null default 'brouillon' check (statut in ('brouillon', 'publie', 'depublie')),
  date_publication date,
  date_mise_a_jour date,
  auteur           text,
  tags             text[] not null default '{}',
  corps            text,
  enonce           text,
  correction       text,
  questions        jsonb,
  fichiers         jsonb,
  sources          jsonb,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists portail_contenus_rubrique_idx on public.portail_contenus (rubrique);
create index if not exists portail_contenus_type_idx on public.portail_contenus (type);
create index if not exists portail_contenus_statut_idx on public.portail_contenus (statut);

-- Tenue à jour automatique de updated_at
create or replace function public.portail_contenus_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists portail_contenus_touch on public.portail_contenus;
create trigger portail_contenus_touch
  before update on public.portail_contenus
  for each row execute function public.portail_contenus_touch();

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.portail_contenus enable row level security;

-- Lecture publique des seuls contenus publiés (anon + authenticated).
drop policy if exists "lecture_publique_publies" on public.portail_contenus;
create policy "lecture_publique_publies" on public.portail_contenus
  for select to anon, authenticated
  using (statut = 'publie');

-- Les administrateurs voient tout (y compris brouillons et dépubliés).
drop policy if exists "admin_lecture_totale" on public.portail_contenus;
create policy "admin_lecture_totale" on public.portail_contenus
  for select to authenticated
  using (public.est_admin_portail());

-- Écriture (insert / update / delete) réservée aux administrateurs.
drop policy if exists "admin_insertion" on public.portail_contenus;
create policy "admin_insertion" on public.portail_contenus
  for insert to authenticated
  with check (public.est_admin_portail());

drop policy if exists "admin_modification" on public.portail_contenus;
create policy "admin_modification" on public.portail_contenus
  for update to authenticated
  using (public.est_admin_portail())
  with check (public.est_admin_portail());

drop policy if exists "admin_suppression" on public.portail_contenus;
create policy "admin_suppression" on public.portail_contenus
  for delete to authenticated
  using (public.est_admin_portail());

-- -------------------------------------------------------------------
-- Stockage des fichiers (bucket public « documents »)
-- -------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Lecture publique des fichiers du bucket.
drop policy if exists "documents_lecture_publique" on storage.objects;
create policy "documents_lecture_publique" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'documents');

-- Upload / modification / suppression réservés aux administrateurs.
drop policy if exists "documents_admin_insertion" on storage.objects;
create policy "documents_admin_insertion" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.est_admin_portail());

drop policy if exists "documents_admin_modification" on storage.objects;
create policy "documents_admin_modification" on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and public.est_admin_portail());

drop policy if exists "documents_admin_suppression" on storage.objects;
create policy "documents_admin_suppression" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.est_admin_portail());
