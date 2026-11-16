# Calendrier RH Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher un calendrier mensuel unique des congés, absences, fins de contrat, périodes d'essai et échéances de paie.

**Architecture:** Les événements sont dérivés côté client des données existantes ; aucune table ni saisie supplémentaire. Un service pur construit des événements datés, puis une vue calendrier les regroupe par jour et permet d’accéder au module source.

**Tech Stack:** React, TypeScript, Vite, lucide-react.

**Spec:** `docs/superpowers/specs/2026-11-15-evolution-simulrh-roadmap.md`

## Global Constraints

- Aucune migration Supabase.
- Les dates invalides sont ignorées sans casser la vue.
- Le calendrier fonctionne en mode local et mobile.

## Review Focus

- Les événements sur plusieurs jours restent visibles à chaque date concernée.
- Un mois sans événement affiche un état vide.
- Les fins de contrat et d’essai ne créent pas de doublon.
- Les salariés sortis n’affichent pas de nouvelle échéance de paie.
- La navigation depuis un événement mène au bon module.

### Task 1: Agrégation des événements calendaires

**Files:**
- Create: `src/services/calendrierRH.ts`
- Test: `src/services/calendrierRH.test.ts`

- [ ] Écrire les tests des congés multi-jours, absences, fins de contrat, fins d’essai et paie.
- [ ] Exécuter le test en échec.
- [ ] Implémenter `construireEvenementsCalendrierRH(input): EvenementCalendrierRH[]`.
- [ ] Exécuter les tests puis `npm.cmd run lint`.
- [ ] Commit: `feat: derive HR calendar events`.

### Task 2: Vue calendrier mensuelle

**Files:**
- Create: `src/components/dashboard/CalendrierRH.tsx`

- [ ] Créer la grille mensuelle, ses boutons mois précédent/suivant, sa légende et l’état vide.
- [ ] Afficher les événements par jour, avec accès au module source.
- [ ] Vérifier responsive et `npm.cmd run build`.
- [ ] Commit: `feat: add monthly HR calendar`.

### Task 3: Navigation et intégration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/common/NavigationTabs.tsx`

- [ ] Ajouter l’onglet `calendrier_rh`, le chargement différé et les props de données.
- [ ] Vérifier les tests, TypeScript et le build de production.
- [ ] Valider manuellement le changement de mois et les liens d’événements.
- [ ] Commit: `feat: route HR calendar`.

## Self-Review

Les trois tâches couvrent le calcul, l’affichage et la navigation, sans introduire de stockage supplémentaire ni de doublon avec les modules existants.
