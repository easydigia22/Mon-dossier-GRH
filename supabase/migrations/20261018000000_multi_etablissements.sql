-- Multi-établissements : cloisonnement strict par tenant « établissement ».
-- Spec : docs/superpowers/specs/2026-10-18-multi-etablissements-design.md
--
-- Décisions : super-admin unique (easydigia22@gmail.com) au-dessus d'un admin par
-- établissement ; un formateur choisit un établissement existant OU en crée un (en
-- attente) à l'inscription ; le super-admin approuve le centre puis désigne son admin
-- à la main ; reprise de l'existant dans un unique « Établissement par défaut ».
--
-- Idempotente : peut être réexécutée sans dommage.

-- ===========================================================================
-- 1. Table des établissements (le tenant)
-- ===========================================================================
create table if not exists public.etablissements (
  id        uuid primary key default gen_random_uuid(),
  nom       text not null,
  ville     text,
  code      text unique,
  statut    text not null default 'en_attente' check (statut in ('en_attente', 'approuve', 'refuse')),
  cree_par  uuid references auth.users (id) on delete set null,
  cree_le   timestamptz not null default now()
);

alter table public.etablissements enable row level security;

-- ===========================================================================
-- 2. Rattachement sur les profils + rôle super-admin
-- ===========================================================================
alter table public.profiles
  add column if not exists etablissement_id uuid references public.etablissements (id) on delete set null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('stagiaire', 'formateur', 'admin', 'superadmin'));

-- ===========================================================================
-- 3. Établissement réel sur les classes
-- ===========================================================================
alter table public.classes
  add column if not exists etablissement_id uuid references public.etablissements (id) on delete set null;

create index if not exists classes_etablissement_idx on public.classes (etablissement_id);
create index if not exists profiles_etablissement_idx on public.profiles (etablissement_id);

-- ===========================================================================
-- 4. Reprise de l'existant
-- ===========================================================================
do $$
declare
  v_defaut uuid;
  v_code   text;
begin
  -- 4.1 Un unique établissement par défaut qui absorbe tout l'existant.
  select id into v_defaut from public.etablissements where nom = 'Établissement par défaut' limit 1;
  if v_defaut is null then
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    insert into public.etablissements (nom, ville, code, statut)
    values ('Établissement par défaut', null, v_code, 'approuve')
    returning id into v_defaut;
  end if;

  -- 4.2 Toutes les classes sans établissement → établissement par défaut.
  update public.classes set etablissement_id = v_defaut where etablissement_id is null;

  -- 4.3 Tous les profils sans établissement → établissement par défaut.
  update public.profiles set etablissement_id = v_defaut where etablissement_id is null;

  -- 4.4 Le super-admin global : easydigia22, sans établissement (transverse).
  update public.profiles p
     set role = 'superadmin', statut = 'approuve', etablissement_id = null
    from auth.users u
   where u.id = p.user_id
     and lower(u.email) = 'easydigia22@gmail.com';
end $$;

-- ===========================================================================
-- 5. Helpers de cloisonnement (security definer, stable)
-- ===========================================================================
create or replace function public.mon_etablissement()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select etablissement_id from public.profiles where user_id = auth.uid();
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'superadmin'
  );
$$;

-- is_admin() couvre désormais l'admin d'établissement ET le super-admin (capacités).
-- Le PÉRIMÈTRE est borné par les policies/fonctions via mon_etablissement().
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

-- is_formateur() inchangé dans l'esprit ; redéclaré pour mémoire (approuvé requis).
create or replace function public.is_formateur()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'formateur' and statut = 'approuve'
  );
$$;

-- ===========================================================================
-- 6. RLS sur etablissements
-- ===========================================================================
-- Lecture : le super-admin voit tout ; chacun voit son propre établissement.
drop policy if exists "etab_read" on public.etablissements;
create policy "etab_read" on public.etablissements
  for select to authenticated
  using (public.is_superadmin() or id = public.mon_etablissement());

-- Écritures interdites en direct : tout passe par les fonctions security definer.
revoke all on public.etablissements from anon;
revoke insert, update, delete on public.etablissements from authenticated;
grant select on public.etablissements to authenticated;

-- ===========================================================================
-- 7. Re-scope des lectures admin (établissement au lieu de « tout »)
-- ===========================================================================
-- Profils : super-admin = tous ; admin = profils de SON établissement ; + self_read.
drop policy if exists "admin_read_all" on public.profiles;
create policy "admin_read_all" on public.profiles
  for select to authenticated
  using (
    public.is_superadmin()
    or (public.is_admin() and etablissement_id = public.mon_etablissement())
  );

