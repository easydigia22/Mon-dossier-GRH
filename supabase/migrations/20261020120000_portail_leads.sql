-- =====================================================================
-- Leads du portail : newsletter + téléchargement de lead magnet (guide PDF).
--
-- Objectif : capturer des contacts opt-in (e-mail + prénom facultatif) SANS
-- bloquer l'accès au contenu. La collecte est toujours volontaire et soumise
-- à consentement explicite (loi 09-08 CNDP / RGPD).
--
-- Sécurité (RLS) — IMPORTANT, DIFFÈRE DES AVIS :
--   - AUCUNE lecture publique : les leads contiennent des données personnelles.
--   - Insertion publique autorisée (opt-in), consentement obligatoire.
--   - Lecture / suppression réservées aux administrateurs.
-- =====================================================================

create table if not exists public.portail_leads (
  id            uuid primary key default gen_random_uuid(),
  email         text not null check (char_length(email) between 5 and 160 and position('@' in email) > 1),
  prenom        text check (char_length(trim(prenom)) <= 60),
  source        text not null default 'newsletter'
                  check (source in ('newsletter', 'guide-paie', 'autre')),
  consentement  boolean not null default false check (consentement = true),
  created_at    timestamptz not null default now()
);

-- Évite les doublons (même e-mail pour la même source). La soumission côté
-- client traite un conflit comme « déjà inscrit » (succès silencieux).
create unique index if not exists portail_leads_email_source_idx
  on public.portail_leads (lower(email), source);
create index if not exists portail_leads_created_at_idx
  on public.portail_leads (created_at desc);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.portail_leads enable row level security;

-- Insertion publique (opt-in). Consentement déjà garanti par la contrainte.
drop policy if exists "leads_insertion_publique" on public.portail_leads;
create policy "leads_insertion_publique" on public.portail_leads
  for insert to anon, authenticated
  with check (consentement = true);

-- Lecture réservée aux administrateurs (données personnelles, jamais publiques).
drop policy if exists "leads_admin_lecture" on public.portail_leads;
create policy "leads_admin_lecture" on public.portail_leads
  for select to authenticated
  using (public.est_admin_portail());

-- Suppression réservée aux administrateurs (droit à l'effacement).
drop policy if exists "leads_admin_suppression" on public.portail_leads;
create policy "leads_admin_suppression" on public.portail_leads
  for delete to authenticated
  using (public.est_admin_portail());
