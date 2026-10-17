# SIMULRH — Fiche technique de l'application

> **Simulateur RH & Paie** pour la formation professionnelle **OFPPT** (Maroc).
> Application web pédagogique permettant à des stagiaires de gérer un dossier
> administratif du personnel fictif (entreprise « SARL Atlas ») et de calculer
> la paie conformément au droit marocain : Code du Travail (Loi 65‑99), Dahir
> CNSS et CGI (Article 73).

---

## 0. 🏅 Règle d'or — Livraison automatique

> **À chaque fonctionnalité, correction ou changement validé, enchaîner
> AUTOMATIQUEMENT, sans attendre de confirmation :**
>
> 1. **Commit** — message en convention *Conventional Commits*
>    (`feat:`, `fix:`, `chore:`, `docs:`…) décrivant le changement.
> 2. **Push** — vers `origin/main`
>    (GitHub : `easydigia22/Mon-dossier-GRH`).
> 3. **Déploiement production** — Vercel :
>    `npx vercel --prod --scope easydigia --yes`
>    (projet `mon-dossier-grh`, aliasé sur **simulrh.one**).
>
> **Aucun changement n'est considéré « terminé » tant qu'il n'est pas commité,
> poussé et déployé en production.** Vérifier ensuite que `simulrh.one` sert
> bien la nouvelle version.

---

## 1. Présentation générale

| | |
|---|---|
| **Nom** | SIMULRH (anciennement « Mon Dossier Administratif / Mon‑dossier‑GRH ») |
| **Type** | SPA (Single Page Application) web, installable en PWA |
| **Public** | Stagiaires et formateurs OFPPT — gestion administrative du personnel & paie |
| **Langue** | Français (fr) |
| **Domaine de prod** | simulrh.one (déploiement Vercel) |
| **Nature** | Simulateur pédagogique : toutes les données sont **fictives** (CIN, CNSS, RIB marqués « FICTIF ») |

L'application couvre le cycle administratif complet d'un salarié : dossier du
personnel, contrats, présences/absences, congés, discipline, puis toute la
chaîne de paie jusqu'aux déclarations sociales (CNSS / DAMANCOM) et aux
documents RH. Une couche pédagogique (modes, niveaux, missions, correction)
s'ajoute pour l'usage en centre de formation.

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| **Langage** | TypeScript |
| **UI** | React 19 (composants fonctionnels, `lazy`/`Suspense` pour le code‑splitting) |
| **Build / dev** | Vite 8 |
| **Styles** | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| **Icônes** | lucide-react |
| **Animations** | motion |
| **Calcul monétaire** | decimal.js (précision 20, arrondi `ROUND_HALF_UP`) |
| **Génération PDF** | jsPDF |
| **Backend / cloud** | Supabase (`@supabase/supabase-js`) — Auth + Postgres + RLS |
| **IA** | `@google/genai` (Gemini) |
| **Persistance locale** | IndexedDB (repli LocalStorage) |
| **PWA** | vite-plugin-pwa (Workbox, `registerType: autoUpdate`) |
| **Serveur** | express (service statique / preview) |
| **Tests** | `node --test` + tsx (`*.test.ts`) |

### Scripts npm
- `npm run dev` — serveur de développement Vite (port 3000)
- `npm run build` — build de production
- `npm run preview` — prévisualisation du build
- `npm run lint` — vérification des types (`tsc --noEmit`)
- `npm run test` — tests unitaires

---

## 3. Architecture applicative

```
src/
├── App.tsx                 # Shell : routage par onglets, gestion des rôles, toasts
├── main.tsx                # Point d'entrée React
├── types/index.ts          # Modèle de données complet (Entreprise, Salarié, Bulletin…)
├── hooks/
│   ├── useAppData.ts        # État global : charge/sauvegarde, calcul paie, CRUD
│   └── useInstallPrompt.ts  # Invite d'installation PWA
├── services/               # Logique métier et intégrations
│   ├── payrollEngine.ts     # Moteur de calcul de paie (ancienneté, IR, CNSS, AMO)
│   ├── rubriques.ts         # Rubriques de paie personnalisées + répartition fiscale
│   ├── disciplineEngine.ts  # Calcul des procédures disciplinaires & licenciement
│   ├── rulesData.ts         # Paramètres juridiques Maroc (taux, barèmes, sources)
│   ├── db.ts                # Persistance locale IndexedDB
│   ├── cloudSync.ts         # Synchronisation différentielle vers Supabase
│   ├── supabase.ts          # Client Supabase
│   ├── profile.ts           # Rôle & statut du compte connecté
│   ├── adminService.ts      # Administration des comptes
│   ├── classeJoin.ts        # Rattachement d'un stagiaire à une classe (code)
│   ├── trainerLive.ts       # Suivi temps réel côté formateur
│   ├── dossierStagiaire.ts  # Dossiers stagiaires côté formateur
│   ├── branding.ts          # Identité visuelle
│   └── exportService.ts     # Exports (sauvegarde/restauration état)
├── components/             # Une vue par module métier (voir §4)
└── data/                   # Jeux de données de démonstration & catalogue rubriques
```