-- Classes : idem via classes.etablissement_id.
drop policy if exists "admin_read_classes" on public.classes;
create policy "admin_read_classes" on public.classes
  for select to authenticated
  using (
    public.is_superadmin()
    or (public.is_admin() and etablissement_id = public.mon_etablissement())
  );

-- Roster : via l'établissement de la classe rattachée.
drop policy if exists "admin_read_roster" on public.classe_stagiaires;
create policy "admin_read_roster" on public.classe_stagiaires
  for select to authenticated
  using (
    public.is_superadmin()
    or (
      public.is_admin()
      and exists (
        select 1 from public.classes c
        where c.user_id = classe_stagiaires.classe_user_id
          and c.id = classe_stagiaires.classe_id
          and c.etablissement_id = public.mon_etablissement()
      )
    )
  );

-- Tentatives : via l'établissement du stagiaire auteur.
drop policy if exists "admin_read_tentatives" on public.tentatives;
create policy "admin_read_tentatives" on public.tentatives
  for select to authenticated
  using (
    public.is_superadmin()
    or (
      public.is_admin()
      and exists (
        select 1 from public.profiles p
        where p.user_id = tentatives.user_id
          and p.etablissement_id = public.mon_etablissement()
      )
    )
  );

-- ===========================================================================
-- 8. Fonctions d'administration re-scopées (admin borné, super-admin transverse)
-- ===========================================================================

