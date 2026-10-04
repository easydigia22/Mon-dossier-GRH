import React, { useState } from 'react';
import { Calculator, Play, CheckCircle2, Lock, RefreshCw, AlertTriangle, ArrowRight, Eye } from 'lucide-react';
import { BulletinPaie, EvenementPresence, Salarie } from '../../types';
import { formatMAD } from '../../services/exportService';

interface PayrollPreparationViewProps {
  salaries: Salarie[];
  evenements: EvenementPresence[];
  bulletins: BulletinPaie[];
  periodeActive: string;
  onCalculerTous: (periode: string) => void;
  onCloturerPeriode: (periode: string) => void;
  onVoirBulletin: (salarieId: string) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PayrollPreparationView: React.FC<PayrollPreparationViewProps> = ({
  salaries,
  evenements,
  bulletins,
  periodeActive,
  onCalculerTous,
  onCloturerPeriode,
  onVoirBulletin,
  showNotification
}) => {
  const bulletinsPeriode = bulletins.filter((b) => b.periodeMois === periodeActive);
  const estCloturee = bulletinsPeriode.length > 0 && bulletinsPeriode.every((b) => b.estSnapshotScelle);

  const handleLancerCalcul = () => {
    onCalculerTous(periodeActive);
  };

  const handleCloturer = () => {
    if (confirm(`Êtes-vous sûr de vouloir clôturer la paie du mois ${periodeActive} ? Les bulletins deviendront des instantanés scellés non modifiables.`)) {
      onCloturerPeriode(periodeActive);
    }
  };

  return (
    <div className="space-y-6">
      {/* Carte principale */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-[#16324F] text-white rounded">
                CYCLE DE PAIE MENSUEL
              </span>
              <span className="text-xs text-slate-500">Mois : <strong>{periodeActive}</strong></span>
              {estCloturee && (
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Période Clôturée &amp; Scellée
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#16324F] mt-1">Préparation &amp; Contrôle de la Paie</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidation des variables de pointage, vérification des assiettes sociales et fiscales marocaines
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!estCloturee ? (
              <>
                <button
                  onClick={handleLancerCalcul}
                  className="px-4 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Calculer les {salaries.length} bulletins</span>
                </button>
                {bulletinsPeriode.length > 0 && (
                  <button
                    onClick={handleCloturer}
                    className="px-4 py-2 bg-[#16324F] hover:bg-[#11273e] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Sceller définitivement la paie du mois"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Clôturer la période</span>
                  </button>
                )}
              </>
            ) : (
              <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tous les bulletins sont scellés</span>
              </div>
            )}
          </div>
        </div>

        {/* Rappel du déroulement du calcul de paie marocain */}
        <div className="mt-5 p-3.5 bg-[#F4F7FA] border border-slate-200 rounded-lg text-xs text-slate-600">
          <span className="font-bold text-[#16324F] block mb-1">Architecture déterministe du calcul :</span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 bg-white rounded border border-slate-200">
              <strong className="text-[#16324F] block">1. Brut Global</strong>
              Base (191h) - Retenues absences + Heures Sup + Prime Ancienneté (Art. 350) + Primes
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <strong className="text-[#16324F] block">2. Cotisations Salariales</strong>
              CNSS 4,48% (Plafonné à 6 000 MAD) + AMO 2,26% (Déplafonné)
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <strong className="text-[#16324F] block">3. Impôt sur le Revenu</strong>
              Frais pros (35%/25%) → SNI → Barème progressif CGI → Abattement famille (30 MAD/pers)
            </div>
            <div className="p-2 bg-white rounded border border-slate-200">
              <strong className="text-[#16324F] block">4. Net &amp; Coût Patronal</strong>
              Net = Brut - Cotisations - IR - Acomptes | Coût = Brut + Charges patronales (CNSS, TFP, AMO)
            </div>
          </div>
        </div>
      </div>

      {/* Tableau récapitulatif des variables préparées par salarié */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-[#16324F] uppercase tracking-wider">
            Pointage des variables de paie par collaborateur ({salaries.length})
          </span>
          <span className="text-[11px] text-slate-400">Période : {periodeActive}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#F4F7FA] text-slate-600 uppercase text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Salarié</th>
                <th className="py-3 px-4 text-right">Salaire Base</th>
                <th className="py-3 px-4 text-center">Heures Sup</th>
                <th className="py-3 px-4 text-center">Absences</th>
                <th className="py-3 px-4 text-center">Ancienneté</th>
                <th className="py-3 px-4 text-right">Brut Calculé</th>
                <th className="py-3 px-4 text-right">Net à Payer</th>
                <th className="py-3 px-4 text-center">État</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salaries.map((sal) => {
                const bull = bulletinsPeriode.find((b) => b.salarieId === sal.id);
                const evtsSal = evenements.filter(
                  (e) => e.salarieId === sal.id && e.dateDebut.startsWith(periodeActive) && e.statut === 'Approuvee'
                );

                const totalHSup = evtsSal
                  .filter((e) => e.type.startsWith('heures_sup'))
                  .reduce((sum, e) => sum + e.duree, 0);

                const totalAbs = evtsSal
                  .filter((e) => e.type === 'absence_injustifiee' || e.type === 'arret_maladie')
                  .reduce((sum, e) => sum + (e.unite === 'jours' ? e.duree * 8 : e.duree), 0);

                return (
                  <tr key={sal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{sal.nom} {sal.prenom}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{sal.matricule} · {sal.poste}</div>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">
                      {formatMAD(sal.salaireBaseMensuel)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {totalHSup > 0 ? (
                        <span className="font-bold text-[#149D92]">{totalHSup}h</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {totalAbs > 0 ? (
                        <span className="font-bold text-red-600">{totalAbs}h</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-slate-700">{bull ? `${bull.tauxAnciennete}%` : '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#16324F]">
                      {bull ? formatMAD(bull.salaireBrutGlobal) : 'À calculer'}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-700">
                      {bull ? formatMAD(bull.salaireNetAPayer) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {bull ? (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            bull.estSnapshotScelle
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-50 text-[#16324F]'
                          }`}
                        >
                          {bull.estSnapshotScelle ? 'Scellé' : bull.statut}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Non calculé</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onVoirBulletin(sal.id)}
                        className="p-1.5 text-slate-600 hover:text-[#149D92] hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1"
                        title="Consulter le bulletin de paie détaillé"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-[11px]">Détail</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
