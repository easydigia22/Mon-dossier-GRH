# Module Discipline & Licenciement — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un onglet « Discipline & Licenciement » qui fait dérouler une procédure
disciplinaire marocaine complète (qualification → convocation → entretien/PV → sanction →
solde de tout compte) par salarié, avec documents imprimables et calculs légaux chiffrés.

**Architecture:** Nouveau type `ProcedureDisciplinaire` persisté exactement comme
`Contrat` (state local + IndexedDB + sync Supabase table dédiée). Nouveau moteur de calcul
pur `disciplineEngine.ts` (miroir de `payrollEngine.ts`, `Decimal.js`). Nouvelle vue
`DisciplineView.tsx` en stepper vertical à 5 étapes, routée comme un 15ᵉ onglet de sidebar
réservé au formateur.

**Tech Stack:** React 19 + TypeScript, Decimal.js pour les calculs monétaires, Supabase
(Postgres + RLS) pour la persistance cloud, Tailwind pour le style, `tsx` pour les scripts
de vérification manuelle (pas de suite de tests automatisés dans ce repo — voir Global
Constraints).

**Spec:** `docs/superpowers/specs/2026-10-05-discipline-licenciement-design.md`

## Global Constraints

- Ce repo n'a **aucune suite de tests automatisés** (confirmé : aucun fichier `*.test.*`
  nulle part dans `src/`). Ne pas introduire vitest/jest unilatéralement. Chaque tâche de
  calcul se vérifie avec un script `tsx` jetable (non commité) qui appelle la fonction et
  affiche le résultat en console, comparé à la valeur attendue calculée à la main dans
  l'étape. Chaque tâche UI se vérifie visuellement dans le navigateur (dev server +
  `mcp__claude-in-chrome`, ou description précise de ce qu'il faut voir si l'outil n'est
  pas disponible).
- Couleur de marque : `#1C2459` (primaire, ex-`#16324F`) et `#149D92` (accent). Toujours
  ces hex exacts, jamais de nouvelles couleurs.
- Toutes les chaînes visibles sont en français.
- `npx tsc --noEmit` doit rester sans erreur après chaque tâche touchant du `.ts`/`.tsx`.
- `npm run build` doit rester sans erreur après la dernière tâche.
- Ne jamais committer sans que `tsc --noEmit` soit passé pour ce commit.
- Chaque montant monétaire calculé passe par `Decimal.js` puis `roundMoney()` (déjà
  exporté par `src/services/payrollEngine.ts`, à réutiliser, pas à dupliquer).
- Chaque élément d'UI react de ce module affiche systématiquement, à côté de chaque
  montant calculé, la formule théorique + l'article de loi cité (voir `DetailCalculExplicite`
  dans `src/types/index.ts` comme modèle de forme, déjà utilisé par `payrollEngine.ts`).

## Review Focus

- **Salarié sans aucune demande de congé enregistrée** → `estimerSoldeCongesRestants`
  doit retourner une valeur par défaut raisonnable (18, comme le défaut de
  `LeavesView.tsx`), jamais `NaN`/`undefined` qui casserait l'affichage du solde.
- **Ancienneté < 1 an au moment de la faute** → l'indemnité de licenciement (Art. 53) doit
  être 0 (aucune tranche atteinte), pas une valeur négative ni une erreur de division.
- **Dates de convocation/entretien/notification non encore saisies** (étapes pas
  terminées) → les alertes de conformité et le calcul de solde ne doivent pas planter sur
  des `Date` invalides ; elles ne doivent s'évaluer qu'une fois les deux dates requises
  présentes.
- **Faute légère avec sanction = mise à pied > 8 jours** saisie par erreur → le champ
  `joursMiseAPied` doit être plafonné à 8 dans l'UI (Art. 37), pas seulement documenté.
- **Deuxième tentative d'ouvrir une procédure** pour un salarié qui a déjà une procédure
  `statut: 'ouverte'` → le bouton « Nouvelle procédure » doit être désactivé avec un
  message explicite, pas silencieusement créer un doublon.

---

## Task 1: Modèle de données — types

**Files:**
- Modify: `src/types/index.ts` (ajout en fin de fichier)

**Interfaces:**
- Produces: `TypeFauteDisciplinaire`, `SanctionDisciplinaire`,
  `StatutProcedureDisciplinaire`, `AlerteConformiteProcedure`, `CalculLicenciement`,
  `ProcedureDisciplinaire` — utilisés par toutes les tâches suivantes.

- [ ] **Step 1: Ajouter les types en fin de `src/types/index.ts`**

```ts
// ============================================================
// Module Discipline & Licenciement
// ============================================================

export type TypeFauteDisciplinaire = 'legere' | 'grave';

export type SanctionDisciplinaire =
  | 'avertissement'
  | 'blame'
  | 'mise_a_pied'
  | 'licenciement';

export type StatutProcedureDisciplinaire = 'ouverte' | 'cloturee';

export interface AlerteConformiteProcedure {
  code: string; // ex: 'delai-convocation', 'delai-notification'
  message: string;
  articleLoi: string;
  severite: 'avertissement' | 'risque';
}

export interface CalculLicenciement {
  indemniteLicenciement: number;
  indemnitePreavis: number;
  indemniteCongesRestants: number;
  primeAncienneteSolde: number;
  salaireProrataMoisSortie: number;

  licenciementAbusif: boolean;
  dommagesInteretsAbusif: number;

  joursRetardPaiement: number;
  tauxInteretAnnuel: number;
  interetsRetard: number;

  totalSoldeToutCompte: number;
  alertesConformite: AlerteConformiteProcedure[];
}

export interface ProcedureDisciplinaire {
  id: string;
  salarieId: string;
  typeFaute: TypeFauteDisciplinaire;
  motifFaute: string;
  dateConstatation: string; // AAAA-MM-JJ
  categorieSalarie: 'cadre' | 'non_cadre';

  dateConvocation?: string;
  assistanceDemandee: boolean;

  dateEntretien?: string;
  resumeEntretien?: string;
  signePar?: 'les_deux' | 'salarie_absent' | 'refus_signature';

  sanction?: SanctionDisciplinaire;
  joursMiseAPied?: number;
  dateNotificationSanction?: string;

  calculLicenciement?: CalculLicenciement;

  statut: StatutProcedureDisciplinaire;
  creeLe: string;
  misAJourLe: string;
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur (ces types ne sont encore consommés nulle part, donc aucun risque
de régression).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(discipline): add ProcedureDisciplinaire data model"
```

---

## Task 2: Référentiel légal

**Files:**
- Modify: `src/services/rulesData.ts` (ajout dans le tableau `REGLES_JURIDIQUES_MAROC`, à
  la suite de l'entrée `conges-payes-art-231` existante)

**Interfaces:**
- Consumes: `RegleParametreJuridique` (déjà défini dans `src/types/index.ts`)
- Produces: 6 nouvelles entrées dans `REGLES_JURIDIQUES_MAROC`, consultables depuis
  l'onglet Paramètres & Lois (aucune autre tâche n'en dépend directement, mais le mode
  pédagogique de `DisciplineView.tsx` cite ces mêmes articles en texte libre).

- [ ] **Step 1: Ouvrir `src/services/rulesData.ts` et repérer la fin du tableau**

Repérer la dernière entrée (`conges-payes-art-231`) pour insérer juste avant le `];` de
fermeture.

- [ ] **Step 2: Ajouter les 6 entrées**

