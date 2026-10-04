import React, { useState } from 'react';
import { BookOpenText, Download, Printer, Filter, CheckCircle2, ShieldCheck } from 'lucide-react';
import { BulletinPaie, Entreprise, LivrePaieLigne, Salarie } from '../../types';
import { formatMAD, formatDateJJMMAAAA, exporterLivrePaieCSV } from '../../services/exportService';

interface PayrollBookViewProps {
  entreprise: Entreprise;
  salaries: Salarie[];
  bulletins: BulletinPaie[];
  periodeActive: string;
  onSelectPeriode: (periode: string) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PayrollBookView: React.FC<PayrollBookViewProps> = ({
  entreprise,
  salaries,
  bulletins,
  periodeActive,
  onSelectPeriode,
  showNotification
}) => {
  const bulletinsPeriode = bulletins.filter((b) => b.periodeMois === periodeActive);

  // Construction des lignes du livre de paie
  const lignesLivre: LivrePaieLigne[] = bulletinsPeriode.map((b) => {
    const sal = salaries.find((s) => s.id === b.salarieId);
    const totalPrimes = b.primesDiverses.reduce((sum, p) => sum + p.montant, 0);

    return {
      matricule: b.salarieMatricule,
      nomPrenom: b.salarieNomPrenom,
      poste: b.poste,
      dateEmbauche: sal?.dateEmbauche || '-',
      salaireBase: b.salaireBaseContractuel,
      heuresSup: b.heuresSupplementaires.montantTotal,
      primeAnciennete: b.primeAnciennete,
      autresPrimes: totalPrimes,
      brutGlobal: b.salaireBrutGlobal,
      cnssSalariale: b.cnssSalariale,
      amoSalariale: b.amoSalariale,
      netImposable: b.salaireNetImposable,
      irNet: b.irNet,
      acomptes: b.acomptesAvances,
      netAPayer: b.salaireNetAPayer,
      chargesPatronales: b.totalCotisationsPatronales,
      coutTotal: b.coutTotalEmployeur,
      joursDeclaresCNSS: b.joursTravailles
    };
  });

  // Totaux mensuels consolidés
  const totaux = {
    salaireBase: lignesLivre.reduce((sum, l) => sum + l.salaireBase, 0),
    heuresSup: lignesLivre.reduce((sum, l) => sum + l.heuresSup, 0),
    primeAnciennete: lignesLivre.reduce((sum, l) => sum + l.primeAnciennete, 0),
    autresPrimes: lignesLivre.reduce((sum, l) => sum + l.autresPrimes, 0),
    brutGlobal: lignesLivre.reduce((sum, l) => sum + l.brutGlobal, 0),
    cnssSalariale: lignesLivre.reduce((sum, l) => sum + l.cnssSalariale, 0),
    amoSalariale: lignesLivre.reduce((sum, l) => sum + l.amoSalariale, 0),
    netImposable: lignesLivre.reduce((sum, l) => sum + l.netImposable, 0),
    irNet: lignesLivre.reduce((sum, l) => sum + l.irNet, 0),
    acomptes: lignesLivre.reduce((sum, l) => sum + l.acomptes, 0),
    netAPayer: lignesLivre.reduce((sum, l) => sum + l.netAPayer, 0),
    chargesPatronales: lignesLivre.reduce((sum, l) => sum + l.chargesPatronales, 0),
    coutTotal: lignesLivre.reduce((sum, l) => sum + l.coutTotal, 0),
    joursDeclares: lignesLivre.reduce((sum, l) => sum + l.joursDeclaresCNSS, 0)
  };

  const handleExportCSV = () => {
    if (lignesLivre.length === 0) {
      showNotification('Aucune donnée à exporter pour cette période.', 'warning');
      return;
    }
    exporterLivrePaieCSV(lignesLivre, periodeActive);
    showNotification(`Livre de paie de ${periodeActive} exporté en CSV.`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* En-tête du livre de paie */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
              <BookOpenText className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1C2459]">Livre de Paie Mensuel Récapitulatif</h1>
              <p className="text-xs text-slate-500">
                Registre obligatoire (Article 371 du Code du Travail) · Réconciliation stricte avec les bulletins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={lignesLivre.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={lignesLivre.length === 0}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#149D92] hover:bg-[#11857c] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Sélecteur de mois & badge de contrôle */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Période mensuelle :</span>
            <select
              value={periodeActive}
              onChange={(e) => onSelectPeriode(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded font-bold text-[#1C2459] bg-slate-50"
            >
              <option value="2025-01">Janvier 2025</option>
              <option value="2025-02">Février 2025</option>
              <option value="2025-03">Mars 2025</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Réconciliation mathématique : Somme bulletins = Livre de paie</span>
          </div>
        </div>
      </div>

      {/* Tableau complet du Livre de paie */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-[#1C2459] uppercase tracking-wider">
            {entreprise.raisonSociale} — État détaillé de la paie ({lignesLivre.length} salariés)
          </span>
          <span className="text-[11px] text-slate-500">Tous montants exprimés en MAD</span>
        </div>

        {lignesLivre.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Aucun bulletin calculé pour la période {periodeActive}. Veuillez calculer la paie dans le module dédié.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#1C2459] text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Matr.</th>
                  <th className="py-2.5 px-3">Salarié</th>
                  <th className="py-2.5 px-3 text-right">Base</th>
                  <th className="py-2.5 px-3 text-right">H. Sup</th>
                  <th className="py-2.5 px-3 text-right">Anc. (Art.350)</th>
                  <th className="py-2.5 px-3 text-right">Brut Global</th>
                  <th className="py-2.5 px-3 text-right">CNSS (4,48%)</th>
                  <th className="py-2.5 px-3 text-right">AMO (2,26%)</th>
                  <th className="py-2.5 px-3 text-right">Net Imposable</th>
                  <th className="py-2.5 px-3 text-right">IR Net</th>
                  <th className="py-2.5 px-3 text-right">Acomptes</th>
                  <th className="py-2.5 px-3 text-right bg-[#149D92] text-white">Net à Payer</th>
                  <th className="py-2.5 px-3 text-right">Ch. Patronales</th>
                  <th className="py-2.5 px-3 text-right">Coût Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lignesLivre.map((l) => (
                  <tr key={l.matricule} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="py-2 px-3 font-bold text-[#1C2459]">{l.matricule}</td>
                    <td className="py-2 px-3 font-sans text-xs font-semibold text-slate-800">
                      {l.nomPrenom}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-700">{l.salaireBase.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-700">{l.heuresSup > 0 ? l.heuresSup.toFixed(2) : '-'}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-700">{l.primeAnciennete > 0 ? l.primeAnciennete.toFixed(2) : '-'}</td>
                    <td className="py-2 px-3 text-right tabular-nums font-bold text-slate-900">{l.brutGlobal.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-red-700">{l.cnssSalariale.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-red-700">{l.amoSalariale.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-700">{l.netImposable.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-red-700">{l.irNet > 0 ? l.irNet.toFixed(2) : '-'}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-600">{l.acomptes > 0 ? l.acomptes.toFixed(2) : '-'}</td>
                    <td className="py-2 px-3 text-right tabular-nums font-bold text-emerald-800 bg-emerald-50/50">
                      {l.netAPayer.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-600">{l.chargesPatronales.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right tabular-nums font-bold text-[#1C2459]">{l.coutTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              {/* Ligne des totaux généraux */}
              <tfoot className="bg-[#F4F7FA] font-mono text-[11px] font-bold border-t-2 border-[#1C2459]">
                <tr>
                  <td colSpan={2} className="py-3 px-3 uppercase font-sans text-xs text-[#1C2459]">
                    Totaux Généraux ({lignesLivre.length} salariés)
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">{totaux.salaireBase.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right tabular-nums">{totaux.heuresSup.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right tabular-nums">{totaux.primeAnciennete.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-slate-900">{totaux.brutGlobal.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-red-700">{totaux.cnssSalariale.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-red-700">{totaux.amoSalariale.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right tabular-nums">{totaux.netImposable.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-red-700">{totaux.irNet.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right tabular-nums">{totaux.acomptes.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-emerald-800 bg-emerald-100 text-xs">
                    {totaux.netAPayer.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">{totaux.chargesPatronales.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-[#1C2459] text-xs">
                    {totaux.coutTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
