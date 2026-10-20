-- =====================================================================
-- Avis / témoignages du portail public.
--
-- Objectif : récolter de VRAIS avis de visiteurs (stagiaires, formateurs,
-- professionnels) via un formulaire, les modérer, puis n'afficher que ceux
-- explicitement validés. Aucun avis inventé : la table est vide au départ et
-- ne se remplit que de soumissions réelles.
--
-- Sécurité (RLS) :
--   - Lecture publique UNIQUEMENT des avis dont le statut = 'publie'.
--   - Soumission publique autorisée, mais FORCÉE en 'en_attente' + consentement
--     obligatoire (modération avant toute mise en ligne).
--   - Modération (voir tout / publier / supprimer) réservée aux administrateurs,
--     via la fonction public.est_admin_portail() déjà définie par la migration
--     des contenus.
-- =====================================================================

create table if not exists public.portail_avis (
  id            uuid primary key default gen_random_uuid(),
  prenom        text not null check (char_length(trim(prenom)) between 1 and 60),
  qualite       text not null check (char_length(trim(qualite)) between 1 and 80),
  texte         text not null check (char_length(trim(texte)) between 10 and 600),
  note          smallint check (note between 1 and 5),
  statut        text not null default 'en_attente'
                  check (statut in ('en_attente', 'publie', 'rejete')),
  consentement  boolean not null default false check (consentement = true),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);

create index if not exists portail_avis_statut_idx on public.portail_avis (statut);
create index if not exists portail_avis_published_at_idx on public.portail_avis (published_at desc);

-- Tenue à jour automatique de updated_at + horodatage de publication.
create or replace function public.portail_avis_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.statut = 'publie' and (old.statut is distinct from 'publie') then
    new.published_at = now();
  end if;
  return new;
end;
$$;
drop trigger if exists portail_avis_touch on public.portail_avis;
create trigger portail_avis_touch
  before update on public.portail_avis
  for each row execute function public.portail_avis_touch();

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.portail_avis enable row level security;

-- Lecture publique des seuls avis publiés (anon + authenticated).
drop policy if exists "avis_lecture_publique_publies" on public.portail_avis;
create policy "avis_lecture_publique_publies" on public.portail_avis
  for select to anon, authenticated
  using (statut = 'publie');

-- Les administrateurs voient tout (y compris en attente et rejetés).
drop policy if exists "avis_admin_lecture_totale" on public.portail_avis;
create policy "avis_admin_lecture_totale" on public.portail_avis
  for select to authenticated
  using (public.est_admin_portail());

-- Soumission publique : autorisée mais verrouillée en 'en_attente'.
-- (Le consentement = true est déjà garanti par la contrainte de colonne.)
drop policy if exists "avis_soumission_publique" on public.portail_avis;
create policy "avis_soumission_publique" on public.portail_avis
  for insert to anon, authenticated
  with check (statut = 'en_attente');

-- Modération (publier / rejeter) réservée aux administrateurs.
drop policy if exists "avis_admin_modification" on public.portail_avis;
create policy "avis_admin_modification" on public.portail_avis
  for update to authenticated
  using (public.est_admin_portail())
  with check (public.est_admin_portail());

drop policy if exists "avis_admin_suppression" on public.portail_avis;
create policy "avis_admin_suppression" on public.portail_avis
  for delete to authenticated
  using (public.est_admin_portail());
