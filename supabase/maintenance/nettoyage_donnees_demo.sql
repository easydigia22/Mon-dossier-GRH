-- =============================================================================
-- Nettoyage des DONNÉES FICTIVES de démonstration (SARL Atlas Services Formation)
-- sur TOUS les espaces de travail (tous les user_id).
--
-- À exécuter dans : Supabase Studio > SQL Editor du projet rwhoezldcnxzkecwcxfq
-- (le SQL Editor s'exécute en rôle `postgres` et contourne la RLS, ce qui permet
-- de nettoyer l'espace de chaque stagiaire d'un seul passage).
--
-- CRITÈRE : suppression UNIQUEMENT des enregistrements aux IDs de démo connus.
-- Le vrai travail saisi par les stagiaires/formateurs porte d'autres IDs et
-- n'est JAMAIS touché par ce script.
--
-- IDs fictifs ciblés :
--   entreprise : ent-atlas-001            (⚠ PAS ent-001 = modèle « entreprise vide »)
--   salariés   : sal-001 … sal-012
--   contrats   : ctr-001 … ctr-012        (+ tout contrat lié à un salarié de démo)
--   pointages  : evt-001 … evt-007        (+ tout pointage lié à un salarié de démo)
--   congés     : dc-001, dc-002           (+ tout congé lié à un salarié de démo)
--   bulletins  : tous ceux liés à un salarié de démo
--   classe     : cls-01                   (classe de démonstration)
-- =============================================================================

-- Liste des salariés de démonstration
--   sal-001, sal-002, sal-003, sal-004, sal-005, sal-006,
--   sal-007, sal-008, sal-009, sal-010, sal-011, sal-012

-- -----------------------------------------------------------------------------
-- 1) INSPECTION (optionnel) — compter ce qui sera supprimé AVANT d'agir
-- -----------------------------------------------------------------------------
-- Décommentez ce bloc pour vérifier les volumes d'abord, puis relancez la
-- partie 2 pour exécuter réellement la suppression.
/*
select 'entreprises' as table, count(*) from public.entreprises where id = 'ent-atlas-001'
union all select 'salaries', count(*) from public.salaries
  where id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
union all select 'contrats', count(*) from public.contrats
  where salarie_id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
union all select 'evenements_presence', count(*) from public.evenements_presence
  where salarie_id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
union all select 'demandes_conges', count(*) from public.demandes_conges
  where salarie_id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
union all select 'bulletins', count(*) from public.bulletins
  where salarie_id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
union all select 'classes', count(*) from public.classes where id = 'cls-01';
*/

-- -----------------------------------------------------------------------------
-- 2) SUPPRESSION (transaction : tout ou rien)
-- -----------------------------------------------------------------------------
begin;

-- Enfants d'abord (liés aux salariés de démo via salarie_id OU data->>'salarieId')
delete from public.bulletins
 where salarie_id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
    or (data->>'salarieId') in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012');

delete from public.evenements_presence
 where salarie_id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
    or (data->>'salarieId') in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
    or id in ('evt-001','evt-002','evt-003','evt-004','evt-005','evt-006','evt-007');

delete from public.demandes_conges
 where salarie_id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
    or (data->>'salarieId') in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
    or id in ('dc-001','dc-002');

delete from public.contrats
 where salarie_id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
    or (data->>'salarieId') in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
    or id in ('ctr-001','ctr-002','ctr-003','ctr-004','ctr-005','ctr-006','ctr-007','ctr-008','ctr-009','ctr-010','ctr-011','ctr-012');

-- Salariés de démo
delete from public.salaries
 where id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012');

-- Entreprise fictive (⚠ on ne touche PAS à ent-001 = entreprise vide par défaut)
delete from public.entreprises where id = 'ent-atlas-001';

-- Classe de démonstration
delete from public.classes where id = 'cls-01';

commit;

-- -----------------------------------------------------------------------------
-- 3) VÉRIFICATION APRÈS COUP — doit renvoyer 0 partout
-- -----------------------------------------------------------------------------
select 'entreprises_demo'  as reste, count(*) from public.entreprises where id = 'ent-atlas-001'
union all select 'salaries_demo', count(*) from public.salaries
  where id in ('sal-001','sal-002','sal-003','sal-004','sal-005','sal-006','sal-007','sal-008','sal-009','sal-010','sal-011','sal-012')
union all select 'classes_demo', count(*) from public.classes where id = 'cls-01';
