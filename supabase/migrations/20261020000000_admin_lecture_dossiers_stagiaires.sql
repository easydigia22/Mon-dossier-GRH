-- L'administrateur, comme le formateur, doit pouvoir consulter le dossier de travail
-- des stagiaires rattachés à SES classes (Espace Formateur > « Dossier de travail
-- d'un stagiaire »). Jusqu'ici est_mon_stagiaire() n'acceptait que is_formateur() :
-- un compte de rôle 'admin' (même propriétaire de la classe) se voyait refuser la
-- lecture par la RLS, qui renvoyait 0 ligne sans erreur — d'où un dossier « vide ».
--
-- On ajoute is_admin() en facteur, en conservant la restriction d'appartenance
-- (classe_user_id = auth.uid()) : l'accès reste limité aux stagiaires des classes
-- que l'appelant possède. Cohérent avec l'accès admin déjà en place sur `tentatives`.
--
-- Idempotente : create or replace. Aucune policy modifiée, aucun droit d'écriture.

create or replace function public.est_mon_stagiaire(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (public.is_formateur() or public.is_admin())
     and exists (
       select 1 from public.classe_stagiaires cs
       where cs.stagiaire_user_id = p_user_id
         and cs.classe_user_id = auth.uid()
     );
$$;
