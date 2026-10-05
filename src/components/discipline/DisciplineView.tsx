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
    </div>
  );
};