### Flux de données
`useAppData` centralise tout l'état applicatif (entreprise, salariés, contrats,
présences, congés, bulletins, règles, missions, tentatives, classes,
procédures) et les paramètres d'exécution (période active, mode pédagogique,
niveau). Au démarrage :

1. Lecture de la copie **locale** (IndexedDB).
2. Si un compte est connecté (`cloudEnabled`), priorité à l'état **cloud** Supabase ; la 1ʳᵉ sauvegarde migre l'ancien espace local vers le cloud.
3. Chaque collection = une table Supabase ; seules les lignes modifiées sont renvoyées (upsert différentiel par chunks de 200, pagination 1000).

Un nouvel espace de travail démarre **vide** ; le jeu « SARL Atlas » est
rechargeable à la demande (`reinitialiserDonneesDemo`).

---

## 4. Modules fonctionnels (onglets)

| Onglet | Composant | Rôle |
|---|---|---|
| **Tableau de bord** | `DashboardView` / `FormateurDashboard` | Synthèse ; vue stagiaire (paie entreprise) ou vue formateur (suivi des classes) |
| **Mon entreprise** | `CompanyView` | Fiche entreprise (ICE, CNSS, RC, patente, horaires légaux) |
| **Dossiers du personnel** | `EmployeesView` | CRUD salariés + checklist des pièces du dossier + historique |
| **Contrats** | `ContractsView` | CDI, CDD, Avenant, ANAPEC, Intérim, Stage, Apprentissage, Temps partiel, Saisonnier ; motifs CDD, période d'essai, anomalies |
| **Présences & Absences** | `PresenceView` | Pointages, retards, absences, heures sup (25/50/100 %), impact paie |
| **Congés & Maladies** | `LeavesView` | Demandes (annuel, mariage, naissance, décès, maternité…), soldes, workflow |
| **Discipline & Licenciement** | `DisciplineView` | Procédure disciplinaire + solde de tout compte (réservé formateur) |
| **Préparation paie** | `PayrollPreparationView` | Rubriques par salarié, calcul en masse, clôture de période |
| **Bulletins de paie** | `PayrollSlipsView` | Bulletin détaillé avec explications pédagogiques pas‑à‑pas, impression |
| **Livre de paie** | `PayrollBookView` | Récapitulatif mensuel multi‑salariés |
| **CNSS & AMO** | `CnssView` | Récapitulatif des cotisations, concordance avec le livre de paie |
| **Télédéclaration DAMANCOM** | `DamancomView` | Simulation du bordereau de télédéclaration |
| **Documents RH** | `DocumentsView` | Attestations, certificats et documents générés |
| **Exercices & Missions** | `MissionsView` | Missions pédagogiques, barème, indices progressifs, tentatives |
| **Espace Formateur** | `TrainerView` | Gestion des classes, codes d'invitation, suivi des tentatives |
| **Administration** | `AdminView` | Gestion des comptes (réservé admin) |
| **Paramètres & Lois** | `SettingsView` | Référentiel juridique, sauvegarde/restauration, reset démo |

---

## 5. Moteur de paie (`payrollEngine.ts`)

Calcul conforme au droit marocain, avec `decimal.js` pour éviter les erreurs
d'arrondi. Chaque bulletin produit des lignes détaillées + des explications
pédagogiques (formule, valeurs, référence légale).

