-- Donne aux comptes « formateur » un accès de lecture/écriture à TOUTES les tentatives
-- de mission (table tentatives), pour un suivi en direct sans passer par l'export/import JSON.
-- Portée : un seul espace de formation par projet Supabase (tout formateur voit tous les
-- stagiaires de ce projet). Pour isoler plusieurs cohortes, ajouter une notion de classe
-- avec code d'invitation dans une migration ultérieure.
--
-- Les stagiaires conservent leur policy "owner_all" existante (lecture/écriture de leurs
-- propres tentatives uniquement). Le formateur s'ajoute en complément, il ne la remplace pas.

create or replace function public.is_formateur()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'formateur'
  );
$$;

drop policy if exists "formateur_read_all" on public.tentatives;
create policy "formateur_read_all" on public.tentatives
  for select to authenticated
  using (public.is_formateur());

drop policy if exists "formateur_update_all" on public.tentatives;
create policy "formateur_update_all" on public.tentatives
  for update to authenticated
  using (public.is_formateur())
  with check (public.is_formateur());

grant select, update on public.tentatives to authenticated;
