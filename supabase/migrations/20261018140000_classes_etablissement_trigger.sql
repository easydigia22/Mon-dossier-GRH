-- Intégrité de classes.etablissement_id (modèle « établissement par classe »).
-- Complète 20261018000000.
--
-- À l'INSERT sans valeur : on retombe sur l'établissement du formateur propriétaire
--   (garantit qu'une classe appartient toujours à un établissement).
-- À l'UPDATE sans valeur : on conserve l'ancienne (un client qui n'enverrait pas la
--   colonne ne doit pas effacer le rattachement existant).
--
-- Idempotente.

create or replace function public.classes_set_etablissement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.etablissement_id is null then
    if tg_op = 'UPDATE' and old.etablissement_id is not null then
      new.etablissement_id := old.etablissement_id;
    else
      new.etablissement_id := (select etablissement_id from public.profiles where user_id = new.user_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_classes_etablissement on public.classes;
create trigger trg_classes_etablissement
  before insert or update on public.classes
  for each row execute function public.classes_set_etablissement();
