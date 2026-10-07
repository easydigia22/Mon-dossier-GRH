import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ClasseAdmin, CompteAdmin, fetchClassesDe, reaffecterGroupe } from '../../services/adminService';

interface ReaffectationGroupesProps {
  formateur: CompteAdmin;
  /** Formateurs approuvés, hors celui-ci. */
  destinataires: CompteAdmin[];
  onAnnuler: () => void;
  onReaffecte: (nomDuGroupe: string) => void;
  onErreur: (message: string) => void;
}

export const ReaffectationGroupes: React.FC<ReaffectationGroupesProps> = ({
  formateur,
  destinataires,
  onAnnuler,
  onReaffecte,
  onErreur
}) => {
  const [groupes, setGroupes] = useState<ClasseAdmin[] | null>(null);
  const [choix, setChoix] = useState<Record<string, string>>({});
  const [occupe, setOccupe] = useState<string | null>(null);

  useEffect(() => {
    fetchClassesDe(formateur.userId)
      .then(setGroupes)
      .catch((e) => onErreur(e instanceof Error ? e.message : String(e)));
  }, [formateur.userId]);

  const reaffecter = async (groupe: ClasseAdmin) => {
    const destinataire = choix[groupe.id];
    if (!destinataire) return;
    setOccupe(groupe.id);
    try {
      await reaffecterGroupe(groupe.id, formateur.userId, destinataire);
      onReaffecte(groupe.nom);
    } catch (e) {
      onErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(null);
    }
  };

  return (
    <div className="w-full mt-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 space-y-2">
      <p className="text-[11px] font-semibold text-[#1C2459]">
        Confier un groupe de {formateur.email} à un autre formateur
      </p>

      {groupes === null && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}

      {groupes?.length === 0 && (
        <p className="text-[11px] text-slate-500 italic">Ce formateur ne possède aucun groupe.</p>
      )}

      {destinataires.length === 0 && (groupes?.length ?? 0) > 0 && (
        <p className="text-[11px] text-slate-500 italic">
          Aucun autre formateur approuvé ne peut recevoir ces groupes.
        </p>
      )}

      {groupes?.map((g) => (
        <div key={g.id} className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-700 flex-1 min-w-[8rem] truncate">{g.nom}</span>
          <select
            value={choix[g.id] ?? ''}
            onChange={(e) => setChoix((c) => ({ ...c, [g.id]: e.target.value }))}
            disabled={destinataires.length === 0}
            className="px-2 py-1 text-[11px] border border-slate-300 rounded disabled:bg-slate-100"
          >
            <option value="">Confier à…</option>
            {destinataires.map((d) => (
              <option key={d.userId} value={d.userId}>
                {d.email}
              </option>
            ))}
          </select>
          {occupe === g.id ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <button
              onClick={() => reaffecter(g)}
              disabled={!choix[g.id]}
              className="px-2.5 py-1 bg-[#149D92] hover:bg-[#11857c] text-white text-[11px] font-semibold rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confier
            </button>
          )}
        </div>
      ))}

      <button
        onClick={onAnnuler}
        className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
      >
        Fermer
      </button>
    </div>
  );
};
