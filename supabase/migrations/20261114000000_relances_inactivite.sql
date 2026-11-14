-- Paramètres et journal des relances automatiques d'inactivité.
-- Les e-mails sont envoyés exclusivement par la fonction Vercel avec sa clé
-- Supabase service_role : le navigateur n'a jamais accès aux adresses e-mail.

create table if not exists public.relance_parametres (
  formateur_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default false,
  delai_inactivite_jours integer not null default 7 check (delai_inactivite_jours between 1 and 90),
  delai_entre_relances_jours integer not null default 7 check (delai_entre_relances_jours between 1 and 90),
  updated_at timestamptz not null default now()
);

create table if not exists public.relance_envois (
  id uuid primary key default gen_random_uuid(),
  formateur_id uuid not null references auth.users(id) on delete cascade,
  stagiaire_user_id uuid not null references auth.users(id) on delete cascade,
  envoye_le timestamptz not null default now(),
  statut text not null check (statut in ('envoye', 'echec')),
  erreur text,
  unique (formateur_id, stagiaire_user_id, envoye_le)
);

create index if not exists relance_envois_recherche_idx
  on public.relance_envois (formateur_id, stagiaire_user_id, envoye_le desc);

alter table public.relance_parametres enable row level security;
alter table public.relance_envois enable row level security;

drop policy if exists "formateur_manage_relance_settings" on public.relance_parametres;
create policy "formateur_manage_relance_settings" on public.relance_parametres
  for all to authenticated
  using (formateur_id = auth.uid())
  with check (formateur_id = auth.uid());

drop policy if exists "formateur_read_relance_logs" on public.relance_envois;
create policy "formateur_read_relance_logs" on public.relance_envois
  for select to authenticated
  using (formateur_id = auth.uid());

revoke all on public.relance_parametres, public.relance_envois from anon;
grant select, insert, update, delete on public.relance_parametres to authenticated;
grant select on public.relance_envois to authenticated;