-- Garde interne : l'admin courant a-t-il autorité sur un compte cible ?
create or replace function public.admin_autorise_sur(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_superadmin()
      or (
        public.is_admin()
        and exists (
          select 1 from public.profiles p
          where p.user_id = p_user_id
            and p.etablissement_id = public.mon_etablissement()
        )
      );
$$;

-- 8.1 Décision d'approbation d'un formateur (scopée).
create or replace function public.decider_formateur(
  p_user_id  uuid,
  p_decision text,
  p_motif    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administrateur.';
  end if;
  if not public.admin_autorise_sur(p_user_id) then
    raise exception 'Ce compte n''appartient pas à votre établissement.';
  end if;
  if p_decision not in ('approuve', 'refuse', 'en_attente') then
    raise exception 'Décision invalide : %', p_decision;
  end if;

  update public.profiles
     set statut      = p_decision,
         decide_par  = auth.uid(),
         decide_le   = now(),
         motif_refus = case when p_decision = 'refuse' then p_motif else null end
   where user_id = p_user_id
     and role = 'formateur';

  if not found then
    raise exception 'Compte formateur introuvable.';
  end if;
end;
$$;

-- 8.2 Désactiver / réactiver (scopée).
create or replace function public.desactiver_compte(p_user_id uuid, p_desactive boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administrateur.';
  end if;
  if not public.admin_autorise_sur(p_user_id) then
    raise exception 'Ce compte n''appartient pas à votre établissement.';
  end if;

  select role into v_role from public.profiles where user_id = p_user_id;
  if v_role is null then
    raise exception 'Compte introuvable.';
  end if;
  if v_role in ('admin', 'superadmin') then
    raise exception 'Un compte administrateur ne peut pas être désactivé.';
  end if;

  update public.profiles
     set statut      = case when p_desactive then 'desactive' else 'approuve' end,
         motif_refus = null,
         decide_par  = auth.uid(),
         decide_le   = now()
   where user_id = p_user_id;
end;
$$;

-- 8.3 Réaffecter un groupe (dans le même établissement, sauf super-admin).
create or replace function public.reaffecter_groupe(
  p_classe_id text,
  p_ancien    uuid,
  p_nouveau   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_etab_ancien   uuid;
  v_etab_nouveau  uuid;
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administrateur.';
  end if;

  if not exists (
    select 1 from public.profiles
    where user_id = p_nouveau and role = 'formateur' and statut = 'approuve'
  ) then
    raise exception 'Le formateur destinataire doit être un formateur approuvé.';
  end if;

  select etablissement_id into v_etab_ancien  from public.profiles where user_id = p_ancien;
  select etablissement_id into v_etab_nouveau from public.profiles where user_id = p_nouveau;

  -- Un admin ne peut agir que dans son établissement ; un super-admin est transverse
  -- mais reste contraint de ne pas disperser une classe entre deux établissements.
  if not public.is_superadmin() then
    if v_etab_ancien is distinct from public.mon_etablissement()
       or v_etab_nouveau is distinct from public.mon_etablissement() then
      raise exception 'Les deux formateurs doivent appartenir à votre établissement.';
    end if;
  end if;
  if v_etab_ancien is distinct from v_etab_nouveau then
    raise exception 'Les deux formateurs doivent appartenir au même établissement.';
  end if;

  if exists (select 1 from public.classes where user_id = p_nouveau and id = p_classe_id) then
    raise exception 'Le formateur destinataire possède déjà un groupe portant cet identifiant.';
  end if;

  update public.classes
     set user_id = p_nouveau, updated_at = now()
   where user_id = p_ancien and id = p_classe_id;

  if not found then
    raise exception 'Groupe introuvable chez ce formateur.';
  end if;

  update public.classe_stagiaires
     set classe_user_id = p_nouveau
   where classe_user_id = p_ancien and classe_id = p_classe_id;
end;
$$;

-- 8.4 Aperçu suppression (scopé).
create or replace function public.apercu_suppression(p_user_id uuid)
returns table (groupes bigint, stagiaires_detaches bigint, bulletins bigint, remises bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administrateur.';
  end if;
  if not public.admin_autorise_sur(p_user_id) then
    raise exception 'Ce compte n''appartient pas à votre établissement.';
  end if;

  return query
    select (select count(*) from public.classes           where user_id       = p_user_id),
           (select count(*) from public.classe_stagiaires where classe_user_id = p_user_id),
           (select count(*) from public.bulletins         where user_id       = p_user_id),
           (select count(*) from public.tentatives        where user_id       = p_user_id);
end;
$$;

-- 8.5 Suppression définitive (scopée).
create or replace function public.supprimer_compte(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not public.is_admin() then
    raise exception 'Action réservée à l''administrateur.';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Vous ne pouvez pas supprimer votre propre compte.';
  end if;
  if not public.admin_autorise_sur(p_user_id) then
    raise exception 'Ce compte n''appartient pas à votre établissement.';
  end if;

  select role into v_role from public.profiles where user_id = p_user_id;
  if v_role in ('admin', 'superadmin') then
    raise exception 'Un compte administrateur ne peut pas être supprimé depuis l''application.';
  end if;

  delete from auth.users where id = p_user_id;
  if not found then
    raise exception 'Compte introuvable.';
  end if;
end;
$$;

-- ===========================================================================
-- 9. Gestion des établissements (super-admin) + inscription formateur
-- ===========================================================================

-- 9.1 Liste publique des établissements approuvés (pour le choix à l'inscription).
--     Appelable même avant authentification complète : n'expose que id/nom/ville.
create or replace function public.lister_etablissements_publics()
returns table (id uuid, nom text, ville text)
language sql
stable
security definer
set search_path = public
as $$
  select id, nom, ville from public.etablissements
  where statut = 'approuve'
  order by nom;
$$;

-- 9.2 Création d'un établissement par le super-admin (approuvé d'emblée + code).
create or replace function public.creer_etablissement(p_nom text, p_ville text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_code text;
begin
  if not public.is_superadmin() then
    raise exception 'Action réservée au super-administrateur.';
  end if;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.etablissements (nom, ville, code, statut, cree_par)
  values (trim(p_nom), nullif(trim(p_ville), ''), v_code, 'approuve', auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- 9.3 Proposition d'un établissement par un formateur à l'inscription (en attente).
--     Rattache aussitôt le formateur appelant à ce nouvel établissement.
create or replace function public.proposer_etablissement(p_nom text, p_ville text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid;
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié.';
  end if;
  if not exists (select 1 from public.profiles where user_id = auth.uid() and role = 'formateur') then
    raise exception 'Réservé aux comptes formateur.';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.etablissements (nom, ville, code, statut, cree_par)
  values (trim(p_nom), nullif(trim(p_ville), ''), v_code, 'en_attente', auth.uid())
  returning id into v_id;

  update public.profiles set etablissement_id = v_id where user_id = auth.uid();
  return v_id;
end;
$$;

-- 9.4 Rattacher le formateur appelant à un établissement existant approuvé.
create or replace function public.choisir_etablissement(p_etablissement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Non authentifié.';
  end if;
  if not exists (select 1 from public.profiles where user_id = auth.uid() and role = 'formateur') then
    raise exception 'Réservé aux comptes formateur.';
  end if;
  if not exists (select 1 from public.etablissements where id = p_etablissement_id and statut = 'approuve') then
    raise exception 'Établissement introuvable ou non approuvé.';
  end if;

  update public.profiles set etablissement_id = p_etablissement_id where user_id = auth.uid();
end;
$$;

-- 9.5 Décision du super-admin sur un établissement proposé.
create or replace function public.decider_etablissement(p_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Action réservée au super-administrateur.';
  end if;
  if p_decision not in ('approuve', 'refuse', 'en_attente') then
    raise exception 'Décision invalide : %', p_decision;
  end if;

  update public.etablissements set statut = p_decision where id = p_id;
  if not found then
    raise exception 'Établissement introuvable.';
  end if;
end;
$$;

-- 9.6 Le super-admin désigne (ou change) l'admin d'un établissement.
--     La cible doit déjà appartenir à cet établissement. L'ancien admin, s'il y en
--     avait un, est rétrogradé en formateur.
create or replace function public.designer_admin_etablissement(p_user_id uuid, p_etablissement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Action réservée au super-administrateur.';
  end if;
  if not exists (
    select 1 from public.profiles
    where user_id = p_user_id and etablissement_id = p_etablissement_id
  ) then
    raise exception 'Ce compte n''appartient pas à cet établissement.';
  end if;

  -- Rétrograder l'admin actuel de ce centre (le cas échéant).
  update public.profiles
     set role = 'formateur'
   where etablissement_id = p_etablissement_id and role = 'admin' and user_id <> p_user_id;

  -- Promouvoir la cible admin + approuvée.
  update public.profiles
     set role = 'admin', statut = 'approuve', decide_par = auth.uid(), decide_le = now()
   where user_id = p_user_id;
end;
$$;

-- ===========================================================================
-- 10. join_classe : propage l'établissement de la classe au stagiaire
-- ===========================================================================
create or replace function public.join_classe(p_code text, p_nom text, p_prenom text, p_matricule text default null)
returns table (classe_nom text, formateur_nom text, etablissement text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner  uuid;
  v_id     text;
  v_data   jsonb;
  v_etab   uuid;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié.';
  end if;
  if not public.is_actif() then
    raise exception 'Votre compte est désactivé.';
  end if;

  select user_id, id, data, etablissement_id into v_owner, v_id, v_data, v_etab
  from public.classes
  where code_invitation = upper(trim(p_code))
  limit 1;

  if v_owner is null then
    raise exception 'Code de classe invalide.';
  end if;

  insert into public.classe_stagiaires (stagiaire_user_id, classe_user_id, classe_id, matricule, nom, prenom, joined_at)
  values (auth.uid(), v_owner, v_id, nullif(trim(p_matricule), ''), trim(p_nom), trim(p_prenom), now())
  on conflict (stagiaire_user_id) do update
    set classe_user_id = excluded.classe_user_id,
        classe_id      = excluded.classe_id,
        matricule      = excluded.matricule,
        nom            = excluded.nom,
        prenom         = excluded.prenom,
        joined_at      = now();

  -- Le stagiaire hérite de l'établissement de la classe rejointe.
  update public.profiles set etablissement_id = v_etab where user_id = auth.uid();

  return query select v_data ->> 'nom', v_data ->> 'formateurNom', v_data ->> 'etablissement';
end;
$$;

-- ===========================================================================
-- 11. Droits d'exécution
-- ===========================================================================
revoke all on function public.lister_etablissements_publics()                 from public;
revoke all on function public.creer_etablissement(text, text)                 from public;
revoke all on function public.proposer_etablissement(text, text)              from public;
revoke all on function public.choisir_etablissement(uuid)                     from public;
revoke all on function public.decider_etablissement(uuid, text)               from public;
revoke all on function public.designer_admin_etablissement(uuid, uuid)        from public;
revoke all on function public.admin_autorise_sur(uuid)                        from public;

grant execute on function public.lister_etablissements_publics()          to anon, authenticated;
grant execute on function public.creer_etablissement(text, text)          to authenticated;
grant execute on function public.proposer_etablissement(text, text)       to authenticated;
grant execute on function public.choisir_etablissement(uuid)              to authenticated;
grant execute on function public.decider_etablissement(uuid, text)        to authenticated;
grant execute on function public.designer_admin_etablissement(uuid, uuid) to authenticated;
-- admin_autorise_sur : usage interne uniquement (appelée par les fonctions security definer).
