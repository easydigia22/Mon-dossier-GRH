-- =============================================================================
-- RÉPARATION : le formateur ne voit pas le dossier de ses stagiaires
-- (Entreprise « pas encore créée », Salariés 0, Contrats 0… alors que le
--  stagiaire a bien saisi ses données dans son propre compte).
--
-- Cause la plus fréquente : la migration 20261014000000_formateur_dossiers_stagiaires.sql
-- (fonction est_mon_stagiaire + policies SELECT "formateur_read_roster" sur les
-- 6 tables métier) n'a jamais été exécutée sur la base de PRODUCTION. Le frontend
-- se déploie tout seul via Vercel, mais le SQL s'applique à la main ici. Sans ces
-- policies, la RLS refuse la lecture et renvoie 0 ligne SANS erreur — l'écran
-- formateur paraît donc « vide » au lieu de « non autorisé ».
--
-- Cause secondaire (même symptôme) : le compte formateur n'est pas « approuve »,
-- donc is_formateur() = false et les mêmes policies refusent tout.
--
-- À exécuter dans : Supabase Studio > SQL Editor du projet rwhoezldcnxzkecwcxfq
-- (rôle postgres, contourne la RLS). Entièrement idempotent et réexécutable.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1) DIAGNOSTIC — à lire AVANT de réparer. Exécute cette section seule d'abord.
-- -----------------------------------------------------------------------------

-- 1.a  Les policies de lecture formateur existent-elles sur les 6 tables ?
--      Attendu : 6 lignes. Si moins (ou 0), la migration n'a pas été appliquée.
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and policyname = 'formateur_read_roster'
  and tablename in ('entreprises','salaries','contrats',
                    'evenements_presence','demandes_conges','bulletins')
order by tablename;

-- 1.b  La fonction d'appartenance existe-t-elle ?
--      Attendu : 1 ligne (est_mon_stagiaire).
select proname
from pg_proc
where proname in ('est_mon_stagiaire','is_formateur')
order by proname;

-- 1.c  Rattachements stagiaire <-> formateur. Note le classe_user_id : c'est le
--      compte formateur qui doit pouvoir lire. (Tu dois voir Rihab SENSALI, etc.)
select cs.classe_user_id,
       pf.email  as formateur_email,
       pf.role   as formateur_role,
       pf.statut as formateur_statut,
       cs.stagiaire_user_id,
       cs.nom, cs.prenom, cs.matricule
from public.classe_stagiaires cs
left join public.profiles pf on pf.user_id = cs.classe_user_id
order by cs.classe_user_id, cs.joined_at;

-- 1.d  Le stagiaire a-t-il RÉELLEMENT des données dans la base ? (comptage par
--      compte). Si ces compteurs sont > 0 mais l'écran formateur montre 0, le
--      problème est bien la RLS (section 1.a) et/ou l'approbation (1.c).
select 'salaries' as table_metier, user_id, count(*) as nb
  from public.salaries  group by user_id
union all
select 'contrats', user_id, count(*) from public.contrats group by user_id
union all
select 'entreprises', user_id, count(*) from public.entreprises group by user_id
order by table_metier, nb desc;


-- -----------------------------------------------------------------------------
-- 2) RÉPARATION A — (ré)appliquer la migration 20261014000000. Idempotent.
--    C'est la correction principale. N'écrit AUCUNE donnée, ne crée que la
--    fonction et les 6 policies de LECTURE (SELECT). Aucun droit d'écriture.
-- -----------------------------------------------------------------------------

create or replace function public.est_mon_stagiaire(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_formateur()
     and exists (
       select 1 from public.classe_stagiaires cs
       where cs.stagiaire_user_id = p_user_id
         and cs.classe_user_id = auth.uid()
     );
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'entreprises', 'salaries', 'contrats',
    'evenements_presence', 'demandes_conges', 'bulletins'
  ]
  loop
    execute format('drop policy if exists "formateur_read_roster" on public.%I', t);
    execute format(
      'create policy "formateur_read_roster" on public.%I
         for select to authenticated
         using (public.est_mon_stagiaire(%I.user_id))', t, t);
  end loop;
end $$;


-- -----------------------------------------------------------------------------
-- 3) RÉPARATION B — OPTIONNELLE : approuver un compte formateur resté « en_attente ».
--    À n'exécuter QUE si la section 1.c montre formateur_statut <> 'approuve'
--    pour le compte qui doit suivre les stagiaires. Remplace l'e-mail.
--    (En temps normal, l'approbation se fait depuis l'espace Admin de l'app.)
-- -----------------------------------------------------------------------------

-- update public.profiles
--    set statut = 'approuve', decide_le = now()
--  where lower(email) = lower('EMAIL_DU_FORMATEUR_ICI')
--    and role = 'formateur';


-- -----------------------------------------------------------------------------
-- 4) VÉRIFICATION APRÈS RÉPARATION
--    Rejoue la section 1.a : tu dois maintenant voir 6 lignes.
--    Puis, côté app : le formateur rouvre « Espace Formateur » > « Dossier de
--    travail d'un stagiaire », choisit le stagiaire et clique « Rafraîchir ».
--    L'entreprise, les salariés et les contrats doivent apparaître.
-- -----------------------------------------------------------------------------
select tablename, policyname
from pg_policies
where schemaname = 'public'
  and policyname = 'formateur_read_roster'
  and tablename in ('entreprises','salaries','contrats',
                    'evenements_presence','demandes_conges','bulletins')
order by tablename;
