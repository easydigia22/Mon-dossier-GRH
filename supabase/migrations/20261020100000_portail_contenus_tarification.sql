-- Ajoute à un contenu du portail : une image de couverture, et un modèle
-- économique gratuit/payant avec prix.
--
-- Un contenu « payant » n'expose PAS son PDF publiquement : le visiteur commande
-- via WhatsApp et reçoit le document après paiement. Le vrai verrou (fichiers
-- privés + lien signé après encaissement) relève d'une phase « paiement en ligne »
-- ultérieure. Ici on ne stocke que la couverture, le statut tarifaire et le prix.
--
-- Idempotente (add column if not exists). À exécuter dans Supabase Studio > SQL
-- Editor du projet de prod, comme les autres migrations du portail.

alter table public.portail_contenus
  add column if not exists image_couverture text,
  add column if not exists tarification     text not null default 'gratuit',
  add column if not exists prix             numeric;

-- Contrainte de valeurs sur la tarification (ajoutée à part pour rester idempotent).
alter table public.portail_contenus drop constraint if exists portail_contenus_tarification_check;
alter table public.portail_contenus add constraint portail_contenus_tarification_check
  check (tarification in ('gratuit', 'payant'));
