import jsPDF from 'jspdf';
import { BulletinPaie, LivrePaieLigne } from '../types';
import { MENTION_COPYRIGHT } from './branding';

/**
 * Appose la mention de propriété en bas de chaque page du document, une fois
 * toutes les pages créées.
 */
function apposerCopyright(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text(MENTION_COPYRIGHT, 105, 289, { align: 'center' });
  }
}

/**
 * Formate un montant en Dirhams marocains (MAD)
 */
export function formatMAD(montant: number | undefined | null): string {
  if (montant === undefined || montant === null || isNaN(montant)) return '0,00 MAD';
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(montant) + ' MAD';
}

/**
 * Formate une date au format marocain usuel JJ/MM/AAAA
 */
export function formatDateJJMMAAAA(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Export JSON complet pour sauvegarde ou paquet formateur/stagiaire
 */
export function exporterJSON(data: any, nomFichier: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier.endsWith('.json') ? nomFichier : `${nomFichier}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Ligne de suivi d'un stagiaire, telle qu'exportée par le tableau de bord formateur.
 */
export interface LigneSuiviExport {
  nom: string;
  classe: string;
  missionsSoumises: number;
  missionsCorrigees: number;
  taux: number; // %
  moyenne: number | null; // /20
  derniereActivite: string | null; // ISO
}

export interface MetaSuiviExport {
  nbMissions: number;
  nbStagiaires: number;
  tauxMoyen: number;
  aCorriger: number;
  moyenneGenerale: number | null;
}

const fmtDateCourt = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';

/**
 * Export Excel (CSV avec BOM, séparateur « ; ») du suivi des stagiaires.
 */
export function exporterSuiviStagiairesCSV(lignes: LigneSuiviExport[], meta: MetaSuiviExport): void {
  const headers = [
    'Stagiaire',
    'Classe',
    'Missions soumises',
    `Total missions`,
    'Taux avancement (%)',
    'Missions corrigées',
    'Moyenne /20',
    'Dernière activité'
  ];
  const rows = lignes.map((l) => [
    `"${l.nom.replace(/"/g, '""')}"`,
    `"${l.classe.replace(/"/g, '""')}"`,
    l.missionsSoumises,
    meta.nbMissions,
    l.taux,
    l.missionsCorrigees,
    l.moyenne !== null ? l.moyenne.toFixed(1) : '',
    fmtDateCourt(l.derniereActivite)
  ]);

  const csv =
    '﻿' +
    [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Suivi_stagiaires_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export PDF A4 (paysage) du suivi des stagiaires.
 */
export function genererSuiviStagiairesPDF(lignes: LigneSuiviExport[], meta: MetaSuiviExport): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFillColor(22, 50, 79);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SUIVI DES STAGIAIRES — TABLEAU DE BORD FORMATEUR', 148, 11, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')}`, 148, 17, { align: 'center' });

  // Synthèse
  doc.setTextColor(23, 43, 77);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${meta.nbStagiaires} stagiaire(s)  ·  Avancement moyen ${meta.tauxMoyen}%  ·  ` +
      `${meta.aCorriger} remise(s) à corriger  ·  Moyenne générale ${meta.moyenneGenerale !== null ? meta.moyenneGenerale.toFixed(1) + '/20' : '—'}`,
    15,
    30
  );

  // En-tête du tableau
  let y = 40;
  doc.setFillColor(244, 247, 250);
  doc.rect(15, y - 5, 267, 8, 'F');
  doc.setFontSize(8);
  doc.text('Stagiaire', 18, y);
  doc.text('Classe', 95, y);
  doc.text('Avancement', 160, y, { align: 'right' });
  doc.text('Corrigées', 200, y, { align: 'right' });
  doc.text('Moyenne', 235, y, { align: 'right' });
  doc.text('Dernière activité', 280, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  lignes.forEach((l) => {
    if (y > 195) {
      doc.addPage();
      y = 20;
    }
    doc.text(l.nom.substring(0, 40), 18, y);
    doc.text((l.classe || '—').substring(0, 35), 95, y);
    doc.text(`${l.missionsSoumises}/${meta.nbMissions} · ${l.taux}%`, 160, y, { align: 'right' });
    doc.text(String(l.missionsCorrigees), 200, y, { align: 'right' });
    doc.text(l.moyenne !== null ? `${l.moyenne.toFixed(1)}/20` : '—', 235, y, { align: 'right' });
    doc.text(fmtDateCourt(l.derniereActivite), 280, y, { align: 'right' });
    y += 5.5;
  });

  apposerCopyright(doc);
  doc.save(`Suivi_stagiaires_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Ligne nominative de déclaration des salaires (DS) pour la télédéclaration DAMANCOM.
 */
export interface LigneDeclarationDamancom {
  numeroImmatriculation: string;
  matricule: string;
  nomPrenom: string;
  joursDeclares: number;
  salaireReel: number;
  salairePlafonne: number;
  situation: string; // Normal / Entrant / Sortant
}

export interface MetaDeclarationDamancom {
  numeroAffiliation: string;
  raisonSociale: string;
  periode: string; // AAAA-MM
  totalSalaireReel: number;
  totalSalairePlafonne: number;
  totalCotisations: number;
}

/**
 * Génère le fichier de télédéclaration DAMANCOM (pédagogique) au format CSV
 * (séparateur « ; », BOM Excel). Reproduit la structure d'une déclaration
 * nominative des salaires (BDS) — NON destiné au dépôt officiel.
 */
export function exporterDeclarationDamancomCSV(
  lignes: LigneDeclarationDamancom[],
  meta: MetaDeclarationDamancom
): void {
  const entete = [
    `# TELEDECLARATION DAMANCOM (SIMULATION PEDAGOGIQUE - NON OFFICIELLE)`,
    `# N° Affiliation CNSS;${meta.numeroAffiliation}`,
    `# Employeur;${meta.raisonSociale}`,
    `# Periode;${meta.periode}`,
    `# Nombre de salaries declares;${lignes.length}`,
    ''
  ];
  const headers = [
    'N° Immatriculation CNSS',
    'Matricule',
    'Nom & Prénom',
    'Jours déclarés',
    'Salaire réel',
    'Salaire plafonné',
    'Situation'
  ];
  const rows = lignes.map((l) => [
    l.numeroImmatriculation,
    l.matricule,
    `"${l.nomPrenom.replace(/"/g, '""')}"`,
    l.joursDeclares,
    l.salaireReel.toFixed(2),
    l.salairePlafonne.toFixed(2),
    l.situation
  ]);
  const totaux = [
    '',
    ['TOTAUX', '', '', '', meta.totalSalaireReel.toFixed(2), meta.totalSalairePlafonne.toFixed(2), ''].join(';'),
    ['COTISATIONS TOTALES A VERSER', '', '', '', '', meta.totalCotisations.toFixed(2), ''].join(';')
  ];

  const csv =
    '﻿' +
    [...entete, headers.join(';'), ...rows.map((r) => r.join(';')), ...totaux].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Teledeclaration_DAMANCOM_${meta.periode}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export du livre de paie au format CSV
 */
export function exporterLivrePaieCSV(lignes: LivrePaieLigne[], periode: string): void {
  const headers = [
    'Matricule',
    'Nom & Prénom',
    'Poste',
    'Date Embauche',
    'Salaire Base',
    'Heures Sup',
    'Prime Ancienneté',
    'Autres Primes',
    'Brut Global',
    'CNSS Salariale',
    'AMO Salariale',
    'Net Imposable',
    'IR Net',
    'Acomptes',
    'Net à Payer',
    'Charges Patronales',
    'Coût Total',
    'Jours CNSS'
  ];

  const rows = lignes.map(l => [
    l.matricule,
    `"${l.nomPrenom.replace(/"/g, '""')}"`,
    `"${l.poste.replace(/"/g, '""')}"`,
    formatDateJJMMAAAA(l.dateEmbauche),
    l.salaireBase.toFixed(2),
    l.heuresSup.toFixed(2),
    l.primeAnciennete.toFixed(2),
    l.autresPrimes.toFixed(2),
    l.brutGlobal.toFixed(2),
    l.cnssSalariale.toFixed(2),
    l.amoSalariale.toFixed(2),
    l.netImposable.toFixed(2),
    l.irNet.toFixed(2),
    l.acomptes.toFixed(2),
    l.netAPayer.toFixed(2),
    l.chargesPatronales.toFixed(2),
    l.coutTotal.toFixed(2),
    l.joursDeclaresCNSS
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(';'),
    ...rows.map(r => r.join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Livre_de_paie_${periode}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Paramètres de génération d'un certificat de complétion de parcours.
 */
export interface CertificatParams {
  nomStagiaire: string;
  classe?: string;
  etablissement?: string;
  moyenneSur20: number;
  nbMissions: number;
  reference: string;
  dateObtention?: Date;
  /** Nom du formateur délivrant le certificat (bloc signature). */
  formateurNom?: string;
}

/**
 * Génère un certificat de complétion PDF (A4 paysage) attestant la réussite du
 * parcours pédagogique SIMULRH. Document pédagogique : ne vaut pas diplôme officiel.
 */
export function genererCertificatPDF(p: CertificatParams): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;
  const date = p.dateObtention ?? new Date();

  const NAVY: [number, number, number] = [28, 36, 89];
  const TEAL: [number, number, number] = [20, 157, 146];
  const SAFRAN: [number, number, number] = [233, 162, 59];
  const INK: [number, number, number] = [31, 36, 64];
  const GRIS: [number, number, number] = [110, 116, 140];

  // Fond crème léger
  doc.setFillColor(251, 247, 240);
  doc.rect(0, 0, W, H, 'F');

  // Double cadre décoratif
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1.6);
  doc.rect(10, 10, W - 20, H - 20);
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.rect(13.5, 13.5, W - 27, H - 27);

  // Filets d'accent safran dans deux coins
  doc.setDrawColor(...SAFRAN);
  doc.setLineWidth(1.2);
  doc.line(16, 24, 34, 24);
  doc.line(W - 34, H - 24, W - 16, H - 24);

  // Bandeau de titre
  let y = 34;
  doc.setTextColor(...TEAL);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SIMULRH — SIMULATEUR RH & PAIE', W / 2, y, { align: 'center' });
  y += 6;
  doc.setTextColor(...GRIS);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Formation professionnelle OFPPT — Maroc', W / 2, y, { align: 'center' });

  y += 16;
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text('CERTIFICAT DE COMPLÉTION', W / 2, y, { align: 'center' });

  y += 14;
  doc.setTextColor(...GRIS);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Ce certificat atteste que', W / 2, y, { align: 'center' });

  // Nom du stagiaire
  y += 13;
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(p.nomStagiaire.toUpperCase(), W / 2, y, { align: 'center' });
  // Soulignement teal centré sous le nom
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.6);
  doc.line(W / 2 - 55, y + 3, W / 2 + 55, y + 3);

  // Corps du texte
  y += 14;
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const corps =
    `a complété avec succès le parcours pédagogique « Gestion administrative du personnel & Paie »,`;
  doc.text(corps, W / 2, y, { align: 'center' });
  y += 6;
  doc.text(
    `composé de ${p.nbMissions} mission(s), avec une moyenne générale de ${p.moyenneSur20.toFixed(1)} / 20.`,
    W / 2,
    y,
    { align: 'center' }
  );

  // Classe / établissement
  if (p.classe || p.etablissement) {
    y += 8;
    doc.setTextColor(...GRIS);
    doc.setFontSize(10);
    const ligne = [p.classe, p.etablissement].filter(Boolean).join('  —  ');
    doc.text(ligne, W / 2, y, { align: 'center' });
  }

  // Pied : date + référence (gauche) · signature (droite)
  const yPied = H - 38;
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Délivré le ${date.toLocaleDateString('fr-FR')}`, 28, yPied);
  doc.setTextColor(...GRIS);
  doc.setFontSize(8);
  doc.text(`Référence : ${p.reference}`, 28, yPied + 5);

  // Bloc signature à droite
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.line(W - 95, yPied, W - 28, yPied);
  doc.setTextColor(...GRIS);
  doc.setFontSize(8);
  doc.text(p.formateurNom ? `${p.formateurNom} — Formateur` : 'Le formateur / L\'établissement', W - 61.5, yPied + 5, {
    align: 'center'
  });

  // Mention pédagogique
  doc.setTextColor(...GRIS);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.text(
    'Document pédagogique — atteste la réussite d\'un parcours de simulation. Ne constitue pas un diplôme ni une certification officielle.',
    W / 2,
    H - 20,
    { align: 'center' }
  );

  apposerCopyright(doc);

  const slug = p.nomStagiaire.trim().replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
  doc.save(`Certificat_${slug || 'stagiaire'}_${date.toISOString().slice(0, 10)}.pdf`);
}

/**
 * Générateur PDF pour un bulletin de paie au format A4
 */
export function genererBulletinPDF(bulletin: BulletinPaie, entrepriseRaisonSociale: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // En-tête
  doc.setFillColor(22, 50, 79); // Bleu marine
  doc.rect(0, 0, 210, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BULLETIN DE PAIE - SIMULATION PÉDAGOGIQUE', 105, 12, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Simulation pédagogique - Données fictives - Ne vaut pas validation juridique', 105, 19, { align: 'center' });

  // Informations Entreprise & Salarié
  doc.setTextColor(23, 43, 77);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Employeur : ${entrepriseRaisonSociale}`, 15, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(`Période de paie : ${bulletin.periodeMois}`, 15, 41);
  doc.text(`Statut : ${bulletin.statut}`, 15, 47);

  doc.setFont('helvetica', 'bold');
  doc.text(`Salarié : ${bulletin.salarieNomPrenom} (Matricule : ${bulletin.salarieMatricule})`, 110, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(`Poste : ${bulletin.poste}`, 110, 41);
  doc.text(`Jours déclarés : ${bulletin.joursTravailles} jours (${bulletin.heuresNormales}h)`, 110, 47);

  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 52, 195, 52);

  // Tableau des rubriques
  let y = 60;
  doc.setFillColor(244, 247, 250);
  doc.rect(15, y - 5, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Rubrique', 18, y);
  doc.text('Base', 105, y, { align: 'right' });
  doc.text('Taux', 130, y, { align: 'right' });
  doc.text('Gains (MAD)', 160, y, { align: 'right' });
  doc.text('Retenues (MAD)', 190, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  bulletin.lignes.forEach((l) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.text(l.libelle.substring(0, 45), 18, y);
    doc.text(l.base ? l.base.toFixed(2) : '-', 105, y, { align: 'right' });
    doc.text(l.taux ? `${l.taux}%` : '-', 130, y, { align: 'right' });
    if (l.nature === 'gain') {
      doc.text(l.montant.toFixed(2), 160, y, { align: 'right' });
    } else {
      doc.text(l.montant.toFixed(2), 190, y, { align: 'right' });
    }
    y += 5.5;
  });

  // Totaux
  y += 5;
  doc.setDrawColor(22, 50, 79);
  doc.line(15, y, 195, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Salaire Brut Global : ${formatMAD(bulletin.salaireBrutGlobal)}`, 18, y);
  doc.text(`Total Cotisations Salariales : ${formatMAD(bulletin.totalCotisationsSalariales)}`, 110, y);
  y += 6;
  doc.text(`Salaire Net Imposable : ${formatMAD(bulletin.salaireNetImposable)}`, 18, y);
  doc.text(`Impôt sur le Revenu (IR Net) : ${formatMAD(bulletin.irNet)}`, 110, y);
  y += 8;

  // Encadré Net à payer
  doc.setFillColor(20, 157, 146); // Turquoise
  doc.rect(15, y, 180, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('NET À PAYER AU SALARIÉ :', 25, y + 9);
  doc.setFontSize(13);
  doc.text(formatMAD(bulletin.salaireNetAPayer), 185, y + 9, { align: 'right' });

  // Coût employeur en dessous
  y += 20;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Charges patronales totales : ${formatMAD(bulletin.totalCotisationsPatronales)} | Coût global employeur : ${formatMAD(bulletin.coutTotalEmployeur)}`, 15, y);
  doc.text(`Version des paramètres : ${bulletin.versionReglesUtilisee} - Généré le ${new Date().toLocaleDateString('fr-FR')}`, 15, y + 5);

  apposerCopyright(doc);

  doc.save(`Bulletin_${bulletin.salarieMatricule}_${bulletin.periodeMois}.pdf`);
}
