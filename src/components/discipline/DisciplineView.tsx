import React from 'react';
import { DemandeConge, Entreprise, ProcedureDisciplinaire, Salarie } from '../../types';

interface DisciplineViewProps {
  salaries: Salarie[];
  demandesConges: DemandeConge[];
  procedures: ProcedureDisciplinaire[];
  onSaveProcedure: (p: ProcedureDisciplinaire) => void;
  onDeleteProcedure: (id: string) => void;
  entreprise: Entreprise;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const DisciplineView: React.FC<DisciplineViewProps> = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <p className="text-sm text-slate-500">Module Discipline &amp; Licenciement — en construction.</p>
    </div>
  );
};
