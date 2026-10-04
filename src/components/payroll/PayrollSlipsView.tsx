import React, { useState } from 'react';
import {
  Receipt,
  Printer,
  Download,
  Info,
  CheckCircle2,
  Lock,
  ChevronRight,
  User,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { BulletinPaie, Entreprise, Salarie } from '../../types';
import { formatMAD, formatDateJJMMAAAA, genererBulletinPDF } from '../../services/exportService';

interface PayrollSlipsViewProps {
  entreprise: Entreprise;
  salaries: Salarie[];
  bulletins: BulletinPaie[];
  periodeActive: string;
  selectedSalarieId?: string;
  onSelectSalarie: (id: string) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PayrollSlipsView: React.FC<PayrollSlipsViewProps> = ({
  entreprise,
  salaries,
  bulletins,
  periodeActive,
  selectedSalarieId,
  onSelectSalarie,
  showNotification
}) => {
  const [ongletDetail, setOngletDetail] = useState<'bulletin' | 'explications'>('bulletin');

  const salarieActifId = selectedSalarieId || salaries[0]?.id;
  const salarieActif = salaries.find((s) => s.id === salarieActifId);

  const bulletinActif = bulletins.find(
    (b) => b.salarieId === salarieActifId && b.periodeMois === periodeActive
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!bulletinActif) return;
    genererBulletinPDF(bulletinActif, entreprise.raisonSociale);
    showNotification('Téléchargement du bulletin de paie PDF démarré.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Barre de contrôle et sélection */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1C2459]">Bulletin de Paie Individuel</h1>
              <p className="text-xs text-slate-500">
                Période : <strong>{periodeActive}</strong> · Moteur déterministe certifié sans IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Boutons d'export */}
            <button
              onClick={handlePrint}
              disabled={!bulletinActif}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer A4</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!bulletinActif}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#149D92] hover:bg-[#11857c] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger PDF</span>
            </button>
          </div>
        </div>

        {/* Sélecteur de salarié et onglets d'affichage */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Choisir un salarié :</span>
            <select
              value={salarieActifId || ''}
              onChange={(e) => onSelectSalarie(e.target.value)}
              className="text-xs font-semibold text-[#1C2459] px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
            >
              {salaries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.matricule} - {s.nom} {s.prenom} ({s.poste})
                </option>
              ))}
            </select>
          </div>

          {/* Bascule Bulletin officiel vs Explications pas-à-pas */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setOngletDetail('bulletin')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                ongletDetail === 'bulletin'
                  ? 'bg-white text-[#1C2459] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Format Bulletin Conforme
            </button>
            <button
              onClick={() => setOngletDetail('explications')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors flex items-center gap-1 ${
                ongletDetail === 'explications'
                  ? 'bg-white text-[#149D92] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Détail pédagogique &amp; Formules</span>
            </button>
          </div>
        </div>
      </div>

      {!bulletinActif ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Aucun bulletin calculé pour ce salarié en {periodeActive}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Rendez-vous dans le module « Préparation paie » et cliquez sur « Calculer les bulletins ».
          </p>
        </div>
      ) : ongletDetail === 'bulletin' ? (
        /* FORMAT DU BULLETIN CONFORME A4 */
        <div className="bg-white border border-slate-300 rounded-xl p-8 max-w-4xl mx-auto shadow-md print:shadow-none print:border-none print:p-0">
          {/* En-tête officiel du bulletin */}
          <div className="border-b-2 border-[#1C2459] pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-base font-extrabold text-[#1C2459] uppercase tracking-wide">
                  {entreprise.raisonSociale}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">{entreprise.siegeSocial}, {entreprise.ville}</p>
                <div className="text-[10px] text-slate-500 mt-1 font-mono space-x-2">
                  <span>RC: {entreprise.registreCommerce}</span>
                  <span>·</span>
                  <span>Patente: {entreprise.patente}</span>
                  <span>·</span>
                  <span>CNSS: {entreprise.numeroCNSS}</span>
                  <span>·</span>
                  <span>ICE: {entreprise.ice}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-[#1C2459] text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  BULLETIN DE PAIE
                </div>
                <div className="text-xs font-bold text-slate-800 mt-1">
                  Période : {bulletinActif.periodeMois}
                </div>
                <div className="text-[10px] text-slate-400">
                  {bulletinActif.estSnapshotScelle ? '🔒 Bulletin Clôturé & Scellé' : 'Statut : ' + bulletinActif.statut}
                </div>
              </div>
            </div>

            {/* Mention légale obligatoire */}
            <div className="mt-3 text-[10px] text-slate-500 italic bg-[#F4F7FA] p-1.5 rounded text-center border border-slate-200">
              Simulation pédagogique — données fictives — ne vaut pas validation juridique.
            </div>
          </div>

          {/* Cartouche Salarié & Contrat */}
          <div className="grid grid-cols-2 gap-4 bg-[#F4F7FA] border border-slate-200 rounded-lg p-4 text-xs mb-6">
            <div className="space-y-1">
              <div>
                <span className="text-slate-500">Salarié : </span>
                <strong className="text-slate-900">{bulletinActif.salarieNomPrenom}</strong>
              </div>
              <div>
                <span className="text-slate-500">Matricule : </span>
                <span className="font-mono font-bold text-[#1C2459]">{bulletinActif.salarieMatricule}</span>
              </div>
              <div>
                <span className="text-slate-500">CIN Fictive : </span>
                <span className="font-mono text-slate-800">{salarieActif?.cinFictif}</span>
              </div>
              <div>
                <span className="text-slate-500">N° CNSS Fictif : </span>
                <span className="font-mono text-slate-800">{salarieActif?.cnssFictif}</span>
              </div>
              <div>
                <span className="text-slate-500">Situation familiale : </span>
                <span className="capitalize">{salarieActif?.situationFamiliale} · {salarieActif?.nombrePersonnesACharge} pers. à charge</span>
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <span className="text-slate-500">Emploi / Poste : </span>
                <strong className="text-slate-900">{bulletinActif.poste}</strong>
              </div>
              <div>
                <span className="text-slate-500">Date d'embauche : </span>
                <span className="tabular-nums">{formatDateJJMMAAAA(salarieActif?.dateEmbauche)}</span>
              </div>
              <div>
                <span className="text-slate-500">Ancienneté : </span>
                <span>{bulletinActif.ancienneteAnnees} an(s) (Taux prime: {bulletinActif.tauxAnciennete}%)</span>
              </div>
              <div>
                <span className="text-slate-500">Horaire mensuel : </span>
                <span>{bulletinActif.heuresNormales}h normales ({bulletinActif.joursTravailles} jours déclarés)</span>
              </div>
              <div>
                <span className="text-slate-500">Paiement : </span>
                <span className="font-mono text-[11px] truncate block">{salarieActif?.ribFictif}</span>
              </div>
            </div>
          </div>

          {/* Tableau des rubriques */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C2459] text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Rubrique</th>
                  <th className="py-2.5 px-3 text-right">Base</th>
                  <th className="py-2.5 px-3 text-right">Taux</th>
                  <th className="py-2.5 px-3 text-right">Gains (MAD)</th>
                  <th className="py-2.5 px-3 text-right">Retenues (MAD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bulletinActif.lignes.map((l, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{l.code}</td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-800">{l.libelle}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{l.explicationFormule}</div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                      {l.base ? l.base.toFixed(2) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                      {l.taux ? `${l.taux}%` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {l.nature === 'gain' ? l.montant.toFixed(2) : ''}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-red-700">
                      {l.nature === 'retenue' ? l.montant.toFixed(2) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Récapitulatif des masses, cotisations et impôts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#F4F7FA] p-4 rounded-lg border border-slate-200 mb-6">
            <div>
              <span className="text-slate-500 block text-[11px]">Salaire Brut Global</span>
              <strong className="text-slate-900 font-mono tabular-nums">{formatMAD(bulletinActif.salaireBrutGlobal)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Assiette CNSS (Plaf. 6000)</span>
              <strong className="text-slate-900 font-mono tabular-nums">{formatMAD(bulletinActif.assietteCNSSPlafonnee)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Frais Professionnels</span>
              <strong className="text-slate-900 font-mono tabular-nums">{formatMAD(bulletinActif.fraisProfessionnels)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Salaire Net Imposable</span>
              <strong className="text-slate-900 font-mono tabular-nums">{formatMAD(bulletinActif.salaireNetImposable)}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Cotisations Salariales (CNSS+AMO)</span>
              <strong className="text-red-700 font-mono tabular-nums">{formatMAD(bulletinActif.totalCotisationsSalariales)}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Tranche IR Barème CGI</span>
              <span className="font-semibold text-slate-800">{bulletinActif.trancheIR}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Charges Famille (30 MAD/p)</span>
              <span className="font-semibold text-emerald-700">{formatMAD(bulletinActif.deductionChargesFamille)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">IR Net Précompté</span>
              <strong className="text-red-700 font-mono tabular-nums">{formatMAD(bulletinActif.irNet)}</strong>
            </div>
          </div>

          {/* Encadré Net à payer */}
          <div className="bg-[#149D92] text-white p-4 rounded-xl flex items-center justify-between mb-6 shadow-sm">
            <div>
              <span className="text-xs uppercase tracking-wider text-teal-100 font-bold block">
                Net à payer au salarié (MAD)
              </span>
              <span className="text-[11px] text-teal-100">Virement bancaire irrévocable</span>
            </div>
            <div className="text-2xl font-black font-mono tracking-tight tabular-nums">
              {formatMAD(bulletinActif.salaireNetAPayer)}
            </div>
          </div>

          {/* Charges patronales et mentions de bas de page */}
          <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              <span>Charges patronales : <strong>{formatMAD(bulletinActif.totalCotisationsPatronales)}</strong></span>
              <span className="mx-2">·</span>
              <span>Coût global employeur : <strong>{formatMAD(bulletinActif.coutTotalEmployeur)}</strong></span>
            </div>
            <div>
              <span>Règles appliquées : {bulletinActif.versionReglesUtilisee}</span>
            </div>
          </div>
        </div>
      ) : (
        /* ONGLET PÉDAGOGIQUE : EXPLICATIONS DÉTAILLÉES DES FORMULES */
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-[#149D92] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm">Mode d'explication pédagogique pas-à-pas</strong>
              Ce volet détaille chaque étape du calcul mathématique et juridique conformément au Code du Travail marocain et au Code Général des Impôts (CGI). Aucun montant n'est généré par intelligence artificielle : chaque calcul est rigoureusement déterministe.
            </div>
          </div>

          <div className="space-y-3">
            {bulletinActif.explicationsPedagogiques.map((exp, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-[#1C2459] flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#1C2459] text-white flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{exp.titre}</span>
                  </h4>
                  <span className="text-[11px] font-mono text-[#149D92] bg-teal-50 px-2 py-0.5 rounded">
                    {exp.referenceCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-[#F4F7FA] p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Formule théorique</span>
                    <code className="text-xs text-[#1C2459] font-mono font-semibold block">{exp.formule}</code>
                  </div>
                  <div className="bg-[#F4F7FA] p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Application numérique</span>
                    <code className="text-xs text-slate-800 font-mono block">{exp.valeurs}</code>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {exp.explication}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
