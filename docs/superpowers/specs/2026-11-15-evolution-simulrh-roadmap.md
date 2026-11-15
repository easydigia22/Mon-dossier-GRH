# Feuille de route d'évolution de SIMULRH

## Vision

Faire de SIMULRH un environnement pédagogique complet de gestion RH marocaine : l'apprenant réalise les opérations, le formateur suit la progression et l'application met en évidence les décisions qui demandent une action.

## Principes produit

- Ne pas dupliquer les fonctionnalités déjà présentes : le tableau de bord contient déjà des alertes RH ; la première évolution l'approfondit au lieu de créer un onglet vide.
- Préserver les données fictives et le fonctionnement hors ligne existant.
- Réserver les données de stagiaires au formateur et respecter les règles RLS Supabase existantes.
- Chaque lot doit être livrable, testable et utile isolément.
- Conserver le français comme langue d'interface et les règles métier marocaines comme contexte pédagogique.

## Lots proposés

### Lot 1 — Centre de pilotage RH (priorité immédiate)

Faire évoluer le bloc d'alertes actuel en vue actionnable : filtres par urgence, échéances contractuelles, demandes de congés, paie incomplète, accès direct aux écrans concernés et compteur dans la navigation. Une vue dédiée ne sera ajoutée que si le volume d'alertes justifie de quitter le tableau de bord.

### Lot 2 — Calendrier RH

Ajouter une vue mensuelle des congés, absences, fins de CDD, périodes d'essai et jalons de paie. Les événements sont calculés à partir des données existantes, sans double saisie.

### Lot 3 — Dossier salarié unifié

Compléter la fiche du salarié par une chronologie consolidée : embauche, contrat, présences, congés, discipline, paie et documents. La vue devient le point de consultation de référence sans remplacer les écrans de gestion spécialisés.

### Lot 4 — Coffre documentaire pédagogique

Permettre de rattacher des pièces fictives ou modèles à un dossier salarié, de voir les documents obligatoires manquants et de générer une checklist. Aucun document réel sensible ne doit être requis.

### Lot 5 — Recrutement et intégration

Introduire un parcours candidat → entretien → proposition → salarié, avec checklist d'intégration. Ce lot doit rester distinct du dossier salarié actif afin de préserver les données de paie.

### Lot 6 — Compétences, entretiens et formation

Ajouter référentiel de compétences, objectifs, entretiens et plan de développement. Le formateur peut l'utiliser comme cas pratique et suivre les livrables.

### Lot 7 — Rapports et traçabilité

Créer des tableaux/exportations pédagogiques (absentéisme, effectif, contrats, masse salariale) et un journal d'audit des opérations applicatives, sans exposer d'informations d'authentification.

## Ordre de réalisation

1. Lot 1 : Centre de pilotage RH.
2. Lot 2 : Calendrier RH.
3. Lot 3 : Dossier salarié unifié.
4. Lot 4 : Coffre documentaire pédagogique.
5. Lots 5 et 6, chacun conçu puis planifié séparément.
6. Lot 7 une fois les nouvelles données stabilisées.

## Critères de réussite généraux

- Chaque nouvelle alerte, échéance ou donnée mène à une action claire.
- Les écrans restent utilisables sur mobile.
- Les calculs et listes tolèrent les données incomplètes ou le mode local.
- Les builds TypeScript et de production restent verts ; les tests automatisés sont complétés lorsque l'environnement le permet.

