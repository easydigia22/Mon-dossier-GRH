-- Réaffectation d'un compte existant vers un autre établissement (super-admin).
-- Complète 20261018000000 : permet de « réorganiser » l'existant depuis l'app.
--
-- Un formateur déplacé emporte ses classes et les stagiaires qui y sont inscrits.
-- Un admin déplacé perd son rôle d'admin (il n'administre plus son ancien centre) ;
-- le super-admin pourra le re-désigner admin du nouveau centre s'il le souhaite.
--
-- Idempotente.

create or replace function public.reaffecter_compte_etablissement(
  p_user_id          uuid,
  p_etablissement_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if not public.is_superadmin() then
    raise exception 'Action réservée au super-administrateur.';
  end if;

  if not exists (
    select 1 from public.etablissements where id = p_etablissement_id and statut = 'approuve'
  ) then
    raise exception 'Établissement cible introuvable ou non approuvé.';
  end if;

  select role into v_role from public.profiles where user_id = p_user_id;
  if v_role is null then
    raise exception 'Compte introuvable.';
  end if;
  if v_role = 'superadmin' then
    raise exception 'Le super-administrateur n''est rattaché à aucun établissement.';
  end if;

  -- Le compte change d'établissement ; un admin est rétrogradé formateur.
  update public.profiles
     set etablissement_id = p_etablissement_id,
         role = case when role = 'admin' then 'formateur' else role end
   where user_id = p_user_id;

  -- Un formateur (ou ex-admin) emporte ses classes et les stagiaires inscrits.
  if v_role in ('formateur', 'admin') then
    update public.classes
       set etablissement_id = p_etablissement_id, updated_at = now()
     where user_id = p_user_id;

    update public.profiles
       set etablissement_id = p_etablissement_id
     where user_id in (
       select cs.stagiaire_user_id
       from public.classe_stagiaires cs
       where cs.classe_user_id = p_user_id
     );
  end if;
end;
$$;

revoke all on function public.reaffecter_compte_etablissement(uuid, uuid) from public;
grant execute on function public.reaffecter_compte_etablissement(uuid, uuid) to authenticated;
