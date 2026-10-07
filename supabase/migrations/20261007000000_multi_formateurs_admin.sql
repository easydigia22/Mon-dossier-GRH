-- Multi-formateurs : rôle admin, approbation des comptes formateurs, et cloisonnement
-- des tentatives sur le roster de chaque formateur.
-- Spec : docs/superpowers/specs/2026-10-07-multi-formateurs-admin-design.md
--
-- Idempotente : peut être réexécutée sans dommage.

-- ---------------------------------------------------------------------------
-- 1. Profils : statut d'approbation, e-mail, traçabilité de la décision
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists statut      text not null default 'en_attente',
  add column if not exists email       text,
  add column if not exists decide_par  uuid references auth.users (id) on delete set null,
  add column if not exists decide_le   timestamptz,
  add column if not exists motif_refus text;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('stagiaire', 'formateur', 'admin'));

alter table public.profiles drop constraint if exists profiles_statut_check;
alter table public.profiles add constraint profiles_statut_check
  check (statut in ('en_attente', 'approuve', 'refuse'));

-- ---------------------------------------------------------------------------
-- 2. Reprise des comptes existants
-- ---------------------------------------------------------------------------

-- Personne n'est enfermé dehors : tous les comptes déjà créés sont approuvés.
-- L'attente ne vaut que pour les inscriptions futures.
update public.profiles set statut = 'approuve' where statut is distinct from 'approuve';

-- L'e-mail est recopié depuis auth.users, que le client ne peut pas lire :
-- sans lui l'espace admin n'afficherait que des UUID.
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.user_id
   and p.email is distinct from u.email;

-- Premier administrateur. Il ne peut pas être approuvé par un admin puisqu'il
-- est le premier : il est désigné ici, explicitement et de façon auditable.
update public.profiles p
   set role = 'admin', statut = 'approuve'
  from auth.users u
 where u.id = p.user_id
   and lower(u.email) = 'ezzouhir2122@gmail.com';

-- ---------------------------------------------------------------------------
-- 3. Inscription : un formateur naît en attente, un admin ne naît jamais
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  -- Seul 'formateur' est acceptable depuis les métadonnées d'inscription.
  -- Toute autre valeur, 'admin' compris, retombe sur 'stagiaire' : sans cette
  -- règle, n'importe qui s'inscrirait administrateur.
  v_role := case when new.raw_user_meta_data ->> 'role' = 'formateur'
                 then 'formateur' else 'stagiaire' end;

  insert into public.profiles (user_id, role, statut, email)
  values (
    new.id,
    v_role,
    case when v_role = 'formateur' then 'en_attente' else 'approuve' end,
    new.email
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Verrous d'accès
-- ---------------------------------------------------------------------------

-- Verrou unique : toutes les politiques existantes passent déjà par cette
-- fonction, l'approbation s'applique donc partout d'un seul coup.
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

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- L'admin lit tous les profils ; chacun continue de lire le sien (self_read).
drop policy if exists "admin_read_all" on public.profiles;
create policy "admin_read_all" on public.profiles
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Décision d'approbation
-- ---------------------------------------------------------------------------

-- profiles reste en écriture interdite pour le client : les décisions passent
-- par cette fonction, jamais par un update direct. Un formateur ne peut donc
-- pas s'auto-approuver, même en forgeant la requête.
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

  if p_decision not in ('approuve', 'refuse', 'en_attente') then
    raise exception 'Décision invalide : %', p_decision;
  end if;

  -- La cible doit être un formateur. Un admin ne peut donc ni se révoquer
  -- lui-même, ni révoquer un autre admin : l'établissement ne peut pas se
  -- retrouver sans administrateur par une fausse manœuvre.
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

revoke all on function public.decider_formateur(uuid, text, text) from public;
grant execute on function public.decider_formateur(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Cloisonnement des tentatives
-- ---------------------------------------------------------------------------

-- Les deux politiques globales disparaissent : elles ouvraient toutes les
-- tentatives à tout formateur (« un seul espace de formation par projet »).
drop policy if exists "formateur_read_all" on public.tentatives;
drop policy if exists "formateur_update_all" on public.tentatives;

-- Un formateur accède à une tentative si son auteur est rattaché à l'une de
-- ses classes. is_formateur() reste en facteur : les lignes de classes
-- appartiennent toujours à un formateur révoqué, et sans cette condition il
-- garderait l'accès à ses anciens stagiaires.
drop policy if exists "formateur_read_roster" on public.tentatives;
create policy "formateur_read_roster" on public.tentatives
  for select to authenticated
  using (
    public.is_formateur()
    and exists (
      select 1 from public.classe_stagiaires cs
      where cs.stagiaire_user_id = tentatives.user_id
        and cs.classe_user_id = (select auth.uid())
    )
  );

drop policy if exists "formateur_update_roster" on public.tentatives;
create policy "formateur_update_roster" on public.tentatives
  for update to authenticated
  using (
    public.is_formateur()
    and exists (
      select 1 from public.classe_stagiaires cs
      where cs.stagiaire_user_id = tentatives.user_id
        and cs.classe_user_id = (select auth.uid())
    )
  )
  with check (
    public.is_formateur()
    and exists (
      select 1 from public.classe_stagiaires cs
      where cs.stagiaire_user_id = tentatives.user_id
        and cs.classe_user_id = (select auth.uid())
    )
  );

-- L'admin pilote mais ne corrige pas : lecture seule. Toute écriture
-- administrative relève du lot B.
drop policy if exists "admin_read_tentatives" on public.tentatives;
create policy "admin_read_tentatives" on public.tentatives
  for select to authenticated
  using (public.is_admin());
