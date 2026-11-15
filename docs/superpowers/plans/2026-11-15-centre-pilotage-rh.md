# Centre de pilotage RH Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Transformer les alertes RH actuelles du tableau de bord en un centre de pilotage filtrable, actionnable et accessible depuis la navigation.

**Architecture:** Conserver les données calculées côté client à partir de l'état déjà fourni par \`useAppData\`. Extraire le calcul des alertes dans un service pur et testable, consommé par \`DashboardView\` et par un nouveau composant de centre de pilotage. Le compteur de navigation est dérivé des alertes non résolues et ne crée aucune donnée persistée.

**Tech Stack:** React 19, TypeScript, Vite, lucide-react, Node test runner avec tsx, Supabase existant pour la synchronisation facultative.

**Spec:** \`docs/superpowers/specs/2026-11-15-evolution-simulrh-roadmap.md\`

## Global Constraints

- Ne pas ajouter de table Supabase ni de migration pour ce lot.
- Ne pas exposer d'e-mail ou de donnée d'authentification dans les alertes.
- Les alertes doivent fonctionner avec des données locales incomplètes.
- Les dates métier sont évaluées dans le fuseau local avec des dates ISO \`YYYY-MM-DD\`.
- Les libellés de l'interface restent en français.

## Review Focus

- Une date de fin de contrat déjà dépassée doit rester visible comme urgence.
- Une période d'essai sans date d'effet valide ne doit pas provoquer de date invalide ni d'alerte erronée.
- Un salarié sorti ne doit pas déclencher d'alerte de paie incomplète.
- Plusieurs alertes du même type doivent rester accessibles, sans qu'une limite visuelle les fasse disparaître du centre.
- Le compteur de navigation doit être zéro quand les données sont absentes ou qu'aucune alerte n'est active.

---

## File Structure

- Create: \`src/services/alertesRH.ts\` — types, calcul pur, tri et filtres des alertes.
- Create: \`src/services/alertesRH.test.ts\` — tests unitaires du calcul des alertes.
- Create: \`src/components/dashboard/CentrePilotageRH.tsx\` — liste filtrable et actions de navigation.
- Modify: \`src/components/dashboard/DashboardView.tsx\` — remplacer le calcul local par le service et afficher le résumé/action vers le centre.
- Modify: \`src/components/common/NavigationTabs.tsx\` — ajouter l'entrée \`pilotage_rh\` et son badge.
- Modify: \`src/App.tsx\` — chargement différé, routage et passage des données à la nouvelle vue.

### Task 1: Modèle et calcul pur des alertes

**Files:**
- Create: \`src/services/alertesRH.ts\`
- Test: \`src/services/alertesRH.test.ts\`

**Interfaces:**
- Consumes: \`Contrat\`, \`DemandeConge\`, \`BulletinPaie\`, \`Salarie\` depuis \`src/types/index.ts\`.
- Produces: \`export type AlerteRH\`, \`export type NiveauAlerteRH\`, \`export function calculerAlertesRH(input: AlertesRHInput, aujourdhui?: Date): AlerteRH[]\`.

- [ ] **Step 1: Write the failing test**

Créer des fixtures minimales et tester : CDD expiré = \`risque\`, fin de CDD à 15 jours = \`attention\`, congé \`Soumise\`, paie incomplète limitée aux salariés \`actif\`, et absence de date d'effet sans exception.

- [ ] **Step 2: Run test to verify it fails**

Run: \`node --import tsx --test src/services/alertesRH.test.ts\`

Expected: FAIL because \`alertesRH.ts\` does not exist.

- [ ] **Step 3: Implement \`calculerAlertesRH(input: AlertesRHInput, aujourdhui?: Date): AlerteRH[]\` in \`src/services/alertesRH.ts\`**

Définir \`AlerteRH\` avec \`id\`, \`titre\`, \`detail\`, \`niveau\`, \`onglet\` et \`dateEcheance?\`. Produire les quatre catégories déjà présentes (fin de contrat, période d'essai, congés en attente, paie incomplète), trier par niveau puis échéance et ignorer les dates invalides.

- [ ] **Step 4: Run test to verify it passes**

Run: \`node --import tsx --test src/services/alertesRH.test.ts\`

Expected: PASS. Si l'environnement Node reproduit \`uv_os_get_passwd ENOMEM\`, noter le blocage et valider avec \`npm.cmd run lint\`.

- [ ] **Step 5: Commit**

\`\`\`bash
git add src/services/alertesRH.ts src/services/alertesRH.test.ts
git commit -m "feat: centralize HR alert calculation"
\`\`\`

### Task 2: Centre de pilotage filtrable

**Files:**
- Create: \`src/components/dashboard/CentrePilotageRH.tsx\`
- Modify: \`src/components/dashboard/DashboardView.tsx\`

**Interfaces:**
- Consumes: \`AlerteRH[]\` et \`NiveauAlerteRH\` de \`src/services/alertesRH.ts\`.
- Produces: \`CentrePilotageRH\` avec props \`alertes\`, \`onNavigate\` et \`onRetourDashboard\`.

- [ ] **Step 1: Write the failing test**

Ajouter dans \`src/services/alertesRH.test.ts\` un test de tri garantissant qu'une alerte \`risque\` précède une alerte \`attention\`, quelle que soit leur origine.

- [ ] **Step 2: Run test to verify it fails**

Run: \`node --import tsx --test src/services/alertesRH.test.ts\`

Expected: FAIL because le tri par priorité n'est pas encore imposé.

- [ ] **Step 3: Implement \`CentrePilotageRH\` in \`src/components/dashboard/CentrePilotageRH.tsx\`**

Afficher les compteurs Tous / Urgentes / À surveiller, une liste complète sans limitation à quatre éléments, un état vide et un bouton par alerte qui appelle \`onNavigate(alerte.onglet)\`. Réutiliser \`Card\`, \`SectionTitle\`, \`Badge\` et la palette existante.

- [ ] **Step 4: Replace dashboard-local alert construction in \`DashboardView.tsx\`**

Appeler \`calculerAlertesRH\`, conserver seulement les quatre premières alertes dans le résumé et ajouter un bouton « Voir toutes les alertes » vers \`pilotage_rh\`.

- [ ] **Step 5: Run static verification**

Run: \`npm.cmd run lint\`

Expected: PASS with no TypeScript error.

- [ ] **Step 6: Commit**

\`\`\`bash
git add src/components/dashboard/CentrePilotageRH.tsx src/components/dashboard/DashboardView.tsx src/services/alertesRH.ts src/services/alertesRH.test.ts
git commit -m "feat: add HR control center"
\`\`\`

### Task 3: Navigation et routage

**Files:**
- Modify: \`src/components/common/NavigationTabs.tsx\`
- Modify: \`src/App.tsx\`

**Interfaces:**
- Consumes: \`CentrePilotageRH\`, \`calculerAlertesRH\` et le type \`OngletNavigation\` étendu avec \`'pilotage_rh'\`.
- Produces: route lazy-loadée accessible depuis le menu et le tableau de bord.

- [ ] **Step 1: Extend \`OngletNavigation\` with \`'pilotage_rh'\` in \`NavigationTabs.tsx\`**

Ajouter l'entrée « Pilotage RH » après « Tableau de bord », avec l'icône \`BellRing\` et un prop optionnel \`nombreAlertesRH\` utilisé comme badge.

- [ ] **Step 2: Add lazy route in \`App.tsx\`**

Charger \`CentrePilotageRH\` avec \`lazy\`, calculer les alertes à partir des données déjà extraites de \`useAppData\`, passer le compteur à \`NavigationTabs\` et rendre la vue quand \`ongletActif === 'pilotage_rh'\`.

- [ ] **Step 3: Run production verification**

Run: \`npm.cmd run lint; npm.cmd run build\`

Expected: PASS. Les avertissements Vite préexistants peuvent subsister, aucune erreur de compilation ne doit apparaître.

- [ ] **Step 4: Manually verify the workflow**

Créer ou utiliser un contrat proche de sa fin, un congé soumis et une paie incomplète ; vérifier le badge, le filtre « Urgentes », l'accès à l'écran cible et l'état vide après suppression des conditions.

- [ ] **Step 5: Commit**

\`\`\`bash
git add src/App.tsx src/components/common/NavigationTabs.tsx src/components/dashboard/CentrePilotageRH.tsx src/components/dashboard/DashboardView.tsx src/services/alertesRH.ts src/services/alertesRH.test.ts
git commit -m "feat: route HR alerts from navigation"
\`\`\`

## Self-Review

- La feuille de route couvre les sept lots proposés ; ce plan traite uniquement le lot indépendant et prioritaire « Centre de pilotage RH ».
- Les tâches couvrent les catégories d'alertes actuelles, leurs anomalies de date, les salariés sortis, le compteur et la liste non tronquée.
- Les interfaces sont définies avant leurs consommateurs : \`alertesRH.ts\` précède les composants et le routage.
- Les lots Calendrier, Dossier salarié, Coffre documentaire, Recrutement, Compétences et Rapports nécessitent chacun leur propre spécification avant implémentation afin d'éviter un plan monolithique.

