-- Procédures disciplinaires et licenciements (module "Discipline & Licenciement").
-- Même schéma et mêmes politiques RLS que la table `contrats` (migration init).

create table if not exists public.procedures (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id         text not null,
  salarie_id text,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists procedures_salarie_idx on public.procedures (user_id, salarie_id);

alter table public.procedures enable row level security;
drop policy if exists "owner_all" on public.procedures;
create policy "owner_all" on public.procedures for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke all on public.procedures from anon;
