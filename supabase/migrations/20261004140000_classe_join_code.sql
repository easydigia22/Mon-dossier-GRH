-- Rattachement réel stagiaire <-> classe via un code d'invitation.
-- Le formateur génère un code par classe (stocké en clair, lecture publique interdite
-- directement : seule la fonction join_classe() peut le résoudre). Le stagiaire saisit ce
-- code une fois ; il rejoint alors l'effectif réel de la classe, visible en direct par le
-- formateur, sans ressaisie manuelle de sa part.

alter table public.classes
  add column if not exists code_invitation text unique;

create table if not exists public.classe_stagiaires (
  stagiaire_user_id uuid primary key references auth.users (id) on delete cascade,
  classe_user_id    uuid not null references auth.users (id) on delete cascade,
  classe_id         text not null,
  matricule         text,
  nom               text not null,
  prenom            text not null,
  joined_at         timestamptz not null default now()
);

create index if not exists classe_stagiaires_classe_idx on public.classe_stagiaires (classe_user_id, classe_id);

alter table public.classe_stagiaires enable row level security;

-- Le formateur voit (et peut retirer) les membres de ses propres classes.
drop policy if exists "formateur_read_roster" on public.classe_stagiaires;
create policy "formateur_read_roster" on public.classe_stagiaires
  for select to authenticated
  using (classe_user_id = auth.uid());

drop policy if exists "formateur_delete_roster" on public.classe_stagiaires;
create policy "formateur_delete_roster" on public.classe_stagiaires
  for delete to authenticated
  using (classe_user_id = auth.uid());

-- Le stagiaire voit et peut quitter sa propre inscription (mais ne peut pas en créer directement :
-- seule la fonction join_classe, en security definer, écrit une ligne — pour valider le code).
drop policy if exists "stagiaire_read_own_membership" on public.classe_stagiaires;
create policy "stagiaire_read_own_membership" on public.classe_stagiaires
  for select to authenticated
  using (stagiaire_user_id = auth.uid());

drop policy if exists "stagiaire_leave" on public.classe_stagiaires;
create policy "stagiaire_leave" on public.classe_stagiaires
  for delete to authenticated
  using (stagiaire_user_id = auth.uid());

revoke all on public.classe_stagiaires from anon;
revoke insert, update on public.classe_stagiaires from authenticated;
grant select, delete on public.classe_stagiaires to authenticated;

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

  select user_id, id, data into v_owner, v_id, v_data
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

  return query select v_data ->> 'nom', v_data ->> 'formateurNom', v_data ->> 'etablissement';
end;
$$;

revoke all on function public.join_classe(text, text, text, text) from public;
grant execute on function public.join_classe(text, text, text, text) to authenticated;
