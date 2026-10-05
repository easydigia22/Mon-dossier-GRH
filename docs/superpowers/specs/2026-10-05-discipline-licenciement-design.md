# Module Discipline & Licenciement — Spec de conception

Date : 2026-10-05
Statut : en attente de revue utilisateur

## 1. Intention

Ajouter à « Mon Dossier Administratif » (simulateur RH & Paie, formation OFPPT) un module
pédagogique couvrant la procédure disciplinaire marocaine complète : qualification de la
faute, convocation, entretien préalable, procès-verbal, sanction, et — en cas de
licenciement — le calcul chiffré du solde de tout compte, des indemnités, des
dommages-intérêts pour licenciement abusif et des intérêts de retard.

**Public** : stagiaires et formateurs OFPPT en gestion administrative du personnel.
**Succès** : un stagiaire peut dérouler une procédure disciplinaire de bout en bout sur un
salarié fictif, voir à chaque étape la formule légale, son application numérique et
l'article du Code du Travail concerné (même pédagogie que l'onglet Bulletins de paie), et
obtenir des documents imprimables conformes.

Comme le reste de l'app, ce module est une **simulation pédagogique** : il ne remplace ni
un conseil juridique ni une procédure réelle devant les prud'hommes. Le bandeau
d'avertissement existant (déjà utilisé dans CNSS & AMO) sera repris à l'identique.

## 2. Emplacement et visibilité

- Nouvel onglet de sidebar **« Discipline & Licenciement »** (id `discipline`), positionné
  entre « Congés & Maladies » et « Préparation paie » dans `NavigationTabs.tsx`.
