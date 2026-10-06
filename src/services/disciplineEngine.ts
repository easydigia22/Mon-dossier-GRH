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

  // La saisie utilisateur persistée sur la procédure fait foi ; le paramètre
  // `licenciementAbusifForce` reste accepté pour un calcul ponctuel (prévisualisation).
  const licenciementAbusif =
    params.licenciementAbusifForce ?? procedure.licenciementAbusifForce ?? !procedureConforme;
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

  // Saisies lues sur la procédure ; le repli sur `calculLicenciement` ne sert
  // qu'aux procédures enregistrées avant l'ajout de ces champs.
  const joursRetardPaiement =
    procedure.joursRetardPaiement ?? procedure.calculLicenciement?.joursRetardPaiement ?? 0;
  const tauxInteretAnnuel =
    procedure.tauxInteretAnnuel ?? procedure.calculLicenciement?.tauxInteretAnnuel ?? 5;
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
