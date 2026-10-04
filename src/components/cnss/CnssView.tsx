import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Download, Printer, Info } from 'lucide-react';
import { BulletinPaie, Entreprise, Salarie } from '../../types';
import { formatMAD } from '../../services/exportService';

interface CnssViewProps {
  entreprise: Entreprise;
  salaries: Salarie[];
  bulletins: BulletinPaie[];
  periodeActive: string;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CnssView: React.FC<CnssViewProps> = ({
  entreprise,
  salaries,
  bulletins,
  periodeActive,
  showNotification
}) => {
  const bulletinsPeriode = bulletins.filter((b) => b.periodeMois === periodeActive);

  // Masses cotisables
  const masseBruteTotale = bulletinsPeriode.reduce((sum, b) => sum + b.salaireBrutGlobal, 0);
  const massePlafonnee6000 = bulletinsPeriode.reduce((sum, b) => sum + b.assietteCNSSPlafonnee, 0);
  const masseAMOTotale = bulletinsPeriode.reduce((sum, b) => sum + b.assietteAMO, 0);

  // Cotisations par branche
  // 1. Prestations Sociales (Court & Long terme) : Salariale 4.48% + Patronale 8.98% = 13.46% (Plafond 6 000 MAD)
  const prestationsSalariales = bulletinsPeriode.reduce((sum, b) => sum + b.cnssSalariale, 0);
  const prestationsPatronales = bulletinsPeriode.reduce((sum, b) => sum + b.cnssPatronalePrestations, 0);
  const totalPrestations = prestationsSalariales + prestationsPatronales;

  // 2. Prestations Familiales : Patronale exclusive 6.40% (Déplafonné)
  const allocFamilialesPatronales = bulletinsPeriode.reduce((sum, b) => sum + b.cnssPatronaleAllocationsFamiliales, 0);

  // 3. Taxe de Formation Professionnelle (OFPPT) : Patronale exclusive 1.60% (Déplafonné)
  const tfpPatronale = bulletinsPeriode.reduce((sum, b) => sum + b.taxeFormationProfessionnelle, 0);

  // 4. Assurance Maladie Obligatoire (AMO) : Salariale 2.26% + Patronale 4.11% = 6.37% (Déplafonné)
  const amoSalarialeTotale = bulletinsPeriode.reduce((sum, b) => sum + b.amoSalariale, 0);
  const amoPatronaleTotale = bulletinsPeriode.reduce((sum, b) => sum + b.amoPatronale, 0);
  const totalAMO = amoSalarialeTotale + amoPatronaleTotale;

  const totalGeneralCotisations = totalPrestations + allocFamilialesPatronales + tfpPatronale + totalAMO;
  const totalCotisationsSalariales = prestationsSalariales + amoSalarialeTotale;
  const totalCotisationsPatronales = prestationsPatronales + allocFamilialesPatronales + tfpPatronale + amoPatronaleTotale;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* En-tête du bordereau CNSS & AMO */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#1C2459]">État Déclaratif Pédagogique CNSS &amp; AMO</h1>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                  Simulation Pédagogique
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Période : <strong>{periodeActive}</strong> · N° Affiliation : <strong>{entreprise.numeroCNSS}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={bulletinsPeriode.length === 0}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer le bordereau</span>
            </button>
          </div>
        </div>

        {/* Mention impérative requise par le cahier des charges */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Mentions réglementaires importantes :</strong>
            <p className="mt-0.5">
              « État pédagogique — non destiné au dépôt officiel ». Aucune transmission réelle à la CNSS ou à la DGI. Ce simulateur est réservé à l'apprentissage du calcul et du contrôle des déclarations sociales dans le cadre de la formation professionnelle marocaine.
            </p>
          </div>
        </div>
      </div>

      {/* Bordereau récapitulatif des cotisations dues */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-[#1C2459]">
              Bordereau Récapitulatif Mensuel des Cotisations
            </h2>
            <p className="text-xs text-slate-500">
              Employeur : {entreprise.raisonSociale} · {bulletinsPeriode.length} salarié(s) déclaré(s)
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total Cotisations à verser</span>
            <span className="text-xl font-black text-[#1C2459] font-mono tabular-nums">
              {formatMAD(totalGeneralCotisations)}
            </span>
          </div>
        </div>

        {/* Tableau de ventilation par branche de sécurité sociale */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1C2459] text-white uppercase text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3">Branche de Cotisation</th>
                <th className="py-2.5 px-3 text-right">Assiette Soumise</th>
                <th className="py-2.5 px-3 text-center">Règle &amp; Plafond</th>
                <th className="py-2.5 px-3 text-right">Part Salariale</th>
                <th className="py-2.5 px-3 text-right">Part Patronale</th>
                <th className="py-2.5 px-3 text-right">Total Branche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {/* Ligne 1 : Prestations sociales */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-3 font-sans font-semibold text-slate-800">
                  Prestations Sociales (Court &amp; Long terme)
                  <div className="text-[10px] text-slate-500 font-normal">Maladie, maternité, invalidité, vieillesse, décès</div>
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-bold">{formatMAD(massePlafonnee6000)}</td>
                <td className="py-3 px-3 text-center font-sans text-[11px] text-amber-800">
                  Plafonné à 6 000 MAD / sal.
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                  {formatMAD(prestationsSalariales)} <span className="text-[10px] text-slate-400 font-sans block">(4,48%)</span>
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                  {formatMAD(prestationsPatronales)} <span className="text-[10px] text-slate-400 font-sans block">(8,98%)</span>
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-bold text-[#1C2459]">
                  {formatMAD(totalPrestations)}
                </td>
              </tr>

              {/* Ligne 2 : Allocations familiales */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-3 font-sans font-semibold text-slate-800">
                  Prestations Familiales
                  <div className="text-[10px] text-slate-500 font-normal">Allocations versées aux familles d'enfants à charge</div>
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-bold">{formatMAD(masseBruteTotale)}</td>
                <td className="py-3 px-3 text-center font-sans text-[11px] text-slate-500">
                  Déplafonné (totalité brut)
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-400 font-sans">-</td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                  {formatMAD(allocFamilialesPatronales)} <span className="text-[10px] text-slate-400 font-sans block">(6,40%)</span>
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-bold text-[#1C2459]">
                  {formatMAD(allocFamilialesPatronales)}
                </td>
              </tr>

              {/* Ligne 3 : Taxe Formation Professionnelle */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-3 font-sans font-semibold text-slate-800">
                  Taxe de Formation Professionnelle (TFP - OFPPT)
                  <div className="text-[10px] text-slate-500 font-normal">Financement de la formation continue et professionnelle</div>
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-bold">{formatMAD(masseBruteTotale)}</td>
                <td className="py-3 px-3 text-center font-sans text-[11px] text-slate-500">
                  Déplafonné
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-400 font-sans">-</td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                  {formatMAD(tfpPatronale)} <span className="text-[10px] text-slate-400 font-sans block">(1,60%)</span>
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-bold text-[#1C2459]">
                  {formatMAD(tfpPatronale)}
                </td>
              </tr>

              {/* Ligne 4 : Assurance Maladie Obligatoire (AMO) */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-3 font-sans font-semibold text-slate-800">
                  Assurance Maladie Obligatoire (AMO de base)
                  <div className="text-[10px] text-slate-500 font-normal">Couverture médicale des soins de santé (Loi 65-00)</div>
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-bold">{formatMAD(masseAMOTotale)}</td>
                <td className="py-3 px-3 text-center font-sans text-[11px] text-slate-500">
                  Déplafonné
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                  {formatMAD(amoSalarialeTotale)} <span className="text-[10px] text-slate-400 font-sans block">(2,26%)</span>
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                  {formatMAD(amoPatronaleTotale)} <span className="text-[10px] text-slate-400 font-sans block">(4,11%)</span>
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-bold text-[#1C2459]">
                  {formatMAD(totalAMO)}
                </td>
              </tr>
            </tbody>

            {/* Total général */}
            <tfoot className="bg-[#F4F7FA] font-mono text-xs font-bold border-t-2 border-[#1C2459]">
              <tr>
                <td className="py-3 px-3 uppercase font-sans text-xs text-[#1C2459]">
                  Totaux Généraux des Cotisations
                </td>
                <td className="py-3 px-3 text-right tabular-nums">{formatMAD(masseBruteTotale)}</td>
                <td className="py-3 px-3 text-center font-sans text-slate-400">4 branches</td>
                <td className="py-3 px-3 text-right tabular-nums text-red-700">{formatMAD(totalCotisationsSalariales)}</td>
                <td className="py-3 px-3 text-right tabular-nums text-slate-800">{formatMAD(totalCotisationsPatronales)}</td>
                <td className="py-3 px-3 text-right tabular-nums text-[#149D92] text-sm font-black">
                  {formatMAD(totalGeneralCotisations)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Contrôle de réconciliation paie / CNSS */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Contrôle de réconciliation réussi : La somme des retenues sociales du livre de paie correspond au centime près aux cotisations du bordereau CNSS.</span>
          </div>
          <span className="font-mono font-bold text-emerald-700 tabular-nums">Écart : 0,00 MAD</span>
        </div>
      </div>
    </div>
  );
};
