# Dossier salarié unifié Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une chronologie lisible dans chaque dossier salarié, regroupant contrat, présences, congés, paie, discipline et pièces administratives.

**Architecture:** Le dossier reste la source de consultation ; les modules existants restent les seuls écrans de modification. Un service pur agrège et trie les événements déjà disponibles, puis `EmployeesView` affiche une section chronologique accessible depuis la fiche salarié.

**Tech Stack:** React, TypeScript, Vite, données locales et synchronisation Supabase existante.

**Spec:** `docs/superpowers/specs/2026-11-15-evolution-simulrh-roadmap.md`

## Global Constraints

- Aucun stockage supplémentaire ni migration.
- Ne jamais afficher de données personnelles réelles : conserver les données fictives existantes.
- Les événements incomplets sont ignorés sans casser le dossier.

### Task 1: Agrégation de chronologie

**Files:** Create `src/services/dossierSalarieUnifie.ts`; Test `src/services/dossierSalarieUnifie.test.ts`.

- [ ] Écrire des tests pour le tri et les sources contrat, présence, congé, bulletin et procédure.
- [ ] Implémenter `construireChronologieSalarie(input, salarieId)`.
- [ ] Vérifier `npm.cmd test` et `npm.cmd run lint`.

### Task 2: Section chronologique du dossier

**Files:** Modify `src/components/employees/EmployeesView.tsx`; create `src/components/employees/ChronologieSalarie.tsx`.

- [ ] Afficher les événements avec date, type, description et état vide.
- [ ] Préserver les actions existantes de création et modification.
- [ ] Vérifier l’affichage mobile et le build.

### Task 3: Validation et publication

- [ ] Vérifier TypeScript, tests et build.
- [ ] Tester un salarié avec historique complet et un salarié sans événement.
- [ ] Déployer sur production après validation.