**Composantes calculées :**
- **Ancienneté** — taux par paliers (Art. 350 Code du Travail) : 5 % (≥2 ans), 10 % (≥5), 15 % (≥12), 20 % (≥20), 25 % (≥25).
- **Heures supplémentaires** — majorations 25 %, 50 %, 100 % (jour/nuit, repos).
- **IR** — barème progressif mensuel (Art. 73‑II du CGI), tranches et somme à déduire ; déduction pour charges de famille (30 MAD/personne, max 180 MAD).
- **CNSS** — part salariale 4,48 % (plafond 6 000 MAD → max 268,80 MAD), part patronale prestations 8,98 % (plafonnée), allocations familiales 6,40 % (déplafonnée).
- **AMO** — salariale 2,26 % (déplafonnée), patronale 4,11 % (2,26 % + 1,85 % solidarité).
- **Taxe de formation professionnelle** — 1,60 % patronal (déplafonnée).
- **Frais professionnels** — 35 % / 25 % plafonnés.
- **Résultats** — salaire net à payer et coût total employeur.

Les **rubriques personnalisées** (`rubriques.ts`) se déclinent en trois types
qui pilotent le traitement fiscal/social : `prime`, `indemnite_exoneree`,
`avantage_nature`.

---

## 6. Rôles & sécurité

**Rôles** (`profile.ts`) : `stagiaire`, `formateur`, `admin`
— **Statuts de compte** : `en_attente`, `approuve`, `refuse`, `desactive`.

- Mode **local** (sans compte) : accès complet, comme un simulateur autonome.
- **Stagiaire** : onglets métier + missions ; pas d'accès Discipline, Espace Formateur ni Administration.
- **Formateur** : suivi des classes/tentatives (tableau de bord = suivi des stagiaires), accès Discipline et Espace Formateur.
- **Admin** : hérite du formateur + onglet Administration (en lecture seule sur l'espace formateur).

La sécurité d'accès aux données repose sur les **policies RLS Supabase** (voir
`supabase/migrations/`), le profil étant fixé côté serveur (jamais un accès
formateur par défaut en cas de profil absent).

---

## 7. Persistance & synchronisation

- **Locale** : IndexedDB `MonDossierAdministratif_DB` (repli LocalStorage). État sérialisé versionné avec `derniereSauvegarde`.
- **Cloud** : Supabase, une table par collection (`entreprises`, `salaries`, `contrats`, `evenements_presence`, `demandes_conges`, `bulletins`, `regles`, `tentatives`, `classes`, `procedures`). Synchronisation différentielle (upsert des lignes modifiées uniquement).
- **Sauvegarde/restauration** : export/import de l'état applicatif complet depuis l'onglet Paramètres.

### Migrations Supabase principales
`init_mon_dossier_grh`, `profiles_roles`, `formateur_tentatives_access`,
`classe_join_code`, `procedures_disciplinaires`, `multi_formateurs_admin`,
`administration_comptes`, `archivage_classes`,
`formateur_dossiers_stagiaires`.

---

## 8. Couche pédagogique

- **Modes** : `demonstration`, `entrainement`, `evaluation`.
- **Niveaux** : `essentiel`, `avance` (filtre le nombre de missions proposées).
- **Missions** (`missionsData.ts`) : contexte, compétences, livrables, barème /20 (dossier 4 + règles 4 + calculs 8 + contrôles 4), indices progressifs, réponse attendue et erreurs fréquentes.
- **Tentatives** : réponses du stagiaire, correction détaillée par champ (écarts), notes par rubrique.
- **Classes** : rattachement par **code d'invitation**, archivage, suivi temps réel côté formateur.

---

## 9. PWA & déploiement

- **PWA** installable : manifeste `SIMULRH`, thème `#1C2459`, affichage `standalone`, icônes 192/512/maskable, précache Workbox, mise à jour auto.
- **Déploiement** : Vercel, domaine **simulrh.one** (compte easydigia / projet mon‑dossier‑grh).
- **Allègement du 1ᵉʳ chargement** : chaque vue est chargée en `lazy` (critique pour un partage via lien/WhatsApp).

---

## 10. Conformité & références légales

L'ensemble des règles est paramétré dans `rulesData.ts`
(`RegleParametreJuridique` : intitulé, domaine, valeur/formule, population,
dates d'effet, **source exacte**, statut de vérification, validation
formateur). Références citées dans l'application :

- **Code du Travail marocain** — Loi 65‑99 (ancienneté Art. 350, procédures disciplinaires, licenciement, congés).
- **Dahir CNSS** — cotisations sociales et plafonds.
- **CGI** — Article 73 (barème IR).

> Charte de fiabilité : chaque paramètre distingue `verifiee_officielle` d'une
> `hypothese_pedagogique`, afin que l'usage en formation reste traçable.

---

*Fiche technique générée à partir du code source (branche `main`). Toutes les
données nominatives de l'application sont fictives et destinées à la formation.*
