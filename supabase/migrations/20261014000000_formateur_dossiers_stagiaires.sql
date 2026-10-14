-- Consultation en lecture seule, par le formateur, du dossier de travail de ses
-- propres stagiaires (entreprise, salariés, contrats, présences, congés, bulletins).
-- Spec : docs/superpowers/specs/2026-10-14-dossier-stagiaire-formateur-design.md
--
-- Idempotente : réexécutable sans dommage.
-- SELECT uniquement : aucun grant d'écriture. Les policies owner_all existantes
-- (accès plein du stagiaire à son dossier) sont conservées ; celle-ci s'ajoute.

-- Appartenance : vrai si l'appelant est un formateur approuvé ET que le stagiaire
-- visé est rattaché à l'une de ses classes. is_formateur() reste en facteur : un
-- formateur révoqué (statut <> 'approuve') perd l'accès, bien que ses lignes de
-- classes subsistent.
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

-- Policy de lecture sur chacune des 6 tables métier. SELECT uniquement.
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
