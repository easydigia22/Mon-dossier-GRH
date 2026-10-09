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
