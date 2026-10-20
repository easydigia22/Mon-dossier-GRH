-- Sous-catégorie éditoriale d'un contenu au sein de sa rubrique (ex. « Recrutement »,
-- « Gestion de carrière » pour GRH). Permet de filtrer les contenus d'une rubrique
-- en cliquant sur une puce de sous-thème. Valeur libre (texte), rapprochée des
-- `sousThemes` définis côté application (lib/rubriques). Absent = non classé.
--
-- Idempotente. À exécuter dans Supabase Studio > SQL Editor (prod).

alter table public.portail_contenus
  add column if not exists sous_theme text;