```ts
  {
    id: 'art-37-echelle-sanctions',
    intitule: 'Échelle des sanctions disciplinaires (faute légère)',
    domaine: 'droit_travail',
    valeurOuFormule: '1) Avertissement 2) Blâme 3) 2e blâme ou mise à pied ≤ 8 jours 4) 3e blâme, transfert ou rétrogradation — dans la même année',
    populationConcernee: 'Tous les salariés du secteur privé non agricole',
    dateDebutEffet: '2004-06-08',
    sourceExacte: 'Code du Travail marocain (Loi n° 65-99), Article 37',
    dateConsultation: '2026-10-05',
    statutVerification: 'verifiee_officielle',
    validationFormateur: true,
    descriptionDetaillee: "L'employeur ne peut infliger qu'une seule des sanctions de cette échelle par faute, de façon progressive, sur une période de 12 mois à compter de la première sanction."
  },
  {
    id: 'art-39-faute-grave',
    intitule: 'Fautes graves justifiant un licenciement sans préavis ni indemnité',
    domaine: 'droit_travail',
    valeurOuFormule: "Vol, abus de confiance, violence, divulgation d'un secret professionnel, faute ayant causé un dommage matériel considérable… (liste non exhaustive de l'Art. 39)",
    populationConcernee: 'Tous les salariés du secteur privé non agricole',
    dateDebutEffet: '2004-06-08',
    sourceExacte: 'Code du Travail marocain (Loi n° 65-99), Article 39',
    dateConsultation: '2026-10-05',
    statutVerification: 'verifiee_officielle',
    validationFormateur: true,
    descriptionDetaillee: "Une faute grave avérée, et une procédure régulière, dispensent l'employeur de l'indemnité de licenciement et de l'indemnité compensatrice de préavis."
  },
  {
    id: 'art-41-licenciement-abusif',
    intitule: 'Dommages-intérêts pour licenciement abusif',
    domaine: 'droit_travail',
    valeurOuFormule: "1,5 mois de salaire par année ou fraction d'année ≥ 6 mois d'ancienneté, plafonné à 36 mois de salaire",
    populationConcernee: 'Salarié licencié sans motif valable ou sans procédure régulière',
    dateDebutEffet: '2004-06-08',
    sourceExacte: 'Code du Travail marocain (Loi n° 65-99), Article 41',
    dateConsultation: '2026-10-05',
    statutVerification: 'verifiee_officielle',
    validationFormateur: true,
    descriptionDetaillee: "Le juge apprécie le caractère abusif du licenciement ; ce simulateur propose une estimation pédagogique, pas une décision judiciaire."
  },
  {
    id: 'art-43-preavis',
    intitule: 'Indemnité compensatrice de préavis',
    domaine: 'droit_travail',
    valeurOuFormule: 'Non-cadre : 8j (<1an) / 1 mois (1-5 ans) / 2 mois (>5 ans) — Cadre : 1 mois / 2 mois / 3 mois',
    populationConcernee: 'Salarié licencié sans faute grave retenue',
    dateDebutEffet: '2004-06-08',
    sourceExacte: 'Code du Travail marocain (Loi n° 65-99), Articles 43 et 51',
    dateConsultation: '2026-10-05',
    statutVerification: 'verifiee_officielle',
    validationFormateur: true,
    descriptionDetaillee: "Barème simplifié à des fins pédagogiques, dépendant de la catégorie professionnelle et de l'ancienneté du salarié."
  },
  {
    id: 'art-53-indemnite-licenciement',
    intitule: 'Indemnité légale de licenciement',
    domaine: 'droit_travail',
    valeurOuFormule: '96h × chacune des 5 premières années + 144h × (6e-10e année) + 192h × (11e-15e année) + 240h au-delà',
    populationConcernee: "Salarié licencié avec au moins 6 mois d'ancienneté, hors faute grave",
    dateDebutEffet: '2004-06-08',
    sourceExacte: 'Code du Travail marocain (Loi n° 65-99), Article 53',
    dateConsultation: '2026-10-05',
    statutVerification: 'verifiee_officielle',
    validationFormateur: true,
    descriptionDetaillee: "Le nombre d'heures de salaire dû par tranche d'ancienneté est multiplié par le taux horaire moyen du salarié."
  },
  {
    id: 'art-62-delai-procedure',
    intitule: 'Délais de la procédure de licenciement pour faute grave',
    domaine: 'droit_travail',
    valeurOuFormule: 'Entretien préalable sous 8 jours à compter de la constatation · Notification de la décision sous 48 heures après la décision',
    populationConcernee: 'Salarié visé par une procédure de licenciement pour faute grave',
    dateDebutEffet: '2004-06-08',
    sourceExacte: 'Code du Travail marocain (Loi n° 65-99), Article 62',
    dateConsultation: '2026-10-05',
    statutVerification: 'verifiee_officielle',
    validationFormateur: true,
    descriptionDetaillee: "Le non-respect de ces délais expose l'employeur à une requalification du licenciement en licenciement abusif."
  }
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Vérification manuelle rapide**

Run: `node -e "console.log(require('ts-node'))" 2>/dev/null; npx tsx -e "import {REGLES_JURIDIQUES_MAROC} from './src/services/rulesData.ts'; console.log(REGLES_JURIDIQUES_MAROC.length, REGLES_JURIDIQUES_MAROC.filter(r => r.id.startsWith('art-37') || r.id.startsWith('art-39') || r.id.startsWith('art-41') || r.id.startsWith('art-43') || r.id.startsWith('art-53') || r.id.startsWith('art-62')).length)"`

Expected: le deuxième nombre affiché est `6`.

- [ ] **Step 5: Commit**

```bash
git add src/services/rulesData.ts
git commit -m "feat(discipline): add legal rules referential (Art. 37, 39, 41, 43, 53, 62)"
```

---

## Task 3: Moteur de calcul — indemnités et alertes

**Files:**
- Create: `src/services/disciplineEngine.ts`

**Interfaces:**
- Consumes: `roundMoney`, `calculerAncienneteAnnees`, `getTauxAnciennete` (déjà exportées
  par `src/services/payrollEngine.ts`) ; `Salarie`, `DemandeConge`, `ProcedureDisciplinaire`,
  `CalculLicenciement`, `AlerteConformiteProcedure` (`src/types/index.ts`).
- Produces (consommé par Task 7 — `DisciplineView.tsx`) :
  - `calculerIndemniteLicenciement(ancienneteAnnees: number, salaireHoraireMoyen: number): { montant: number; detailTranches: string; article: string }`
  - `calculerIndemnitePreavis(ancienneteAnnees: number, categorieSalarie: 'cadre' | 'non_cadre', salaireBaseMensuel: number): { montant: number; detail: string; article: string }`
  - `calculerDommagesInteretsAbusif(ancienneteAnnees: number, salaireBaseMensuel: number): { montant: number; detail: string; article: string }`
  - `calculerInteretsRetard(montantDu: number, tauxAnnuel: number, joursRetard: number): number`
  - `estimerSoldeCongesRestants(demandes: DemandeConge[], salarieId: string): number`
  - `detecterAlertesConformite(procedure: Pick<ProcedureDisciplinaire, 'dateConstatation' | 'dateConvocation' | 'dateEntretien' | 'dateNotificationSanction'>): AlerteConformiteProcedure[]`
  - `calculerSoldeToutCompte(params: { salarie: Salarie; procedure: ProcedureDisciplinaire; demandes: DemandeConge[]; licenciementAbusifForce?: boolean }): CalculLicenciement`

- [ ] **Step 1: Créer `src/services/disciplineEngine.ts` avec les imports et les barèmes**

```ts
import Decimal from 'decimal.js';
import { calculerAncienneteAnnees, getTauxAnciennete, roundMoney } from './payrollEngine';
import { AlerteConformiteProcedure, CalculLicenciement, DemandeConge, ProcedureDisciplinaire, Salarie } from '../types';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const MS_PAR_JOUR = 1000 * 60 * 60 * 24;

