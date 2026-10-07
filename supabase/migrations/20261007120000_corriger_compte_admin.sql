-- Corrige la désignation de l'administrateur.
--
-- La migration 20261007000000 désignait `ezzouhir2122@gmail.com`, qui est en réalité un
-- compte STAGIAIRE. Il détient donc des droits d'administration (lecture de tous les
-- profils et de toutes les tentatives) qu'il ne doit pas avoir. Cette migration lui retire
-- ces droits et désigne `easydigia22@gmail.com` à sa place.
--
-- Idempotente : peut être réexécutée sans dommage.

do $$
declare
  v_admin      uuid;
  v_ancien     uuid;
  v_formateur  uuid;
begin
  -- 1. Le nouveau compte administrateur doit exister avant d'être promu.
  select id into v_admin from auth.users where lower(email) = 'easydigia22@gmail.com';

  if v_admin is null then
    raise exception
      'Le compte easydigia22@gmail.com n''existe pas dans auth.users. Inscrivez-le d''abord via le formulaire d''inscription de l''application, puis relancez cette migration.';
  end if;

  update public.profiles
     set role = 'admin', statut = 'approuve', motif_refus = null, decide_le = now()
   where user_id = v_admin;

  -- La ligne de profil peut manquer si le compte est antérieur au trigger.
  insert into public.profiles (user_id, role, statut, email)
  select v_admin, 'admin', 'approuve', lower(u.email) from auth.users u where u.id = v_admin
  on conflict (user_id) do nothing;

  -- 2. Retirer les droits d'administration au compte stagiaire promu par erreur.
  select id into v_ancien from auth.users where lower(email) = 'ezzouhir2122@gmail.com';

  if v_ancien is not null then
    update public.profiles
       set role = 'stagiaire', statut = 'approuve', decide_le = now()
     where user_id = v_ancien
       and role = 'admin';
  end if;

  -- 3. S'assurer que le compte formateur est bien formateur et approuvé.
  select id into v_formateur from auth.users where lower(email) = 'ezzouhir20@gmail.com';

  if v_formateur is not null then
    update public.profiles
       set role = 'formateur', statut = 'approuve', motif_refus = null, decide_le = now()
     where user_id = v_formateur;
  end if;
end;
$$;

-- Vérification : à exécuter après, pour lire l'état obtenu.
-- select email, role, statut from public.profiles order by role, email;
