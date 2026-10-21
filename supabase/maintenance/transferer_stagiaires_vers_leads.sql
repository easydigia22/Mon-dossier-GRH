-- =============================================================================
-- TRANSFERT des stagiaires rattachés aux classes du formateur ezzouhir20@gmail.com
-- vers la base de leads (public.portail_leads), avec la source « stagiaire ».
--
-- ⚠️ CONFORMITÉ (loi 09-08 / CNDP) : la table leads est un opt-in. Ces stagiaires
-- se sont inscrits pour UTILISER l'application, pas pour recevoir des e-mails
-- marketing. En exécutant ce script, tu assertes disposer d'une base légale pour
-- les contacter. La source « stagiaire » permet de les isoler (et de respecter un
-- éventuel retrait / droit à l'effacement).
--
-- À exécuter dans : Supabase Studio > SQL Editor du projet de prod
-- rwhoezldcnxzkecwcxfq (rôle postgres, contourne la RLS). Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Autoriser la source « stagiaire » (la contrainte ne la connaît pas encore).
-- -----------------------------------------------------------------------------
alter table public.portail_leads drop constraint if exists portail_leads_source_check;
alter table public.portail_leads add constraint portail_leads_source_check
  check (source in ('newsletter', 'guide-paie', 'autre', 'stagiaire'));

-- -----------------------------------------------------------------------------
-- 2) DIAGNOSTIC — qui sera transféré (exécute cette requête seule d'abord).
--    Vérifie le nombre et les e-mails avant d'insérer.
-- -----------------------------------------------------------------------------
select u.email,
       left(trim(cs.prenom || ' ' || cs.nom), 60) as nom_complet,
       cs.matricule,
       cs.joined_at
from public.classe_stagiaires cs
join auth.users u on u.id = cs.stagiaire_user_id
where cs.classe_user_id = (select id from auth.users where lower(email) = 'ezzouhir20@gmail.com')
order by u.email;

-- -----------------------------------------------------------------------------
-- 3) TRANSFERT — insère chaque stagiaire comme lead (source « stagiaire »).
--    Idempotent : un e-mail déjà présent pour cette source est ignoré.
--    prenom = « Prénom Nom » (tronqué à 60 caractères) pour l'affichage admin.
-- -----------------------------------------------------------------------------
insert into public.portail_leads (email, prenom, source, consentement)
select distinct u.email,
       left(trim(cs.prenom || ' ' || cs.nom), 60),
       'stagiaire',
       true
from public.classe_stagiaires cs
join auth.users u on u.id = cs.stagiaire_user_id
where cs.classe_user_id = (select id from auth.users where lower(email) = 'ezzouhir20@gmail.com')
  and u.email is not null
on conflict (lower(email), source) do nothing;

-- -----------------------------------------------------------------------------
-- 4) VÉRIFICATION — nombre de leads « stagiaire » après transfert.
-- -----------------------------------------------------------------------------
select count(*) as leads_stagiaires
from public.portail_leads
where source = 'stagiaire';