function joursEntre(dateDebut: string, dateFin: string): number {
  return Math.round((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / MS_PAR_JOUR);
}

function heuresEntre(dateDebut: string, dateFin: string): number {
  return (new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / (1000 * 60 * 60);
}
```

- [ ] **Step 2: Ajouter `calculerIndemniteLicenciement` (Art. 53)**

```ts
/**
 * Indemnité légale de licenciement — Article 53 du Code du Travail.
 * Barème en heures de salaire par tranche d'ancienneté, appliqué au taux horaire moyen.
 */
export function calculerIndemniteLicenciement(
  ancienneteAnnees: number,
  salaireHoraireMoyen: number
): { montant: number; detailTranches: string; article: string } {
  const taux = new Decimal(salaireHoraireMoyen);
  let heuresTotales = new Decimal(0);
  const lignes: string[] = [];

  const anneesTranche1 = Math.min(ancienneteAnnees, 5);
  if (anneesTranche1 > 0) {
    heuresTotales = heuresTotales.plus(new Decimal(96).mul(anneesTranche1));
    lignes.push(`${anneesTranche1} an(s) × 96h`);
  }

  const anneesTranche2 = Math.min(Math.max(ancienneteAnnees - 5, 0), 5);
  if (anneesTranche2 > 0) {
    heuresTotales = heuresTotales.plus(new Decimal(144).mul(anneesTranche2));
    lignes.push(`${anneesTranche2} an(s) × 144h`);
  }

  const anneesTranche3 = Math.min(Math.max(ancienneteAnnees - 10, 0), 5);
  if (anneesTranche3 > 0) {
    heuresTotales = heuresTotales.plus(new Decimal(192).mul(anneesTranche3));
    lignes.push(`${anneesTranche3} an(s) × 192h`);
  }

  const anneesTranche4 = Math.max(ancienneteAnnees - 15, 0);
  if (anneesTranche4 > 0) {
    heuresTotales = heuresTotales.plus(new Decimal(240).mul(anneesTranche4));
    lignes.push(`${anneesTranche4} an(s) × 240h`);
  }

  const montant = roundMoney(heuresTotales.mul(taux));
  return {
    montant,
    detailTranches: lignes.length > 0 ? lignes.join(' + ') : "Aucune tranche atteinte (< 6 mois d'ancienneté)",
    article: 'Art. 53'
  };
}
```

- [ ] **Step 3: Ajouter `calculerIndemnitePreavis` (Art. 43, 51)**

```ts
/**
 * Indemnité compensatrice de préavis — Articles 43 et 51 du Code du Travail.
 * Barème simplifié à visée pédagogique.
 */
export function calculerIndemnitePreavis(
  ancienneteAnnees: number,
  categorieSalarie: 'cadre' | 'non_cadre',
  salaireBaseMensuel: number
): { montant: number; detail: string; article: string } {
  const salaire = new Decimal(salaireBaseMensuel);
  let moisOuJours: { facteur: Decimal; libelle: string };

  if (ancienneteAnnees < 1) {
    moisOuJours = categorieSalarie === 'cadre'
      ? { facteur: new Decimal(1), libelle: '1 mois (cadre, < 1 an)' }
      : { facteur: new Decimal(8).div(30), libelle: '8 jours (non-cadre, < 1 an)' };
  } else if (ancienneteAnnees <= 5) {
    moisOuJours = categorieSalarie === 'cadre'
      ? { facteur: new Decimal(2), libelle: '2 mois (cadre, 1 à 5 ans)' }
      : { facteur: new Decimal(1), libelle: '1 mois (non-cadre, 1 à 5 ans)' };
  } else {
    moisOuJours = categorieSalarie === 'cadre'
      ? { facteur: new Decimal(3), libelle: '3 mois (cadre, > 5 ans)' }
      : { facteur: new Decimal(2), libelle: '2 mois (non-cadre, > 5 ans)' };
  }

  const montant = roundMoney(salaire.mul(moisOuJours.facteur));
  return { montant, detail: moisOuJours.libelle, article: 'Art. 43, 51' };
}
```

- [ ] **Step 4: Ajouter `calculerDommagesInteretsAbusif` (Art. 41) et `calculerInteretsRetard`**

```ts
/**
 * Dommages-intérêts pour licenciement abusif — Article 41 du Code du Travail.
 * 1,5 mois de salaire par année (fraction ≥ 6 mois comptée entière), plafonné à 36 mois.
 */
export function calculerDommagesInteretsAbusif(
  ancienneteAnnees: number,
  salaireBaseMensuel: number
): { montant: number; detail: string; article: string } {
  const anneesArrondies = Math.round(ancienneteAnnees); // fraction ≥ 0.5 an arrondie à l'année supérieure
  const moisPlafonnes = Math.min(anneesArrondies * 1.5, 36);
  const montant = roundMoney(new Decimal(salaireBaseMensuel).mul(moisPlafonnes));
  return {
    montant,
    detail: `${anneesArrondies} an(s) × 1,5 mois (plafonné à 36 mois) = ${moisPlafonnes} mois de salaire`,
    article: 'Art. 41'
  };
}

/** Intérêts de retard sur une créance impayée. Taux indicatif, non adossé à un article précis. */
export function calculerInteretsRetard(montantDu: number, tauxAnnuel: number, joursRetard: number): number {
  if (joursRetard <= 0 || montantDu <= 0) return 0;
  return roundMoney(new Decimal(montantDu).mul(tauxAnnuel).div(100).mul(joursRetard).div(365));
}
```

- [ ] **Step 5: Ajouter `estimerSoldeCongesRestants`**

```ts
/**
 * Dernier solde de congé annuel connu pour ce salarié (soldeApres de la demande la plus
 * récente de type 'annuel'), ou 18 jours par défaut (allocation annuelle standard déjà
 * utilisée comme valeur par défaut dans LeavesView.tsx).
 */
export function estimerSoldeCongesRestants(demandes: DemandeConge[], salarieId: string): number {
  const demandesAnnuelles = demandes
    .filter((d) => d.salarieId === salarieId && d.type === 'annuel' && d.statut === 'Approuvee')
    .sort((a, b) => (a.dateDecision || a.dateDemande).localeCompare(b.dateDecision || b.dateDemande));

  const derniere = demandesAnnuelles[demandesAnnuelles.length - 1];
  return derniere ? derniere.soldeApres : 18;
}
```

- [ ] **Step 6: Ajouter `detecterAlertesConformite` (Art. 62)**

```ts
/**
 * Alertes de conformité des délais légaux — Article 62 du Code du Travail.
 * N'évalue que les transitions dont les deux dates sont déjà renseignées.
 */
export function detecterAlertesConformite(
  procedure: Pick<ProcedureDisciplinaire, 'dateConstatation' | 'dateConvocation' | 'dateEntretien' | 'dateNotificationSanction'>
): AlerteConformiteProcedure[] {
  const alertes: AlerteConformiteProcedure[] = [];

  if (procedure.dateConstatation && procedure.dateConvocation) {
    const jours = joursEntre(procedure.dateConstatation, procedure.dateConvocation);
    if (jours > 8) {
      alertes.push({
        code: 'delai-convocation',
        message: `${jours} jours entre la constatation et la convocation — dépasse les 8 jours de l'Art. 62.`,
        articleLoi: 'Art. 62',
        severite: 'risque'
      });
    }
  }

  if (procedure.dateEntretien && procedure.dateNotificationSanction) {
    const heures = heuresEntre(procedure.dateEntretien, procedure.dateNotificationSanction);
    if (heures > 48) {
      alertes.push({
        code: 'delai-notification',
        message: `${Math.round(heures)} heures entre l'entretien et la notification — dépasse les 48 heures de l'Art. 62.`,
        articleLoi: 'Art. 62',
        severite: 'risque'
      });
    }
  }

  return alertes;
}
```

- [ ] **Step 7: Ajouter `calculerSoldeToutCompte` (orchestrateur final)**

```ts
/**
 * Calcule le solde de tout compte complet d'un licenciement.
 * Règle de non-cumul (Art. 39) : si faute grave ET aucune alerte de sévérité 'risque',
 * aucune indemnité de licenciement ni de préavis n'est due.
 */
export function calculerSoldeToutCompte(params: {
  salarie: Salarie;
  procedure: ProcedureDisciplinaire;
  demandes: DemandeConge[];
  licenciementAbusifForce?: boolean;
}): CalculLicenciement {
  const { salarie, procedure, demandes } = params;
  const periodeMois = procedure.dateConstatation.slice(0, 7);
  const ancienneteAnnees = calculerAncienneteAnnees(salarie.dateEmbauche, periodeMois);
  const salaireHoraireMoyen = roundMoney(new Decimal(salarie.salaireBaseMensuel).div(salarie.horaireMensuel || 191));

  const alertesConformite = detecterAlertesConformite(procedure);
  const procedureConforme = alertesConformite.every((a) => a.severite !== 'risque');
  const fauteGraveConforme = procedure.typeFaute === 'grave' && procedureConforme;

  const indemniteLicenciement = fauteGraveConforme
    ? 0
    : calculerIndemniteLicenciement(ancienneteAnnees, salaireHoraireMoyen).montant;

  const indemnitePreavis = fauteGraveConforme
    ? 0
    : calculerIndemnitePreavis(ancienneteAnnees, procedure.categorieSalarie, salarie.salaireBaseMensuel).montant;

  const licenciementAbusif = params.licenciementAbusifForce ?? !procedureConforme;
  const dommagesInteretsAbusif = licenciementAbusif
    ? calculerDommagesInteretsAbusif(ancienneteAnnees, salarie.salaireBaseMensuel).montant
    : 0;

  const indemniteCongesRestants = roundMoney(
    new Decimal(estimerSoldeCongesRestants(demandes, salarie.id)).mul(
      new Decimal(salarie.salaireBaseMensuel).div(26)
    )
  );

  const { taux: tauxAnciennete } = getTauxAnciennete(ancienneteAnnees);
  const primeAncienneteSolde = roundMoney(new Decimal(salarie.salaireBaseMensuel).mul(tauxAnciennete));

  const jourDuMois = new Date(procedure.dateConstatation).getDate();
  const salaireProrataMoisSortie = roundMoney(
    new Decimal(salarie.salaireBaseMensuel).div(30).mul(jourDuMois)
  );

  const sousTotal =
    indemniteLicenciement +
    indemnitePreavis +
    indemniteCongesRestants +
    primeAncienneteSolde +
    salaireProrataMoisSortie +
    dommagesInteretsAbusif;

  const joursRetardPaiement = procedure.calculLicenciement?.joursRetardPaiement ?? 0;
  const tauxInteretAnnuel = procedure.calculLicenciement?.tauxInteretAnnuel ?? 5;
  const interetsRetard = calculerInteretsRetard(sousTotal, tauxInteretAnnuel, joursRetardPaiement);

  return {
    indemniteLicenciement,
    indemnitePreavis,
    indemniteCongesRestants,
    primeAncienneteSolde,
    salaireProrataMoisSortie,
    licenciementAbusif,
    dommagesInteretsAbusif,
    joursRetardPaiement,
    tauxInteretAnnuel,
    interetsRetard,
    totalSoldeToutCompte: roundMoney(new Decimal(sousTotal).plus(interetsRetard)),
    alertesConformite
  };
}
```

- [ ] **Step 8: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 9: Script de vérification manuelle — scénario 1 (faute grave conforme)**

Créer un fichier jetable `scratch-verify-discipline.ts` à la racine (non commité) :

```ts
import { calculerIndemniteLicenciement, calculerIndemnitePreavis, calculerDommagesInteretsAbusif, detecterAlertesConformite } from './src/services/disciplineEngine';

// Scénario 1 : faute grave, procédure conforme (convocation 3j après constatation, notification 24h après entretien)
const alertes1 = detecterAlertesConformite({
  dateConstatation: '2026-01-05',
  dateConvocation: '2026-01-08',
  dateEntretien: '2026-01-10',
  dateNotificationSanction: '2026-01-11'
});
console.log('Scénario 1 — alertes (attendu: []):', alertes1);

// Scénario 2 : ancienneté 7 ans, convocation à 11 jours (hors délai)
const indemn = calculerIndemniteLicenciement(7, 50);
console.log('Scénario 2 — indemnité 7 ans @ 50 MAD/h (attendu: 5×96×50 + 2×144×50 = 24000+14400 = 38400):', indemn);

const preavis = calculerIndemnitePreavis(7, 'non_cadre', 6000);
console.log('Scénario 2 — préavis non-cadre 7 ans sur 6000 MAD (attendu: 2 mois = 12000):', preavis);

const dommages = calculerDommagesInteretsAbusif(7, 6000);
console.log('Scénario 2 — dommages abusif 7 ans sur 6000 MAD (attendu: 7×1.5=10.5 mois = 63000):', dommages);

const alertes2 = detecterAlertesConformite({
  dateConstatation: '2026-01-05',
  dateConvocation: '2026-01-16', // 11 jours
  dateEntretien: '2026-01-18',
  dateNotificationSanction: '2026-01-19'
});
console.log('Scénario 2 — alertes (attendu: 1 alerte delai-convocation):', alertes2);
```

Run: `npx tsx scratch-verify-discipline.ts`
Expected (vérifier à l'œil par rapport aux commentaires `attendu` ci-dessus) :
- Scénario 1 : tableau vide `[]`.
- Indemnité 7 ans : montant `38400`.
- Préavis non-cadre 7 ans : montant `12000`.
- Dommages abusif 7 ans : montant `63000`.
- Scénario 2 : un tableau avec une entrée `code: 'delai-convocation'`.

Si un résultat diverge, corriger la fonction concernée avant de continuer.

- [ ] **Step 10: Supprimer le script jetable**

```bash
rm scratch-verify-discipline.ts
```

- [ ] **Step 11: Commit**

```bash
git add src/services/disciplineEngine.ts
git commit -m "feat(discipline): add deterministic calculation engine (Art. 41, 43, 53, 62)"
```

---

## Task 4: Persistance — local (db.ts) et état applicatif (useAppData.ts)

**Files:**
- Modify: `src/services/db.ts:9-24` (interface `AppDatabaseState`)
- Modify: `src/hooks/useAppData.ts`

**Interfaces:**
- Consumes: `ProcedureDisciplinaire` (Task 1)
- Produces (consommé par Task 6 — `App.tsx`) : `procedures: ProcedureDisciplinaire[]`,
  `upsertProcedure: (p: ProcedureDisciplinaire) => void`,
  `deleteProcedure: (id: string) => void` exposés par `useAppData()`.

- [ ] **Step 1: Ajouter `procedures: any[]` à `AppDatabaseState`**

Dans `src/services/db.ts`, modifier l'interface :

```ts
export interface AppDatabaseState {
  version: number;
  derniereSauvegarde: string;
  entreprise: any;
  salaries: any[];
  contrats: any[];
  evenementsPresence: any[];
  demandesConges: any[];
  bulletins: any[];
  regles: any[];
  missions: any[];
  tentatives: any[];
  classes: any[];
  procedures: any[];
  parametresApp: {
    periodeActive: string;
    modePedagogique: 'demonstration' | 'entrainement' | 'evaluation';
    niveau: 'essentiel' | 'avance';
    nomStagiaireActif: string;
  };
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur (le champ est optionnel dans la pratique car `any[]`, mais sera
toujours fourni par `useAppData.ts` après l'étape suivante).

- [ ] **Step 3: Ajouter l'import du type dans `useAppData.ts`**

Dans `src/hooks/useAppData.ts`, modifier le bloc d'import `from '../types'` pour ajouter
`ProcedureDisciplinaire` :

```ts
import {
  BulletinPaie,
  ClassePedagogique,
  Contrat,
  DemandeConge,
  Entreprise,
  EvenementPresence,
  MissionExercice,
  ModePedagogique,
  NiveauPedagogique,
  ProcedureDisciplinaire,
  RegleParametreJuridique,
  Salarie,
  TentativeExercice
} from '../types';
```

- [ ] **Step 4: Ajouter l'état `procedures`**

Juste après la déclaration de `const [classes, setClasses] = useState<ClassePedagogique[]>([...])`
(fin de son tableau initial), ajouter :

```ts
  const [procedures, setProcedures] = useState<ProcedureDisciplinaire[]>([]);
```

- [ ] **Step 5: Charger `procedures` au démarrage**

Dans le bloc `if (stored) { ... }` de la fonction `init()`, juste après
`if (stored.classes) setClasses(stored.classes);`, ajouter :

```ts
          if (stored.procedures) setProcedures(stored.procedures);
```

- [ ] **Step 6: Inclure `procedures` dans le snapshot de sauvegarde automatique**

Dans le `useEffect` de sauvegarde automatique, ajouter `procedures,` à l'objet `snapshot`
(juste après `classes,`) et ajouter `procedures` à la liste de dépendances du
`useEffect` (juste après `classes,` dans le tableau de dépendances en fin de hook).

- [ ] **Step 7: Ajouter `upsertProcedure` et `deleteProcedure`**

Juste après la fonction `deleteContrat` existante, ajouter :

```ts
  /**
   * Ajouter, modifier ou clôturer une procédure disciplinaire
   */
  const upsertProcedure = (procedure: ProcedureDisciplinaire) => {
    const avecHorodatage = { ...procedure, misAJourLe: new Date().toISOString() };
    setProcedures((prev) => {
      const exists = prev.some((p) => p.id === procedure.id);
      if (exists) {
        return prev.map((p) => (p.id === procedure.id ? avecHorodatage : p));
      }
      return [...prev, avecHorodatage];
    });
    showNotification(
      procedure.statut === 'cloturee' ? 'Procédure disciplinaire clôturée.' : 'Procédure disciplinaire enregistrée.',
      'success'
    );
  };

  /**
   * Supprimer une procédure disciplinaire (ex: ouverte par erreur)
   */
  const deleteProcedure = (procedureId: string) => {
    setProcedures((prev) => prev.filter((p) => p.id !== procedureId));
    showNotification('Procédure disciplinaire supprimée.', 'info');
  };
```

- [ ] **Step 8: Réinitialiser `procedures` dans `reinitialiserDonneesDemo`**

Dans la fonction `reinitialiserDonneesDemo`, après `setTentatives([]);`, ajouter :

```ts
    setProcedures([]);
```

- [ ] **Step 9: Exposer `procedures`, `upsertProcedure`, `deleteProcedure` dans le `return`**

Dans l'objet retourné par `useAppData()`, ajouter après `deleteContrat,` :

```ts
    procedures,
    upsertProcedure,
    deleteProcedure,
```

- [ ] **Step 10: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 11: Commit**

```bash
git add src/services/db.ts src/hooks/useAppData.ts
git commit -m "feat(discipline): wire procedures into local state and persistence"
```

---

## Task 5: Persistance — synchro cloud (cloudSync.ts) et migration SQL

**Files:**
- Modify: `src/services/cloudSync.ts`
- Create: `supabase/migrations/20261005000000_procedures_disciplinaires.sql`

**Interfaces:**
- Consumes: `AppDatabaseState.procedures` (Task 4)
- Produces: table Supabase `procedures`, synchronisée comme `contrats`.

- [ ] **Step 1: Ajouter la collection dans `COLLECTIONS`**

Dans `src/services/cloudSync.ts`, ajouter une entrée à la fin du tableau `COLLECTIONS`
(juste après l'entrée `classes`) :

```ts
  { table: 'procedures', rows: (s) => s.procedures, extra: (i) => ({ salarie_id: i.salarieId }) }
```

- [ ] **Step 2: Ajouter `procedures` au retour de `loadCloudState`**

Dans l'objet retourné par `loadCloudState()`, ajouter après `classes: byTable.classes,` :

```ts
    procedures: byTable.procedures,
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Créer la migration SQL**

Créer `supabase/migrations/20261005000000_procedures_disciplinaires.sql` :

```sql
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
```

- [ ] **Step 5: Commit**

```bash
git add src/services/cloudSync.ts supabase/migrations/20261005000000_procedures_disciplinaires.sql
git commit -m "feat(discipline): sync procedures to Supabase (new table + RLS)"
```

**Note pour l'exécutant :** cette migration doit être appliquée sur le projet Supabase
réel avant que la synchro cloud des procédures fonctionne en production (via le tableau de
bord Supabase, SQL editor, en collant le contenu du fichier — ou `supabase db push` si la
CLI Supabase est configurée en local). Sans cela, `pushDiff`/`loadCloudState` échoueront
silencieusement sur la table `procedures` inexistante et `cloudOk` passera à `false`.

---

## Task 6: Intégration sidebar et routage

**Files:**
- Modify: `src/components/common/NavigationTabs.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `procedures`, `upsertProcedure`, `deleteProcedure` (Task 4) ;
  `DisciplineView` (Task 7, pas encore créé à ce stade — ce composant sera créé dans la
  tâche suivante, mais son **import différé et ses props** sont fixés ici pour que les deux
  tâches s'articulent sans retouche).
- Produces: onglet `discipline` navigable, props exactes attendues par `DisciplineView`:
  `{ salaries: Salarie[]; demandesConges: DemandeConge[]; procedures: ProcedureDisciplinaire[]; onSaveProcedure: (p: ProcedureDisciplinaire) => void; onDeleteProcedure: (id: string) => void; entreprise: Entreprise; showNotification: (msg, type) => void }`

- [ ] **Step 1: Ajouter `'discipline'` au type `OngletNavigation`**

Dans `src/components/common/NavigationTabs.tsx`, modifier le type union :

```ts
export type OngletNavigation =
  | 'dashboard'
  | 'entreprise'
  | 'salaries'
  | 'contrats'
  | 'presences'
  | 'conges'
  | 'discipline'
  | 'preparation_paie'
  | 'bulletins'
  | 'livre_paie'
  | 'cnss'
  | 'documents'
  | 'missions'
  | 'formateur'
  | 'parametres';
```

- [ ] **Step 2: Ajouter l'icône `Gavel` à l'import lucide-react**

Dans le même fichier, ajouter `Gavel` à la liste d'imports `from 'lucide-react'` (juste
après `CalendarDays`).

- [ ] **Step 3: Ajouter l'entrée dans `items`, gardée par `afficherEspaceFormateur`**

Dans le tableau `items`, insérer entre `conges` et `preparation_paie` :

```ts
    ...(afficherEspaceFormateur
      ? [{ id: 'discipline' as const, label: 'Discipline & Licenciement', icon: Gavel }]
      : []),
```

- [ ] **Step 4: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Ajouter le lazy import dans `App.tsx`**

Dans `src/App.tsx`, ajouter après la ligne du lazy import de `LeavesView` :

```ts
const DisciplineView = lazy(() => import('./components/discipline/DisciplineView').then((m) => ({ default: m.DisciplineView })));
```

- [ ] **Step 6: Déstructurer `procedures`, `upsertProcedure`, `deleteProcedure`**

Dans la déstructuration de `useAppData()` en haut de `App()`, ajouter après
`deleteContrat,` :

```ts
    procedures,
    upsertProcedure,
    deleteProcedure,
```

- [ ] **Step 7: Ajouter le bloc de rendu conditionnel**

Dans le `<Suspense>`, juste après le bloc `{ongletActif === 'conges' && (...)}`, ajouter :

```tsx
        {ongletActif === 'discipline' && estFormateur && (
          <DisciplineView
            salaries={salaries}
            demandesConges={demandesConges}
            procedures={procedures}
            onSaveProcedure={upsertProcedure}
            onDeleteProcedure={deleteProcedure}
            entreprise={entreprise}
            showNotification={showNotification}
          />
        )}
```

- [ ] **Step 8: Inclure `procedures` dans `fullAppState` et `handleRestoreState`**

Dans l'objet `fullAppState`, ajouter `procedures,` après `classes,`.

Dans `handleRestoreState`, ajouter après `if (state.classes) setClasses(state.classes);` :

```ts
    if (state.procedures) setProcedures(state.procedures);
```

(Note : `setProcedures` n'est pas exposé par `useAppData()` — seul `upsertProcedure`/
`deleteProcedure` le sont, par cohérence avec `contrats`/`demandesConges` qui utilisent
`.splice()` directement sur le tableau plutôt qu'un setter. Suivre le même pattern que
`contrats` ici : `procedures.splice(0, procedures.length, ...state.procedures);` — ce qui
nécessite que `procedures` soit un tableau mutable renvoyé tel quel par le hook, ce qui est
déjà le cas puisque c'est le state React brut.)

Donc remplacer la ligne ci-dessus par :

```ts
    if (state.procedures) procedures.splice(0, procedures.length, ...state.procedures);
```

- [ ] **Step 9: Garder `estFormateur` cohérent au reset d'onglet**

Dans `setOngletActif`, la logique existante ne bloque que `'formateur'` pour un non-
formateur. Modifier la condition pour couvrir aussi `'discipline'` :

```ts
  const setOngletActif = (onglet: OngletNavigation) => {
    // Un stagiaire ne doit jamais atterrir sur les espaces réservés au formateur
    const ongletsFormateur: OngletNavigation[] = ['formateur', 'discipline'];
    setOngletActifBrut(ongletsFormateur.includes(onglet) && !estFormateur ? 'dashboard' : onglet);
  };
```

- [ ] **Step 10: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: **échoue** à ce stade avec une erreur `Cannot find module
'./components/discipline/DisciplineView'` — attendu, car Task 7 crée ce fichier. Ne pas
commit avant Task 7.

---

## Task 7: Vue — étapes 1 à 4 (qualification, convocation, entretien/PV, décision)

**Files:**
- Create: `src/components/discipline/DisciplineView.tsx`

**Interfaces:**
- Consumes: props définies en Task 6 ; `calculerSoldeToutCompte`, `detecterAlertesConformite`
  (Task 3) ; `formatDateJJMMAAAA` (`src/services/exportService.ts`).
- Produces: export nommé `DisciplineView: React.FC<DisciplineViewProps>`, consommé par
  Task 6 (déjà câblé). Documents imprimables consommés visuellement uniquement (pas
  d'interface de code).

- [ ] **Step 1: Créer le fichier avec les imports, props et état local**

```tsx
import React, { useState } from 'react';
import { Gavel, Printer, Plus, AlertTriangle, CheckCircle2, Clock, FileText, History } from 'lucide-react';
import { DemandeConge, Entreprise, ProcedureDisciplinaire, Salarie, SanctionDisciplinaire, TypeFauteDisciplinaire } from '../../types';
import { calculerSoldeToutCompte, detecterAlertesConformite } from '../../services/disciplineEngine';
import { formatDateJJMMAAAA, formatMAD } from '../../services/exportService';

interface DisciplineViewProps {
  salaries: Salarie[];
  demandesConges: DemandeConge[];
  procedures: ProcedureDisciplinaire[];
  onSaveProcedure: (p: ProcedureDisciplinaire) => void;
  onDeleteProcedure: (id: string) => void;
  entreprise: Entreprise;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

type DocumentImprimable = 'convocation' | 'pv' | 'notification' | 'solde' | null;

export const DisciplineView: React.FC<DisciplineViewProps> = ({
  salaries,
  demandesConges,
  procedures,
  onSaveProcedure,
  onDeleteProcedure,
  entreprise,
  showNotification
}) => {
  const [salarieActifId, setSalarieActifId] = useState<string>(salaries[0]?.id || '');
  const salarieActif = salaries.find((s) => s.id === salarieActifId);

  const procedureOuverte = procedures.find((p) => p.salarieId === salarieActifId && p.statut === 'ouverte');
  const [procedureEnCours, setProcedureEnCours] = useState<ProcedureDisciplinaire | null>(procedureOuverte || null);
  const [documentAImprimer, setDocumentAImprimer] = useState<DocumentImprimable>(null);

  const procedure = procedureEnCours;

  const handleNouvelleProcedure = () => {
    if (!salarieActif) return;
    const nouvelle: ProcedureDisciplinaire = {
      id: `disc-${Date.now()}`,
      salarieId: salarieActif.id,
      typeFaute: 'legere',
      motifFaute: '',
      dateConstatation: new Date().toISOString().slice(0, 10),
      categorieSalarie: 'non_cadre',
      assistanceDemandee: false,
      statut: 'ouverte',
      creeLe: new Date().toISOString(),
      misAJourLe: new Date().toISOString()
    };
    setProcedureEnCours(nouvelle);
    onSaveProcedure(nouvelle);
  };

  const majProcedure = (champs: Partial<ProcedureDisciplinaire>) => {
    if (!procedure) return;
    const maj = { ...procedure, ...champs };
    setProcedureEnCours(maj);
    onSaveProcedure(maj);
  };

  const handleImprimer = (doc: DocumentImprimable) => {
    setDocumentAImprimer(doc);
    setTimeout(() => window.print(), 100);
  };

  const historiqueClos = procedures.filter((p) => p.salarieId === salarieActifId && p.statut === 'cloturee');

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
              <Gavel className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1C2459]">Discipline &amp; Licenciement</h1>
              <p className="text-xs text-slate-500">
                Procédure disciplinaire marocaine complète : convocation, entretien, sanction, solde de tout compte
              </p>
            </div>
          </div>

          <select
            value={salarieActifId}
            onChange={(e) => {
              setSalarieActifId(e.target.value);
              setProcedureEnCours(procedures.find((p) => p.salarieId === e.target.value && p.statut === 'ouverte') || null);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-[#1C2459] bg-slate-50 text-xs"
          >
            {salaries.map((s) => (
              <option key={s.id} value={s.id}>
                {s.matricule} — {s.nom} {s.prenom}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5 text-[11px] text-amber-900">
          Simulation pédagogique — ne remplace ni un conseil juridique ni une procédure réelle devant les prud'hommes.
        </div>
      </div>

      {/* Garde-fou : une seule procédure ouverte à la fois */}
      {!procedure && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print text-center space-y-3">
          <p className="text-sm text-slate-600">
            Aucune procédure disciplinaire ouverte pour {salarieActif?.nom} {salarieActif?.prenom}.
          </p>
          <button
            onClick={handleNouvelleProcedure}
            disabled={!salarieActif}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Nouvelle procédure
          </button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur (le fichier compile même incomplet, tant que les types sont
corrects — le composant est fonctionnel mais n'a encore que l'état "aucune procédure").

- [ ] **Step 3: Vérification visuelle — état initial**

Démarrer le serveur de dev (`npm run dev`), contourner temporairement `AuthGate` dans
`src/main.tsx` comme déjà fait dans les sessions précédentes de ce projet
(`createRoot(...).render(<App />)` au lieu de `<AuthGate>...</AuthGate>`, à annuler après
vérification), ouvrir l'onglet « Discipline & Licenciement » dans la sidebar.

Expected : la carte d'en-tête s'affiche avec le sélecteur de salarié, le bandeau
d'avertissement ambre, et le bouton « Nouvelle procédure » puisqu'aucune procédure n'est
ouverte pour le salarié par défaut.

- [ ] **Step 4: Commit**

```bash
git add src/components/discipline/DisciplineView.tsx
git commit -m "feat(discipline): scaffold DisciplineView header and new-procedure guard"
```

Ce commit rend aussi **Task 6 compilable** (le module importé existe désormais) : relancer
`npx tsc --noEmit` doit maintenant passer sans erreur sur l'ensemble du projet, confirmant
le câblage de Task 6.

- [ ] **Step 5: Ajouter l'étape 1 — Qualification**

Juste après le bloc "Garde-fou" (avant la fermeture du `return`), ajouter, à l'intérieur
d'un `{procedure && ( ... )}` qui englobera désormais tout le reste du composant :

```tsx
      {procedure && (
        <>
          {/* Étape 1 — Qualification */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C2459] text-white text-xs flex items-center justify-center">1</span>
                Qualification de la faute
              </h2>
              <button
                onClick={() => {
                  onDeleteProcedure(procedure.id);
                  setProcedureEnCours(null);
                }}
                className="text-[11px] text-red-600 hover:underline"
              >
                Supprimer cette procédure (ouverte par erreur)
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <label className="block">
                <span className="text-slate-600 font-medium">Type de faute</span>
                <select
                  value={procedure.typeFaute}
                  onChange={(e) => majProcedure({ typeFaute: e.target.value as TypeFauteDisciplinaire })}
                  className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                >
                  <option value="legere">Faute légère (Art. 37)</option>
                  <option value="grave">Faute grave (Art. 39)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-slate-600 font-medium">Catégorie du salarié</span>
                <select
                  value={procedure.categorieSalarie}
                  onChange={(e) => majProcedure({ categorieSalarie: e.target.value as 'cadre' | 'non_cadre' })}
                  className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                >
                  <option value="non_cadre">Non-cadre</option>
                  <option value="cadre">Cadre</option>
                </select>
              </label>
              <label className="block">
                <span className="text-slate-600 font-medium">Date de constatation</span>
                <input
                  type="date"
                  value={procedure.dateConstatation}
                  onChange={(e) => majProcedure({ dateConstatation: e.target.value })}
                  className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-slate-600 font-medium">Motif de la faute</span>
                <textarea
                  value={procedure.motifFaute}
                  onChange={(e) => majProcedure({ motifFaute: e.target.value })}
                  rows={2}
                  className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                  placeholder="Décrivez les faits reprochés au salarié..."
                />
              </label>
            </div>
          </div>
        </>
      )}
```

- [ ] **Step 6: Vérifier la compilation puis la vue**

Run: `npx tsc --noEmit` — expected: aucune erreur.

Vérification visuelle : cliquer « Nouvelle procédure », vérifier que l'étape 1 s'affiche
et que changer le type de faute / la date / le motif persiste (revenir sur l'onglet et
constater que les valeurs restent, preuve que `onSaveProcedure` fonctionne).

- [ ] **Step 7: Ajouter l'étape 2 — Convocation (avec document imprimable)**

Juste après le bloc de l'étape 1, à l'intérieur du même `<>...</>`, ajouter (visible dès
que `dateConstatation` et `motifFaute` sont renseignés) :

```tsx
          {procedure.motifFaute && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-3">
              <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C2459] text-white text-xs flex items-center justify-center">2</span>
                Convocation à l'entretien préalable
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-xs items-end">
                <label className="block">
                  <span className="text-slate-600 font-medium">Date de convocation</span>
                  <input
                    type="date"
                    value={procedure.dateConvocation || ''}
                    onChange={(e) => majProcedure({ dateConvocation: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={procedure.assistanceDemandee}
                    onChange={(e) => majProcedure({ assistanceDemandee: e.target.checked })}
                  />
                  <span className="text-slate-600">Assistance d'un représentant demandée</span>
                </label>
              </div>
              {procedure.dateConvocation && (
                <button
                  onClick={() => handleImprimer('convocation')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer la lettre de convocation
                </button>
              )}
            </div>
          )}
```

- [ ] **Step 8: Ajouter l'étape 3 — Entretien & PV**

Juste après le bloc de l'étape 2 :

```tsx
          {procedure.dateConvocation && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-3">
              <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C2459] text-white text-xs flex items-center justify-center">3</span>
                Entretien préalable &amp; procès-verbal
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <label className="block">
                  <span className="text-slate-600 font-medium">Date de l'entretien</span>
                  <input
                    type="date"
                    value={procedure.dateEntretien || ''}
                    onChange={(e) => majProcedure({ dateEntretien: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-600 font-medium">Signature du procès-verbal</span>
                  <select
                    value={procedure.signePar || ''}
                    onChange={(e) => majProcedure({ signePar: e.target.value as ProcedureDisciplinaire['signePar'] })}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                  >
                    <option value="">—</option>
                    <option value="les_deux">Signé par les deux parties</option>
                    <option value="salarie_absent">Salarié absent à l'entretien</option>
                    <option value="refus_signature">Refus de signature du salarié</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-slate-600 font-medium">Résumé de l'entretien</span>
                  <textarea
                    value={procedure.resumeEntretien || ''}
                    onChange={(e) => majProcedure({ resumeEntretien: e.target.value })}
                    rows={2}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </label>
              </div>
              {procedure.dateEntretien && (
                <button
                  onClick={() => handleImprimer('pv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer le procès-verbal
                </button>
              )}
            </div>
          )}
```

- [ ] **Step 9: Ajouter l'étape 4 — Décision / Sanction**

Juste après le bloc de l'étape 3 :

```tsx
          {procedure.dateEntretien && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-3">
              <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C2459] text-white text-xs flex items-center justify-center">4</span>
                Décision disciplinaire
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <label className="block">
                  <span className="text-slate-600 font-medium">Sanction</span>
                  <select
                    value={procedure.sanction || ''}
                    onChange={(e) => majProcedure({ sanction: e.target.value as SanctionDisciplinaire })}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                  >
                    <option value="">—</option>
                    {procedure.typeFaute === 'legere' ? (
                      <>
                        <option value="avertissement">Avertissement</option>
                        <option value="blame">Blâme</option>
                        <option value="mise_a_pied">Mise à pied (≤ 8 jours)</option>
                      </>
                    ) : (
                      <option value="licenciement">Licenciement (sans préavis ni indemnité si conforme)</option>
                    )}
                  </select>
                </label>
                {procedure.sanction === 'mise_a_pied' && (
                  <label className="block">
                    <span className="text-slate-600 font-medium">Jours de mise à pied (max 8, Art. 37)</span>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={procedure.joursMiseAPied || 1}
                      onChange={(e) => majProcedure({ joursMiseAPied: Math.min(8, Math.max(1, Number(e.target.value))) })}
                      className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                    />
                  </label>
                )}
                <label className="block">
                  <span className="text-slate-600 font-medium">Date de notification</span>
                  <input
                    type="date"
                    value={procedure.dateNotificationSanction || ''}
                    onChange={(e) => majProcedure({ dateNotificationSanction: e.target.value })}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </label>
              </div>

              {detecterAlertesConformite(procedure).map((alerte) => (
                <div
                  key={alerte.code}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg text-[11px] ${
                    alerte.severite === 'risque' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{alerte.message}</span>
                </div>
              ))}

              {procedure.dateNotificationSanction && (
                <button
                  onClick={() => handleImprimer('notification')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer la notification de sanction
                </button>
              )}
            </div>
          )}
```

- [ ] **Step 10: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 11: Vérification visuelle — déroulé complet des étapes 1 à 4**

Dans le navigateur : renseigner l'étape 1 (type de faute « grave », motif, date), vérifier
que l'étape 2 apparaît ; renseigner la convocation, vérifier que l'étape 3 apparaît ;
renseigner l'entretien, vérifier que l'étape 4 apparaît avec seulement l'option
« Licenciement » proposée (puisque `typeFaute === 'grave'`) ; renseigner une date de
notification à plus de 48h de l'entretien, vérifier qu'une alerte rouge
`delai-notification` s'affiche.

- [ ] **Step 12: Commit**

```bash
git add src/components/discipline/DisciplineView.tsx
git commit -m "feat(discipline): add steps 1-4 (qualification, convocation, PV, decision)"
```

---

## Task 8: Vue — étape 5 (solde de tout compte), documents imprimables, historique

**Files:**
- Modify: `src/components/discipline/DisciplineView.tsx`

**Interfaces:**
- Consumes: `calculerSoldeToutCompte` (Task 3), tout l'état de Task 7.
- Produces: composant `DisciplineView` complet (fin du module).

- [ ] **Step 1: Ajouter l'étape 5 — Solde de tout compte**

Juste après le bloc de l'étape 4, toujours dans le même `<>...</>` :

```tsx
          {procedure.sanction === 'licenciement' && procedure.dateNotificationSanction && salarieActif && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-4">
              <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1C2459] text-white text-xs flex items-center justify-center">5</span>
                Solde de tout compte
              </h2>

              {(() => {
                const calcul = calculerSoldeToutCompte({ salarie: salarieActif, procedure, demandesConges });
                const lignes: { libelle: string; formule: string; montant: number }[] = [
                  { libelle: 'Salaire prorata du mois de sortie', formule: 'salaire ÷ 30 × jour du mois', montant: calcul.salaireProrataMoisSortie },
                  { libelle: 'Prime d\'ancienneté (dernier mois)', formule: 'Art. 350', montant: calcul.primeAncienneteSolde },
                  { libelle: 'Indemnité congés restants', formule: 'jours restants × salaire/26', montant: calcul.indemniteCongesRestants },
                  { libelle: 'Indemnité de licenciement', formule: 'Art. 53 (0 si faute grave conforme)', montant: calcul.indemniteLicenciement },
                  { libelle: 'Indemnité compensatrice de préavis', formule: 'Art. 43, 51 (0 si faute grave conforme)', montant: calcul.indemnitePreavis },
                  { libelle: 'Dommages-intérêts (licenciement abusif)', formule: 'Art. 41', montant: calcul.dommagesInteretsAbusif },
                  { libelle: 'Intérêts de retard', formule: `${calcul.tauxInteretAnnuel}% × ${calcul.joursRetardPaiement}j / 365`, montant: calcul.interetsRetard }
                ];

                return (
                  <>
                    {calcul.alertesConformite.map((a) => (
                      <div key={a.code} className="flex items-start gap-2 px-3 py-2 rounded-lg text-[11px] bg-red-50 text-red-800 border border-red-200">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{a.message}</span>
                      </div>
                    ))}

                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={calcul.licenciementAbusif}
                        onChange={(e) =>
                          majProcedure({
                            calculLicenciement: calculerSoldeToutCompte({
                              salarie: salarieActif,
                              procedure,
                              demandesConges,
                              licenciementAbusifForce: e.target.checked
                            })
                          })
                        }
                      />
                      <span className="text-slate-700 font-medium">Licenciement jugé abusif (ajuste les dommages-intérêts Art. 41)</span>
                    </label>

                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <label className="block">
                        <span className="text-slate-600 font-medium">Jours de retard de paiement</span>
                        <input
                          type="number"
                          min={0}
                          value={calcul.joursRetardPaiement}
                          onChange={(e) =>
                            majProcedure({
                              calculLicenciement: calculerSoldeToutCompte({
                                salarie: salarieActif,
                                procedure: { ...procedure, calculLicenciement: { ...calcul, joursRetardPaiement: Number(e.target.value) } },
                                demandesConges
                              })
                            })
                          }
                          className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                        />
                      </label>
                      <label className="block">
                        <span className="text-slate-600 font-medium">Taux d'intérêt annuel (%)</span>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={calcul.tauxInteretAnnuel}
                          onChange={(e) =>
                            majProcedure({
                              calculLicenciement: calculerSoldeToutCompte({
                                salarie: salarieActif,
                                procedure: { ...procedure, calculLicenciement: { ...calcul, tauxInteretAnnuel: Number(e.target.value) } },
                                demandesConges
                              })
                            })
                          }
                          className="mt-1 w-full px-3 py-1.5 border border-slate-200 rounded"
                        />
                      </label>
                    </div>

                    <table className="w-full text-xs">
                      <tbody>
                        {lignes.map((l) => (
                          <tr key={l.libelle} className="border-b border-slate-100">
                            <td className="py-2">
                              <div className="font-medium text-slate-700">{l.libelle}</div>
                              <div className="text-[10px] text-slate-400">{l.formule}</div>
                            </td>
                            <td className="py-2 text-right font-semibold text-[#1C2459]">{formatMAD(l.montant)}</td>
                          </tr>
                        ))}
                        <tr>
                          <td className="py-2 font-bold text-[#1C2459]">Total solde de tout compte</td>
                          <td className="py-2 text-right font-bold text-[#149D92] text-sm">{formatMAD(calcul.totalSoldeToutCompte)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleImprimer('solde')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimer le reçu pour solde de tout compte
                      </button>
                      <button
                        onClick={() => {
                          majProcedure({ statut: 'cloturee', calculLicenciement: calcul });
                          setProcedureEnCours(null);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Clôturer la procédure
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}
```

(Ce `</>` et `)}` ferment le fragment ouvert à l'étape 1 — vérifier qu'il n'y a pas de
double fermeture par rapport à ce que Task 7 avait déjà posé en fin de fichier.)

- [ ] **Step 2: Ajouter la section Documents imprimables (toujours rendue, visible seulement à l'impression)**

Juste avant la fermeture du composant (avant le dernier `</div>` englobant tout le
`return`), ajouter la zone d'impression dédiée — c'est elle, et elle seule, qui doit
apparaître sur la page imprimée (toutes les cartes ci-dessus portent `no-print`) :

```tsx
      {procedure && salarieActif && documentAImprimer && (
        <div className="bg-white p-10 text-sm leading-relaxed">
          <div className="mb-6 pb-4 border-b-2 border-slate-800">
            <div className="font-bold text-base">{entreprise.raisonSociale}</div>
            <div className="text-xs text-slate-600">{entreprise.siegeSocial}, {entreprise.ville}</div>
            <div className="text-xs text-slate-500">
              RC : {entreprise.registreCommerce} · Patente : {entreprise.patente} · CNSS : {entreprise.numeroCNSS} · ICE : {entreprise.ice}
            </div>
          </div>
          <div className="text-right text-xs mb-6">Fait à {entreprise.ville}, le {formatDateJJMMAAAA(new Date().toISOString())}</div>

          {documentAImprimer === 'convocation' && (
            <>
              <h1 className="text-center font-bold text-lg mb-6 uppercase">Convocation à entretien préalable</h1>
              <p className="mb-4">Madame, Monsieur {salarieActif.nom} {salarieActif.prenom},</p>
              <p className="mb-4">
                Nous vous informons que les faits suivants, constatés le {formatDateJJMMAAAA(procedure.dateConstatation)}, nécessitent un
                entretien préalable conformément à l'article 62 du Code du Travail (Loi n° 65-99) : <em>{procedure.motifFaute}</em>
              </p>
              <p className="mb-4">
                Vous êtes convoqué(e) le {formatDateJJMMAAAA(procedure.dateConvocation!)} pour vous entretenir avec la direction sur ces faits.
                {procedure.assistanceDemandee && " Vous pourrez être assisté(e) d'un représentant des salariés ou d'un délégué syndical."}
              </p>
            </>
          )}

          {documentAImprimer === 'pv' && (
            <>
              <h1 className="text-center font-bold text-lg mb-6 uppercase">Procès-verbal d'entretien préalable</h1>
              <p className="mb-4">
                Salarié : {salarieActif.nom} {salarieActif.prenom} ({salarieActif.matricule}) — Entretien du {formatDateJJMMAAAA(procedure.dateEntretien!)}
              </p>
              <p className="mb-4 whitespace-pre-wrap">{procedure.resumeEntretien}</p>
              <p className="mb-4">
                Signature :{' '}
                {procedure.signePar === 'les_deux' && 'Signé par les deux parties.'}
                {procedure.signePar === 'salarie_absent' && 'Le salarié ne s\'est pas présenté à l\'entretien.'}
                {procedure.signePar === 'refus_signature' && 'Le salarié a refusé de signer le présent procès-verbal.'}
              </p>
            </>
          )}

          {documentAImprimer === 'notification' && (
            <>
              <h1 className="text-center font-bold text-lg mb-6 uppercase">Notification de sanction disciplinaire</h1>
              <p className="mb-4">Madame, Monsieur {salarieActif.nom} {salarieActif.prenom},</p>
              <p className="mb-4">
                À la suite de l'entretien préalable du {formatDateJJMMAAAA(procedure.dateEntretien!)}, nous vous notifions la décision
                suivante : <strong>{procedure.sanction === 'licenciement' ? 'Licenciement' : procedure.sanction}</strong>
                {procedure.sanction === 'mise_a_pied' && ` de ${procedure.joursMiseAPied} jour(s)`}.
              </p>
            </>
          )}

          {documentAImprimer === 'solde' && procedure.calculLicenciement && (
            <>
              <h1 className="text-center font-bold text-lg mb-6 uppercase">Reçu pour solde de tout compte</h1>
              <p className="mb-4">Salarié : {salarieActif.nom} {salarieActif.prenom} ({salarieActif.matricule})</p>
              <table className="w-full text-sm mb-4">
                <tbody>
                  <tr><td className="py-1">Salaire prorata du mois de sortie</td><td className="py-1 text-right">{formatMAD(procedure.calculLicenciement.salaireProrataMoisSortie)}</td></tr>
                  <tr><td className="py-1">Prime d'ancienneté</td><td className="py-1 text-right">{formatMAD(procedure.calculLicenciement.primeAncienneteSolde)}</td></tr>
                  <tr><td className="py-1">Indemnité congés restants</td><td className="py-1 text-right">{formatMAD(procedure.calculLicenciement.indemniteCongesRestants)}</td></tr>
                  <tr><td className="py-1">Indemnité de licenciement</td><td className="py-1 text-right">{formatMAD(procedure.calculLicenciement.indemniteLicenciement)}</td></tr>
                  <tr><td className="py-1">Indemnité de préavis</td><td className="py-1 text-right">{formatMAD(procedure.calculLicenciement.indemnitePreavis)}</td></tr>
                  <tr><td className="py-1">Dommages-intérêts</td><td className="py-1 text-right">{formatMAD(procedure.calculLicenciement.dommagesInteretsAbusif)}</td></tr>
                  <tr><td className="py-1">Intérêts de retard</td><td className="py-1 text-right">{formatMAD(procedure.calculLicenciement.interetsRetard)}</td></tr>
                  <tr className="font-bold border-t-2 border-slate-800"><td className="py-2">Total</td><td className="py-2 text-right">{formatMAD(procedure.calculLicenciement.totalSoldeToutCompte)}</td></tr>
                </tbody>
              </table>
              <p className="text-xs text-slate-500">Document pédagogique — simulation OFPPT, ne constitue pas un reçu légalement opposable.</p>
            </>
          )}
        </div>
      )}
```

- [ ] **Step 3: Ajouter l'historique des procédures clôturées**

Juste après le bloc de documents imprimables (toujours à l'intérieur du conteneur
principal, marqué `no-print`) :

```tsx
      {historiqueClos.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print space-y-2">
          <h2 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
            <History className="w-4 h-4 text-[#149D92]" />
            Procédures clôturées pour {salarieActif?.nom} {salarieActif?.prenom}
          </h2>
          <ul className="divide-y divide-slate-100 text-xs">
            {historiqueClos.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between">
                <span>
                  {p.typeFaute === 'grave' ? 'Faute grave' : 'Faute légère'} — {p.sanction} — constatée le {formatDateJJMMAAAA(p.dateConstatation)}
                </span>
                <button onClick={() => setProcedureEnCours(p)} className="text-[#149D92] font-semibold hover:underline">
                  Voir
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
```

- [ ] **Step 4: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Vérification visuelle — scénario 1 complet (faute grave conforme)**

Dans le navigateur, dérouler une procédure complète : faute grave, convocation à 3 jours,
entretien, notification à 24h, sanction « Licenciement ». Vérifier à l'étape 5 que
`indemniteLicenciement` et `indemnitePreavis` affichent `0,00 MAD`, qu'aucune alerte rouge
ne s'affiche, et que `licenciementAbusif` n'est pas pré-coché.

- [ ] **Step 6: Vérification visuelle — scénario 2 (convocation tardive)**

Refaire la même procédure sur un autre salarié avec une convocation à 11 jours de la
constatation. Vérifier qu'une alerte rouge `delai-convocation` s'affiche à l'étape 4,
qu'à l'étape 5 la case « licenciement jugé abusif » est pré-cochée, et que
`indemniteLicenciement`, `indemnitePreavis` et `dommagesInteretsAbusif` sont maintenant
non nuls et inclus dans le total.

- [ ] **Step 7: Vérification visuelle — impression**

Cliquer « Imprimer le reçu pour solde de tout compte », vérifier dans l'aperçu
d'impression du navigateur que seule la zone du document (en-tête entreprise + tableau du
solde) apparaît, sans la sidebar, le header, les cartes du stepper ni le footer (tous
`no-print`).

- [ ] **Step 8: Vérifier que la sauvegarde/restauration JSON inclut `procedures`**

Dans l'onglet Paramètres & Lois, cliquer « Exporter sauvegarde (JSON) », ouvrir le fichier
téléchargé et vérifier qu'il contient une clé `"procedures"` avec la procédure créée.

- [ ] **Step 9: Annuler le contournement temporaire de `AuthGate`** (si utilisé en Step 3/5/6/7 de cette tâche)

Remettre `src/main.tsx` dans son état d'origine (`<AuthGate>...</AuthGate>`).

- [ ] **Step 10: Build complet**

Run: `npm run build`
Expected: build réussi, aucun avertissement TypeScript.

- [ ] **Step 11: Commit**

```bash
git add src/components/discipline/DisciplineView.tsx
git commit -m "feat(discipline): add step 5 (settlement), printable documents, and history"
```

---

## Task 9: Vérification finale et déploiement

**Files:** aucun fichier modifié — tâche de vérification et de mise en production.

- [ ] **Step 1: Vérification complète**

Run: `npx tsc --noEmit && npm run build`
Expected: les deux commandes réussissent sans erreur ni avertissement bloquant.

- [ ] **Step 2: Revue des 5 points du Review Focus**

Reparcourir chacun des 5 points de la section **Review Focus** en haut de ce plan et
confirmer dans le navigateur que chaque cas limite se comporte comme attendu (salarié sans
congé, ancienneté < 1 an, dates manquantes, mise à pied plafonnée à 8 jours, double
ouverture de procédure bloquée).

- [ ] **Step 3: Appliquer la migration Supabase en production**

Via le tableau de bord Supabase du projet (SQL Editor), exécuter le contenu de
`supabase/migrations/20261005000000_procedures_disciplinaires.sql`. Sans cette étape, la
synchronisation cloud des procédures échouera silencieusement pour les utilisateurs
connectés.

- [ ] **Step 4: Déployer**

```bash
git push origin main
vercel --prod --yes
```

Vérifier ensuite sur `https://mon-dossier-grh.vercel.app` (ou le domaine de production en
vigueur) que l'onglet « Discipline & Licenciement » apparaît dans la sidebar pour un
compte formateur, et qu'une procédure complète peut y être créée et clôturée sans erreur
console.
