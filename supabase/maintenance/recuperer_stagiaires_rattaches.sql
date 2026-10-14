-- =============================================================================
-- RÉCUPÉRATION des stagiaires rattachés après un « Vider l'espace de travail »
--
-- Contexte : vider l'espace a supprimé les CLASSES du formateur, mais PAS la
-- table de rattachement public.classe_stagiaires (stagiaire <-> classe), ni les
-- données propres des stagiaires (chacune dans son compte). On recrée donc les
-- classes manquantes À PARTIR des rattachements survivants, avec le même
-- identifiant, pour que l'effectif réapparaisse dans l'Espace Formateur.
--
-- À exécuter dans : Supabase Studio > SQL Editor du projet rwhoezldcnxzkecwcxfq
-- (rôle postgres, contourne la RLS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) INSPECTION — voir les stagiaires encore rattachés et à quelle classe.
--    (Tu devrais voir tes 3 stagiaires ; note la colonne classe_id.)
-- -----------------------------------------------------------------------------
select classe_user_id,
       classe_id,
       stagiaire_user_id,
       nom,
       prenom,
       matricule,
       joined_at
from public.classe_stagiaires
order by classe_id, joined_at;

-- -----------------------------------------------------------------------------
-- 2) RÉCUPÉRATION — recrée automatiquement toute classe référencée par un
--    rattachement mais qui n'existe plus. Un NOUVEAU code d'invitation est
--    généré (l'ancien ne fonctionnait plus de toute façon).
--    Idempotent : ne recrée que ce qui manque, ne touche pas aux classes
--    déjà présentes.
-- -----------------------------------------------------------------------------
insert into public.classes (user_id, id, data, updated_at)
select cs.classe_user_id,
       cs.classe_id,
       jsonb_build_object(
         'id',             cs.classe_id,
         'nom',            'Classe récupérée',
         'anneeScolaire',  '2025 / 2026',
         'formateurNom',   'Formateur',
         'etablissement',  'OFPPT',
         'codeInvitation', upper(substr(translate(md5(random()::text), 'oli01', 'OLI23'), 1, 6)),
         'stagiaires',     '[]'::jsonb
       ),
       now()
from (select distinct classe_user_id, classe_id from public.classe_stagiaires) cs
where not exists (
  select 1 from public.classes c
  where c.user_id = cs.classe_user_id and c.id = cs.classe_id
);

-- -----------------------------------------------------------------------------
-- 3) VÉRIFICATION — la/les classe(s) recréée(s) et leur effectif rattaché.
-- -----------------------------------------------------------------------------
select c.id as classe_id,
       c.data->>'nom'            as nom,
       c.data->>'codeInvitation' as code_invitation,
       count(cs.stagiaire_user_id) as nb_stagiaires
from public.classes c
left join public.classe_stagiaires cs
       on cs.classe_user_id = c.user_id and cs.classe_id = c.id
group by c.id, c.data
order by c.id;
