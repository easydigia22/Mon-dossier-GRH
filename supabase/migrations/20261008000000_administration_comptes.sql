-- Administration des comptes (lot B) : désactivation, réaffectation de groupe,
-- suppression définitive.
-- Spec : docs/superpowers/specs/2026-10-07-administration-comptes-design.md
--
-- Aucune Edge Function : vérifié sur ce projet,
-- has_table_privilege('postgres', 'auth.users', 'DELETE') = true.
--
-- Idempotente : peut être réexécutée sans dommage.

-- 1. Quatrième état possible d'un compte
alter table public.profiles drop constraint if exists profiles_statut_check;
alter table public.profiles add constraint profiles_statut_check
  check (statut in ('en_attente', 'approuve', 'refuse', 'desactive'));

-- 2. Lectures de l'admin sur les groupes et les rattachements.
-- Les écritures passent par les fonctions ci-dessous, jamais par une policy.
drop policy if exists "admin_read_classes" on public.classes;
create policy "admin_read_classes" on public.classes
  for select to authenticated
  using (public.is_admin());

drop policy if exists "admin_read_roster" on public.classe_stagiaires;
create policy "admin_read_roster" on public.classe_stagiaires
  for select to authenticated
  using (public.is_admin());

-- 3. Désactiver / réactiver
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

  select role into v_role from public.profiles where user_id = p_user_id;
  if v_role is null then
    raise exception 'Compte introuvable.';
  end if;
  if v_role = 'admin' then
    raise exception 'Un compte administrateur ne peut pas être désactivé.';
  end if;

  -- La réactivation remet en 'approuve', jamais en 'en_attente' :
  -- désactiver vaut décision.
  update public.profiles
     set statut      = case when p_desactive then 'desactive' else 'approuve' end,
         motif_refus = null,
         decide_par  = auth.uid(),
         decide_le   = now()
   where user_id = p_user_id;
end;
$$;

-- 4. Confier un groupe à un autre formateur
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

  -- `classes` a pour clé primaire (user_id, id) : un identifiant déjà pris chez le
  -- destinataire ferait échouer l'update sur une violation de clé illisible.
  if exists (select 1 from public.classes where user_id = p_nouveau and id = p_classe_id) then
    raise exception 'Le formateur destinataire possède déjà un groupe portant cet identifiant.';
  end if;

  update public.classes
     set user_id = p_nouveau, updated_at = now()
   where user_id = p_ancien and id = p_classe_id;

  if not found then
    raise exception 'Groupe introuvable chez ce formateur.';
  end if;

  -- Indissociable du déplacement ci-dessus : sans cela les stagiaires resteraient
  -- rattachés à un formateur qui ne possède plus la classe.
  update public.classe_stagiaires
     set classe_user_id = p_nouveau
   where classe_user_id = p_ancien and classe_id = p_classe_id;
end;
$$;

-- 5. Ce qu'une suppression détruirait (lecture seule)
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

  return query
    select (select count(*) from public.classes           where user_id       = p_user_id),
           (select count(*) from public.classe_stagiaires where classe_user_id = p_user_id),
           (select count(*) from public.bulletins         where user_id       = p_user_id),
           (select count(*) from public.tentatives        where user_id       = p_user_id);
end;
$$;

-- 6. Suppression définitive
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

  select role into v_role from public.profiles where user_id = p_user_id;
  if v_role = 'admin' then
    raise exception 'Un compte administrateur ne peut pas être supprimé depuis l''application.';
  end if;

  -- Les 10 tables applicatives, `profiles` et `classe_stagiaires` référencent toutes
  -- auth.users en `on delete cascade` : cette ligne suffit à tout effacer.
  delete from auth.users where id = p_user_id;

  -- Un delete sur zéro ligne ne lève pas d'erreur : sans ce contrôle, l'interface
  -- annoncerait une suppression qui n'a pas eu lieu.
  if not found then
    raise exception 'Compte introuvable.';
  end if;
end;
$$;

revoke all on function public.desactiver_compte(uuid, boolean) from public;
revoke all on function public.reaffecter_groupe(text, uuid, uuid) from public;
revoke all on function public.apercu_suppression(uuid) from public;
revoke all on function public.supprimer_compte(uuid) from public;

grant execute on function public.desactiver_compte(uuid, boolean) to authenticated;
grant execute on function public.reaffecter_groupe(text, uuid, uuid) to authenticated;
grant execute on function public.apercu_suppression(uuid) to authenticated;
grant execute on function public.supprimer_compte(uuid) to authenticated;
