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
        </>
      )}
    </div>
  );
};
