import Decimal from 'decimal.js';
import { BulletinPaie, DetailCalculExplicite, RubriquePaieLigne, Salarie } from '../types';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface ParametresCalculPaie {
  salarie: Salarie;
  periodeMois: string; // "AAAA-MM"
  heuresSup25?: number;
  heuresSup50?: number;
  heuresSup100?: number;
  heuresAbsence?: number;
  primesDiverses?: { libelle: string; montant: number; imposable: boolean; cotisable: boolean }[];
  indemnitesNonImposables?: { libelle: string; montant: number }[];
  avantagesEnNature?: { libelle: string; montant: number }[];
  acomptesAvances?: number;
  versionRegles?: string;
}

export function roundMoney(value: Decimal | number): number {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Calcule l'ancienneté en années exactes au début ou fin du mois de paie
 */
export function calculerAncienneteAnnees(dateEmbauche: string, periodeMois: string): number {
  const embauche = new Date(dateEmbauche);
  const [annee, mois] = periodeMois.split('-').map(Number);
  const datePaie = new Date(annee, mois - 1, 28);
  
  let annees = datePaie.getFullYear() - embauche.getFullYear();
  const diffMois = datePaie.getMonth() - embauche.getMonth();
  if (diffMois < 0 || (diffMois === 0 && datePaie.getDate() < embauche.getDate())) {
    annees--;
  }
  return Math.max(0, annees);
}

/**
 * Taux d'ancienneté selon l'Article 350 du Code du Travail marocain
 */
export function getTauxAnciennete(annees: number): { taux: number; libelle: string } {
  if (annees >= 25) return { taux: 0.25, libelle: '25% (> 25 ans)' };
  if (annees >= 20) return { taux: 0.20, libelle: '20% (20 à 25 ans)' };
  if (annees >= 12) return { taux: 0.15, libelle: '15% (12 à 20 ans)' };
  if (annees >= 5) return { taux: 0.10, libelle: '10% (5 à 12 ans)' };
  if (annees >= 2) return { taux: 0.05, libelle: '5% (2 à 5 ans)' };
  return { taux: 0, libelle: "0% (< 2 ans d'ancienneté)" };
}

/**
 * Barème IR progressif mensuel marocain (Article 73-II du CGI)
 */
export function calculerIR(sni: number, personnesACharge: number): {
  tranche: string;
  taux: number;
  sommeADeduire: number;
  irBrut: number;
  deductionFamille: number;
  irNet: number;
  explication: string;
} {
  const decSNI = new Decimal(sni);

  let taux = 0;
  let sommeADeduire = 0;
  let tranche = '0 à 2 500 MAD (0%)';

  if (decSNI.lte(2500)) {
    taux = 0;
    sommeADeduire = 0;
    tranche = '0 à 2 500 MAD (Exonéré)';
  } else if (decSNI.lte(4166.67)) {
    taux = 0.10;
    sommeADeduire = 250.00;
    tranche = '2 501 à 4 166,67 MAD (10%)';
  } else if (decSNI.lte(5000)) {
    taux = 0.20;
    sommeADeduire = 666.67;
    tranche = '4 167 à 5 000 MAD (20%)';
  } else if (decSNI.lte(6666.67)) {
    taux = 0.30;
    sommeADeduire = 1166.67;
    tranche = '5 001 à 6 666,67 MAD (30%)';
  } else if (decSNI.lte(15000)) {
    taux = 0.34;
    sommeADeduire = 1433.33;
    tranche = '6 667 à 15 000 MAD (34%)';
  } else {
    taux = 0.38;
    sommeADeduire = 2033.33;
    tranche = 'Supérieur à 15 000 MAD (38%)';
  }

  const decTaux = new Decimal(taux);
  const decDeduire = new Decimal(sommeADeduire);
  const irBrutCalc = decSNI.mul(decTaux).minus(decDeduire);
  const irBrut = roundMoney(Decimal.max(0, irBrutCalc));

  // Charges de famille: 30 MAD par personne, max 6 personnes (180 MAD/mois)
  const maxPersonnes = Math.min(6, Math.max(0, personnesACharge));
  const deductionFamilleTotale = roundMoney(new Decimal(maxPersonnes).mul(30));
  
  // L'abattement pour charges de famille est plafonné à l'IR brut (pas d'IR négatif)
  const irNet = roundMoney(Decimal.max(0, new Decimal(irBrut).minus(deductionFamilleTotale)));

  const explication = taux === 0 
    ? "Le Salaire Net Imposable est inférieur ou égal à 2 500 MAD. Tranche exonérée d'IR."
    : `Application du barème CGI Art. 73 : (${decSNI.toFixed(2)} × ${taux * 100}%) - ${sommeADeduire} = ${irBrut.toFixed(2)} MAD (IR Brut). Déduction pour ${maxPersonnes} personne(s) à charge : ${deductionFamilleTotale} MAD (30 MAD/personne, max 180 MAD). IR Net = ${irNet.toFixed(2)} MAD.`;

  return {
    tranche,
    taux,
    sommeADeduire,
    irBrut,
    deductionFamille: deductionFamilleTotale,
    irNet,
    explication
  };
}

/**
 * Moteur de calcul de paie déterministe
 */
export function calculerBulletinPaie(params: ParametresCalculPaie): BulletinPaie {
  const { salarie, periodeMois } = params;
  const salaireBase = new Decimal(salarie.salaireBaseMensuel);
  const horaireMensuel = new Decimal(salarie.horaireMensuel || 191);
  const tauxHoraireNormal = roundMoney(salaireBase.div(horaireMensuel));

  const explications: DetailCalculExplicite[] = [];
  const lignes: RubriquePaieLigne[] = [];

  // 1. Salaire de base contractuel
  lignes.push({
    code: '100',
    libelle: 'Salaire de base',
    nature: 'gain',
    sens: 'salarial',
    base: salaireBase.toNumber(),
    taux: 1,
    montant: salaireBase.toNumber(),
    estMonetaire: true,
    assujettieCNSS: true,
    assujettieAMO: true,
    imposableIR: true,
    explicationFormule: `${salaireBase.toFixed(2)} MAD (durée standard 191h/mois)`,
    referenceLegale: 'Code du Travail Art. 184'
  });

  // 2. Retenue sur absence
  const hAbsence = params.heuresAbsence || 0;
  let montantAbsence = new Decimal(0);
  if (hAbsence > 0) {
    montantAbsence = new Decimal(hAbsence).mul(tauxHoraireNormal);
    const mntAbs = roundMoney(montantAbsence);
    lignes.push({
      code: '110',
      libelle: "Retenue pour absence",
      nature: 'retenue',
      sens: 'salarial',
      base: hAbsence,
      taux: tauxHoraireNormal,
      montant: mntAbs,
      estMonetaire: true,
      assujettieCNSS: true,
      assujettieAMO: true,
      imposableIR: true,
      explicationFormule: `${hAbsence}h × ${tauxHoraireNormal} MAD/h = ${mntAbs.toFixed(2)} MAD`,
      referenceLegale: 'Code du Travail Art. 184 & Convention'
    });
    explications.push({
      titre: "Retenue d'absence",
      formule: "Heures d'absence × Taux horaire de base",
      valeurs: `${hAbsence}h × (${salaireBase.toFixed(2)} / 191 = ${tauxHoraireNormal.toFixed(2)})`,
      explication: `L'absence réduit directement le brut à raison du taux horaire conventionnel standard de ${tauxHoraireNormal.toFixed(2)} MAD.`,
      referenceCode: "Art. 184 Code du Travail"
    });
  }

  // 3. Heures supplémentaires
  const h25 = params.heuresSup25 || 0;
  const h50 = params.heuresSup50 || 0;
  const h100 = params.heuresSup100 || 0;
  
  const mntH25 = roundMoney(new Decimal(h25).mul(tauxHoraireNormal).mul(1.25));
  const mntH50 = roundMoney(new Decimal(h50).mul(tauxHoraireNormal).mul(1.50));
  const mntH100 = roundMoney(new Decimal(h100).mul(tauxHoraireNormal).mul(2.00));
  const totalHeuresSup = roundMoney(new Decimal(mntH25).add(mntH50).add(mntH100));

  if (h25 > 0) {
    lignes.push({
      code: '121',
      libelle: 'Heures sup. majorées à 25% (jour ouvrable)',
      nature: 'gain',
      sens: 'salarial',
      base: h25,
      taux: roundMoney(new Decimal(tauxHoraireNormal).mul(1.25)),
      montant: mntH25,
      estMonetaire: true,
      assujettieCNSS: true,
      assujettieAMO: true,
      imposableIR: true,
      explicationFormule: `${h25}h × (${tauxHoraireNormal} × 1,25) = ${mntH25} MAD`,
      referenceLegale: 'Code du Travail Art. 197'
    });
  }
  if (h50 > 0) {
    lignes.push({
      code: '122',
      libelle: 'Heures sup. majorées à 50% (nuit ou jour férié)',
      nature: 'gain',
      sens: 'salarial',
      base: h50,
      taux: roundMoney(new Decimal(tauxHoraireNormal).mul(1.50)),
      montant: mntH50,
      estMonetaire: true,
      assujettieCNSS: true,
      assujettieAMO: true,
      imposableIR: true,
      explicationFormule: `${h50}h × (${tauxHoraireNormal} × 1,50) = ${mntH50} MAD`,
      referenceLegale: 'Code du Travail Art. 197-200'
    });
  }
  if (h100 > 0) {
    lignes.push({
      code: '123',
      libelle: 'Heures sup. majorées à 100% (nuit jour férié/repos)',
      nature: 'gain',
      sens: 'salarial',
      base: h100,
      taux: roundMoney(new Decimal(tauxHoraireNormal).mul(2.00)),
      montant: mntH100,
      estMonetaire: true,
      assujettieCNSS: true,
      assujettieAMO: true,
      imposableIR: true,
      explicationFormule: `${h100}h × (${tauxHoraireNormal} × 2,00) = ${mntH100} MAD`,
      referenceLegale: 'Code du Travail Art. 197-200'
    });
  }

  // 4. Prime d'ancienneté (Article 350 : assiette = Salaire de base + Heures supplémentaires)
  const anneesAnciennete = calculerAncienneteAnnees(salarie.dateEmbauche, periodeMois);
  const { taux: tauxAnciennete, libelle: libelleAnciennete } = getTauxAnciennete(anneesAnciennete);
  
  // Base d'ancienneté = (Salaire Base - Retenue Absence éventuelle) + Heures supplémentaires
  const baseCalculAnciennete = Decimal.max(0, salaireBase.minus(montantAbsence).add(totalHeuresSup));
  const montantPrimeAnciennete = roundMoney(baseCalculAnciennete.mul(tauxAnciennete));

  if (montantPrimeAnciennete > 0) {
    lignes.push({
      code: '150',
      libelle: `Prime d'ancienneté (${libelleAnciennete})`,
      nature: 'gain',
      sens: 'salarial',
      base: roundMoney(baseCalculAnciennete),
      taux: tauxAnciennete * 100,
      montant: montantPrimeAnciennete,
      estMonetaire: true,
      assujettieCNSS: true,
      assujettieAMO: true,
      imposableIR: true,
      explicationFormule: `${baseCalculAnciennete.toFixed(2)} MAD × ${tauxAnciennete * 100}% = ${montantPrimeAnciennete.toFixed(2)} MAD`,
      referenceLegale: 'Code du Travail marocain Art. 350'
    });

    explications.push({
      titre: "Prime d'ancienneté légale",
      formule: "(Salaire de base + Heures supplémentaires) × Taux d'ancienneté",
      valeurs: `${baseCalculAnciennete.toFixed(2)} MAD × ${tauxAnciennete * 100}%`,
      explication: `Salarié ayant ${anneesAnciennete} an(s) de service continu. Barème légal art. 350 appliqué.`,
      referenceCode: "Art. 350 Code du Travail"
    });
  }

  // 5. Primes diverses imposables et cotisables
  let totalPrimesDiverses = new Decimal(0);
  (params.primesDiverses || []).forEach((prime, idx) => {
    totalPrimesDiverses = totalPrimesDiverses.add(prime.montant);
    lignes.push({
      code: `16${idx + 1}`,
      libelle: prime.libelle,
      nature: 'gain',
      sens: 'salarial',
      base: prime.montant,
      montant: prime.montant,
      estMonetaire: true,
      assujettieCNSS: prime.cotisable,
      assujettieAMO: prime.cotisable,
      imposableIR: prime.imposable,
      explicationFormule: `Montant fixe accordé: ${prime.montant.toFixed(2)} MAD`,
      referenceLegale: 'Contrat / Accord d\'entreprise'
    });
  });

  // 6. Indemnités non imposables / exonérées (ex: frais de transport justifiés, panier selon plafonds)
  let totalIndemnitesExonerees = new Decimal(0);
  (params.indemnitesNonImposables || []).forEach((ind, idx) => {
    totalIndemnitesExonerees = totalIndemnitesExonerees.add(ind.montant);
    lignes.push({
      code: `17${idx + 1}`,
      libelle: ind.libelle,
      nature: 'gain',
      sens: 'salarial',
      base: ind.montant,
      montant: ind.montant,
      estMonetaire: true,
      assujettieCNSS: false,
      assujettieAMO: false,
      imposableIR: false,
      explicationFormule: `Indemnité exonérée selon plafond réglementaire : ${ind.montant.toFixed(2)} MAD`,
      referenceLegale: 'CGI Art. 57-1°'
    });
  });

  // 7. Avantages en nature (véhicule, logement : imposable et cotisable, mais déduit ensuite du versement monétaire)
  let totalAvantagesEnNature = new Decimal(0);
  (params.avantagesEnNature || []).forEach((av, idx) => {
    totalAvantagesEnNature = totalAvantagesEnNature.add(av.montant);
    lignes.push({
      code: `18${idx + 1}`,
      libelle: `Avantage en nature : ${av.libelle}`,
      nature: 'gain',
      sens: 'salarial',
      base: av.montant,
      montant: av.montant,
      estMonetaire: false, // Ne doit pas être versé en argent
      assujettieCNSS: true,
      assujettieAMO: true,
      imposableIR: true,
      explicationFormule: `Évaluation de l'avantage : ${av.montant.toFixed(2)} MAD (réintégré dans l'assiette brute, non versé en numéraire)`,
      referenceLegale: 'CGI Art. 56'
    });
  });

  // Salaire Brut Global
  // SBG = Base - Absences + H.Sup + Prime Ancienneté + Primes + Indemnités exonérées + Avantages en nature
  const decBrutGlobal = salaireBase
    .minus(montantAbsence)
    .add(totalHeuresSup)
    .add(montantPrimeAnciennete)
    .add(totalPrimesDiverses)
    .add(totalIndemnitesExonerees)
    .add(totalAvantagesEnNature);
  const salaireBrutGlobal = roundMoney(decBrutGlobal);

  // Assiette CNSS / AMO (Brut global diminué des indemnités exonérées de charges)
  const decAssietteSociale = decBrutGlobal.minus(totalIndemnitesExonerees);
  const assietteCNSS = roundMoney(decAssietteSociale);
  const assietteCNSSPlafonnee = roundMoney(Decimal.min(assietteCNSS, 6000));
  const assietteAMO = roundMoney(decAssietteSociale);

  // Cotisations Salariales
  // CNSS : 4.48% (plafonné à 6000 MAD => max 268.80 MAD)
  const cnssSalariale = roundMoney(new Decimal(assietteCNSSPlafonnee).mul(0.0448));
  // AMO : 2.26% (déplafonné)
  const amoSalariale = roundMoney(new Decimal(assietteAMO).mul(0.0226));
  const totalCotisationsSalariales = roundMoney(new Decimal(cnssSalariale).add(amoSalariale));

  lignes.push({
    code: '300',
    libelle: 'CNSS - Prestations Sociales Salariales',
    nature: 'retenue',
    sens: 'salarial',
    base: assietteCNSSPlafonnee,
    taux: 4.48,
    montant: cnssSalariale,
    estMonetaire: true,
    assujettieCNSS: false,
    assujettieAMO: false,
    imposableIR: false,
    explicationFormule: `Min(${assietteCNSS.toFixed(2)}, 6 000 MAD) × 4,48% = ${cnssSalariale.toFixed(2)} MAD`,
    referenceLegale: 'Dahir n° 1-72-184'
  });

  lignes.push({
    code: '310',
    libelle: 'AMO Salariale (Assurance Maladie Obligatoire)',
    nature: 'retenue',
    sens: 'salarial',
    base: assietteAMO,
    taux: 2.26,
    montant: amoSalariale,
    estMonetaire: true,
    assujettieCNSS: false,
    assujettieAMO: false,
    imposableIR: false,
    explicationFormule: `${assietteAMO.toFixed(2)} MAD × 2,26% = ${amoSalariale.toFixed(2)} MAD`,
    referenceLegale: 'Loi n° 65-00'
  });

  explications.push({
    titre: "Cotisations sociales salariales",
    formule: "(Assiette plafonnée 6 000 × 4,48%) + (Assiette AMO × 2,26%)",
    valeurs: `(${assietteCNSSPlafonnee.toFixed(2)} × 4,48% = ${cnssSalariale.toFixed(2)}) + (${assietteAMO.toFixed(2)} × 2,26% = ${amoSalariale.toFixed(2)})`,
    explication: "Le plafond CNSS s'applique rigoureusement à 6 000 MAD par mois pour les prestations sociales, alors que l'AMO est intégralement déplafonnée.",
    referenceCode: "Dahir 1-72-184 & Loi 65-00"
  });

  // Salaire Brut Imposable (SBI)
  // SBI = Brut Global - Indemnités exonérées
  const decSBI = decBrutGlobal.minus(totalIndemnitesExonerees);
  const salaireBrutImposable = roundMoney(decSBI);

  // Frais Professionnels (Article 59 du CGI)
  // Taux de 35% pour brut imposable <= 6 500 MAD, 25% pour brut imposable > 6 500 MAD.
  // Plafond mensuel légal standard = 2 916.67 MAD (35 000 MAD / 12)
  const decTauxFraisPro = decSBI.lte(6500) ? new Decimal(0.35) : new Decimal(0.25);
  const decFraisProBrut = decSBI.mul(decTauxFraisPro);
  const plafondFraisPro = new Decimal(2916.67);
  const decFraisPro = Decimal.min(decFraisProBrut, plafondFraisPro);
  const fraisProfessionnels = roundMoney(decFraisPro);

  // Salaire Net Imposable (SNI)
  // SNI = SBI - Cotisations salariales (CNSS + AMO) - Frais professionnels
  const decSNI = Decimal.max(0, decSBI.minus(totalCotisationsSalariales).minus(fraisProfessionnels));
  const salaireNetImposable = roundMoney(decSNI);

  explications.push({
    titre: "Détermination du Salaire Net Imposable (SNI)",
    formule: "SBI - (CNSS salariale + AMO salariale) - Frais professionnels",
    valeurs: `${salaireBrutImposable.toFixed(2)} - ${totalCotisationsSalariales.toFixed(2)} - ${fraisProfessionnels.toFixed(2)}`,
    explication: `Frais professionnels déductibles calculés à ${decTauxFraisPro.mul(100)}% (plafonné à 2 916,67 MAD/mois). Le SNI constitue la base de soumission au barème de l'IR.`,
    referenceCode: "CGI Articles 59 et 73"
  });

  // Calcul de l'IR progressif
  const irResultat = calculerIR(salaireNetImposable, salarie.nombrePersonnesACharge || salarie.nombreEnfants || 0);
  const irNet = irResultat.irNet;

  if (irNet > 0) {
    lignes.push({
      code: '400',
      libelle: `Impôt sur le Revenu retenu à la source (${irResultat.tranche})`,
      nature: 'retenue',
      sens: 'salarial',
      base: salaireNetImposable,
      taux: irResultat.taux * 100,
      montant: irNet,
      estMonetaire: true,
      assujettieCNSS: false,
      assujettieAMO: false,
      imposableIR: false,
      explicationFormule: irResultat.explication,
      referenceLegale: 'CGI Maroc Art. 73-II'
    });
  }

  explications.push({
    titre: "Calcul de l'IR Net Salarial",
    formule: "[(SNI × Taux barème) - Somme à déduire] - Charges de famille",
    valeurs: `[(${salaireNetImposable.toFixed(2)} × ${irResultat.taux * 100}%) - ${irResultat.sommeADeduire}] - ${irResultat.deductionFamille}`,
    explication: irResultat.explication,
    referenceCode: "CGI Art. 73-II"
  });

  // Acomptes et avances éventuels
  const acomptes = roundMoney(params.acomptesAvances || 0);
  if (acomptes > 0) {
    lignes.push({
      code: '450',
      libelle: "Acomptes sur salaire versés",
      nature: 'retenue',
      sens: 'salarial',
      base: acomptes,
      montant: acomptes,
      estMonetaire: true,
      assujettieCNSS: false,
      assujettieAMO: false,
      imposableIR: false,
      explicationFormule: `Déduction de l'acompte consenti au salarié : ${acomptes.toFixed(2)} MAD`,
      referenceLegale: 'Code du Travail Art. 387'
    });
  }

  // Si avantages en nature, ils sont déduits du net monétaire à payer
  // car ils ont déjà été fournis en nature (logement, voiture)
  if (totalAvantagesEnNature.gt(0)) {
    const mntAv = roundMoney(totalAvantagesEnNature);
    lignes.push({
      code: '460',
      libelle: "Déduction des avantages en nature accordés",
      nature: 'retenue',
      sens: 'salarial',
      base: mntAv,
      montant: mntAv,
      estMonetaire: false,
      assujettieCNSS: false,
      assujettieAMO: false,
      imposableIR: false,
      explicationFormule: `Reprise de l'avantage en nature pour neutraliser son paiement en numéraire`,
      referenceLegale: 'Règle comptable et sociale'
    });
  }

  // Salaire Net à Payer
  // Net à payer = Brut Global - Cotisations Salariales - IR Net - Acomptes - Avantages en nature
  const decNetAPayer = decBrutGlobal
    .minus(totalCotisationsSalariales)
    .minus(irNet)
    .minus(acomptes)
    .minus(totalAvantagesEnNature);
  const salaireNetAPayer = roundMoney(decNetAPayer);

  // Cotisations Patronales
  // 1. CNSS Prestations: 8.98% (plafonné à 6000 MAD => max 538.80 MAD)
  const cnssPatronalePrestations = roundMoney(new Decimal(assietteCNSSPlafonnee).mul(0.0898));
  // 2. Prestations familiales: 6.40% (déplafonné)
  const cnssPatronaleAllocationsFamiliales = roundMoney(new Decimal(assietteCNSS).mul(0.0640));
  // 3. Taxe formation professionnelle: 1.60% (déplafonné)
  const taxeFormationProfessionnelle = roundMoney(new Decimal(assietteCNSS).mul(0.0160));
  // 4. AMO Patronale: 4.11% (2.26% base + 1.85% solidarité) (déplafonné)
  const amoPatronale = roundMoney(new Decimal(assietteAMO).mul(0.0411));

  const totalCotisationsPatronales = roundMoney(
    new Decimal(cnssPatronalePrestations)
      .add(cnssPatronaleAllocationsFamiliales)
      .add(taxeFormationProfessionnelle)
      .add(amoPatronale)
  );

  // Coût total employeur = Salaire Brut Global + Charges patronales
  const coutTotalEmployeur = roundMoney(new Decimal(salaireBrutGlobal).add(totalCotisationsPatronales));

  explications.push({
    titre: "Coût global pour l'entreprise",
    formule: "Salaire Brut Global + Total Cotisations Patronales",
    valeurs: `${salaireBrutGlobal.toFixed(2)} + ${totalCotisationsPatronales.toFixed(2)}`,
    explication: `L'employeur supporte en sus du salaire brut : CNSS prestations (${cnssPatronalePrestations} MAD), Alloc. familiales (${cnssPatronaleAllocationsFamiliales} MAD), Taxe OFPPT (${taxeFormationProfessionnelle} MAD) et AMO (${amoPatronale} MAD).`,
    referenceCode: "Législation sociale marocaine"
  });

  return {
    id: `bull-${salarie.id}-${periodeMois}`,
    periodeMois,
    salarieId: salarie.id,
    salarieMatricule: salarie.matricule,
    salarieNomPrenom: `${salarie.nom} ${salarie.prenom}`,
    poste: salarie.poste,
    statut: 'Brouillon',
    dateCalcul: new Date().toISOString(),
    versionReglesUtilisee: params.versionRegles || 'Législation marocaine 2024-2025 vérifiée',
    estSnapshotScelle: false,

    salaireBaseContractuel: salaireBase.toNumber(),
    joursTravailles: 26,
    heuresNormales: 191,
    heuresSupplementaires: {
      taux25: h25,
      taux50: h50,
      taux100: h100,
      montantTotal: totalHeuresSup
    },
    ancienneteAnnees: anneesAnciennete,
    tauxAnciennete: tauxAnciennete * 100,
    primeAnciennete: montantPrimeAnciennete,
    primesDiverses: params.primesDiverses || [],
    indemnitesNonImposables: params.indemnitesNonImposables || [],
    avantagesEnNature: params.avantagesEnNature || [],
    retenuesAbsences: {
      heures: hAbsence,
      tauxHoraire: tauxHoraireNormal,
      montant: roundMoney(montantAbsence)
    },
    acomptesAvances: acomptes,

    salaireBrutGlobal,
    salaireBrutImposable,
    assietteCNSS,
    assietteCNSSPlafonnee,
    assietteAMO,

    cnssSalariale,
    amoSalariale,
    totalCotisationsSalariales,

    fraisProfessionnels,
    salaireNetImposable,

    trancheIR: irResultat.tranche,
    tauxIR: irResultat.taux * 100,
    sommeADeduireIR: irResultat.sommeADeduire,
    irBrut: irResultat.irBrut,
    deductionChargesFamille: irResultat.deductionFamille,
    irNet,

    cnssPatronalePrestations,
    cnssPatronaleAllocationsFamiliales,
    taxeFormationProfessionnelle,
    amoPatronale,
    totalCotisationsPatronales,

    salaireNetAPayer,
    coutTotalEmployeur,

    lignes,
    explicationsPedagogiques: explications,
    remarquesControle: []
  };
}