- Icône lucide-react : `Gavel` (ou `ShieldAlert` si `Gavel` indisponible dans la version
  installée — à vérifier à l'implémentation).
- Visible uniquement pour `estFormateur` (comme l'onglet « Espace Formateur » déjà masqué
  aux comptes stagiaire dans `App.tsx`), car c'est un acte de gestion RH, pas un exercice
  stagiaire.

## 3. Modèle de données

Nouveau type dans `src/types/index.ts` :

```ts
export type TypeFauteDisciplinaire = 'legere' | 'grave';

export type SanctionDisciplinaire =
  | 'avertissement'
  | 'blame'
  | 'mise_a_pied'
  | 'licenciement';

export type StatutProcedureDisciplinaire = 'ouverte' | 'cloturee';

export interface CalculLicenciement {
  // Indemnités dues (0 si faute grave + procédure conforme, Art. 39)
  indemniteLicenciement: number;
  indemnitePreavis: number;
  indemniteCongesRestants: number;
  primeAncienneteSolde: number;
  salaireProrataMoisSortie: number;

  // Litige (si licenciement jugé abusif)
  licenciementAbusif: boolean; // auto-proposé par les alertes de conformité, modifiable
  dommagesInteretsAbusif: number;

  // Retard de paiement (optionnel)
  joursRetardPaiement: number;
  tauxInteretAnnuel: number; // paramétrable, défaut 5%
  interetsRetard: number;

  totalSoldeToutCompte: number;
  alertesConformite: AlerteConformiteProcedure[];
}

export interface AlerteConformiteProcedure {
  code: string; // ex: 'delai-convocation', 'delai-notification'
  message: string;
  articleLoi: string;
  severite: 'avertissement' | 'risque';
}

export interface ProcedureDisciplinaire {
  id: string;
  salarieId: string;
  typeFaute: TypeFauteDisciplinaire;
  motifFaute: string;
  dateConstatation: string; // AAAA-MM-JJ
  categorieSalarie: 'cadre' | 'non_cadre'; // saisi à l'étape 1, sert au calcul du préavis (5.2) — le type Salarie existant n'a pas ce champ, on ne le modifie pas

  // Étape 2 — Convocation
  dateConvocation?: string;
  assistanceDemandee: boolean;

  // Étape 3 — Entretien & PV
  dateEntretien?: string;
  resumeEntretien?: string;
  signePar?: 'les_deux' | 'salarie_absent' | 'refus_signature';

  // Étape 4 — Décision
  sanction?: SanctionDisciplinaire;
  joursMiseAPied?: number; // ≤ 8, Art. 37
  dateNotificationSanction?: string;

  // Étape 5 — Calcul (si sanction === 'licenciement')
  calculLicenciement?: CalculLicenciement;

  statut: StatutProcedureDisciplinaire;
  creeLe: string;
  misAJourLe: string;
}
```

Garde-fou : un salarié ne peut avoir qu'une procédure `statut: 'ouverte'` à la fois,
vérifié côté UI (le bouton « Nouvelle procédure » est désactivé si une procédure ouverte
existe déjà pour ce salarié ; un message l'explique).

## 4. Persistance

Suit exactement le pattern existant de `contrats` / `demandesConges` dans
`useAppData.ts` :

- `procedures: ProcedureDisciplinaire[]` ajouté à `AppDatabaseState` (`src/services/db.ts`)
  et à l'état de `useAppData.ts`, avec `upsertProcedure` / `deleteProcedure`.
- Ajouté à la table `cloudSync.ts` (pattern `{ table: 'procedures', rows: (s) => s.procedures }`)
  pour la synchro Supabase, comme `contrats`.
- Inclus dans `fullAppState` (sauvegarde JSON) et `handleRestoreState` dans `App.tsx`.
- Nouvelle migration SQL `supabase/migrations/<timestamp>_procedures_disciplinaires.sql`
  créant la table `procedures` côté Supabase (même schéma RLS que `contrats` : lecture/
  écriture restreintes à `user_id = auth.uid()`).

## 5. Moteur de calcul — `src/services/disciplineEngine.ts`

Fonctions pures, `Decimal.js` pour la précision monétaire (même convention que
`payrollEngine.ts`), chaque fonction retourne aussi la formule théorique et l'article
cité pour alimenter le mode pédagogique.

### 5.1 Indemnité de licenciement (Art. 53)

Barème par tranche d'ancienneté, en heures de salaire, appliqué au taux horaire moyen :

| Tranche | Taux |
|---|---|
| Chacune des 5 premières années | 96 h |
| De la 6ᵉ à la 10ᵉ année | 144 h |
| De la 11ᵉ à la 15ᵉ année | 192 h |
| Au-delà de la 15ᵉ année | 240 h |

`calculerIndemniteLicenciement(ancienneteAnnees, salaireHoraireMoyen): { montant, detailTranches, article: 'Art. 53' }`

Non due si `typeFaute === 'grave'` **et** `alertesConformite` ne contient aucune alerte de
sévérité `'risque'` (procédure conforme) — Art. 39.

### 5.2 Indemnité compensatrice de préavis (Art. 43, 51)

Barème simplifié par ancienneté et par `categorieSalarie` (saisie à l'étape 1 du
stepper, voir §3 — champ propre à la procédure, n'étend pas le type `Salarie` global) :

| Ancienneté | Non-cadre | Cadre |
|---|---|---|
| < 1 an | 8 jours | 1 mois |
| 1 à 5 ans | 1 mois | 2 mois |
| > 5 ans | 2 mois | 3 mois |

Même règle de non-cumul que 5.1 : pas due en cas de faute grave avec procédure conforme.

### 5.3 Dommages-intérêts pour licenciement abusif (Art. 41)

`1,5 mois de salaire × années d'ancienneté (fraction ≥ 6 mois comptée entière), plafonné à 36 mois de salaire.`

Déclenché uniquement si `calculLicenciement.licenciementAbusif === true`.

### 5.4 Alertes de conformité (déclenchent la proposition d'abusif)

- `delai-convocation` : si `dateConvocation - dateConstatation > 8 jours` → Art. 62.
- `delai-notification` : si `dateNotificationSanction - dateEntretien > 48 heures` → Art. 62.
- Ces alertes pré-cochent `licenciementAbusif = true` mais restent modifiables par
  l'utilisateur (ce n'est qu'une simulation pédagogique, pas un jugement).

### 5.5 Intérêts de retard

`montant dû × tauxInteretAnnuel × joursRetardPaiement / 365`, taux par défaut 5 %
(paramétrable dans le formulaire, non sourcé à un article précis — libellé « taux
indicatif, à ajuster selon la créance »).

### 5.6 Indemnité congés restants & solde

Réutilise la logique déjà existante dans `leaves`/`payrollEngine` pour le calcul du solde
de congés acquis non pris × salaire journalier, plus le prorata du salaire du mois de
sortie et la prime d'ancienneté du dernier mois (réutilise `getTauxAnciennete`).

`totalSoldeToutCompte` = somme de toutes les lignes dues ci-dessus.

## 6. Référentiel légal — `src/services/rulesData.ts`

Ajout de ~6 entrées à `REGLES_JURIDIQUES_MAROC`, même format que les entrées existantes
(`art-350-anciennete`, etc.) : `art-37-echelle-sanctions`, `art-39-faute-grave`,
`art-41-licenciement-abusif`, `art-43-preavis`, `art-53-indemnite-licenciement`,
`art-62-delai-procedure`.

## 7. UI — `src/components/discipline/DisciplineView.tsx`

### 7.1 En-tête

Identique au pattern des autres vues (icône + titre + sous-titre + bandeau avertissement
pédagogique), sélecteur de salarié (`<select>`, comme dans `PayrollSlipsView`), bouton
« Nouvelle procédure » (désactivé si procédure ouverte existante pour ce salarié).

### 7.2 Stepper vertical à 5 étapes

Chaque étape est une carte dépliée séquentiellement (l'étape suivante se déplie quand la
précédente est renseignée — pattern simple `useState<number>` pour l'étape courante, pas
de routing) :

1. **Qualification** — type de faute (légère/grave), motif (texte libre), date de
   constatation, catégorie du salarié (cadre/non-cadre, pour le calcul du préavis §5.2).
2. **Convocation** — date de convocation, case « assistance demandée » → génère et permet
   d'imprimer la **Lettre de convocation à entretien préalable**.
3. **Entretien & PV** — date d'entretien, résumé (texte libre), mode de signature → génère
   le **Procès-verbal d'entretien préalable**.
4. **Décision** — sélection dans l'échelle Art. 37 (avertissement / blâme / mise à pied,
   avec champ jours ≤ 8) ou licenciement si faute grave → génère la **Notification de
   sanction**.
5. **Solde de tout compte** (affichée seulement si `sanction === 'licenciement'`) —
   tableau détaillé ligne par ligne (formule théorique + application numérique + article,
   même composant visuel que le mode « Détail pédagogique & Formules » des Bulletins de
   paie), alertes de conformité en évidence (rouge si `risque`, orange si
   `avertissement`), case à cocher « licenciement jugé abusif » pré-remplie par les
   alertes mais modifiable, champs retard de paiement optionnels → génère le **Reçu pour
   solde de tout compte**.

### 7.3 Documents générés

Réutilisation du composant d'impression A4 déjà utilisé dans `DocumentsView.tsx` /
`PayrollSlipsView.tsx` (`window.print()` + classe `no-print` pour masquer l'UI de
navigation à l'impression, déjà en place globalement). Chaque document est un rendu HTML
dédié dans `DisciplineView.tsx` (pas de nouveau composant partagé, pour rester cohérent
avec l'existant où chaque vue gère son propre gabarit imprimable).

### 7.4 Historique

Sous le stepper, une liste des procédures déjà clôturées pour le salarié sélectionné
(lecture seule, avec bouton « Voir » qui réaffiche le stepper en mode consultation).

## 8. Hors périmètre (explicitement exclu)

- Pas d'upload de pièces jointes (photos de PV signés, etc.) — tout reste texte saisi.
- Pas de signature électronique.
- Pas de notification/envoi d'email réel.
- Le document « Reçu pour solde de tout compte » déjà présent dans `DocumentsView.tsx`
  (générique, non chiffré) n'est pas supprimé ; le nouveau module produit sa propre
  version chiffrée et détaillée, sans les fusionner dans cette spec.

## 9. Vérification (pas de suite de tests automatisés dans ce repo)

- `npx tsc --noEmit` et `npm run build` après implémentation.
- Vérification visuelle dans le navigateur sur deux scénarios :
  1. Faute grave, procédure conforme (délais respectés) → aucune indemnité de
     licenciement/préavis, pas de dommages-intérêts, solde = congés restants + prorata +
     ancienneté uniquement.
  2. Faute grave, convocation tardive (> 8 jours) → alerte de conformité affichée,
     `licenciementAbusif` pré-coché, indemnités + dommages-intérêts recalculés et inclus
     dans le solde.
- Vérification que la sauvegarde/restauration JSON (Paramètres & Lois) inclut bien
  `procedures`.
