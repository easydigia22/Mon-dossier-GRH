-- Archivage des classes : une classe archivée n'accepte plus de nouveau stagiaire.
--
-- La règle doit vivre en base : le code d'invitation est résolu par `join_classe`,
-- que l'application ne traverse pas. Un garde côté client ne fermerait rien.
--
-- Le corps de `join_classe` est repris verbatim de 20261008000000 ; seule la garde
-- sur `archiveeLe` est ajoutée.
--
-- Idempotente : peut être réexécutée sans dommage.

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
begin
  if auth.uid() is null then
    raise exception 'Non authentifié.';
  end if;

  if not public.is_actif() then
    raise exception 'Votre compte est désactivé.';
  end if;

  select user_id, id, data into v_owner, v_id, v_data
  from public.classes
  where code_invitation = upper(trim(p_code))
  limit 1;

  if v_owner is null then
    raise exception 'Code de classe invalide.';
  end if;

  if v_data ->> 'archiveeLe' is not null then
    raise exception 'Cette classe est archivée et n''accepte plus de nouveaux stagiaires.';
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

  return query select v_data ->> 'nom', v_data ->> 'formateurNom', v_data ->> 'etablissement';
end;
$$;

revoke all on function public.join_classe(text, text, text, text) from public;
grant execute on function public.join_classe(text, text, text, text) to authenticated;
