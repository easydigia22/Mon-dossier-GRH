import React from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { CompteAdmin } from '../../services/adminService';
import type { StatutCompte } from '../../services/profile';

export const LIBELLE_STATUT: Record<StatutCompte, string> = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  refuse: 'Refusé',
  desactive: 'Désactivé'
};

export const CLASSE_STATUT: Record<StatutCompte, string> = {
  en_attente: 'bg-amber-50 text-amber-800 border-amber-200',
  approuve: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  refuse: 'bg-red-50 text-red-800 border-red-200',
  desactive: 'bg-slate-100 text-slate-600 border-slate-300'
};

interface LigneCompteProps {
  compte: CompteAdmin;
  occupe: boolean;
  onApprouver?: () => void;
  onRefuser?: () => void;
  onRevoquer?: () => void;
  onDesactiver: (desactive: boolean) => void;
  onReaffecter?: () => void;
  onSupprimer: () => void;
  /** Panneau ouvert sous la ligne (suppression ou réaffectation). */
  panneau?: React.ReactNode;
}

export const LigneCompte: React.FC<LigneCompteProps> = ({
  compte,
  occupe,
  onApprouver,
  onRefuser,
  onRevoquer,
  onDesactiver,
  onReaffecter,
  onSupprimer,
  panneau
}) => {
  const desactive = compte.statut === 'desactive';

  return (
    <li className="py-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-[#1C2459] truncate">{compte.email}</div>
        <div className="text-[10px] text-slate-400">
          Inscrit le {new Date(compte.creeLe).toLocaleDateString('fr-FR')}
          {compte.nbGroupes !== undefined && ` · ${compte.nbGroupes} groupe(s)`}
          {compte.classeRejointe && ` · ${compte.classeRejointe}`}
          {compte.motifRefus && ` · motif : ${compte.motifRefus}`}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${CLASSE_STATUT[compte.statut]}`}>
          {LIBELLE_STATUT[compte.statut]}
        </span>

        {occupe ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <>
            {onApprouver && (
              <button
                onClick={onApprouver}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#149D92] hover:bg-[#11857c] text-white text-[11px] font-semibold rounded transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approuver
              </button>
            )}
            {onRefuser && (
              <button
                onClick={onRefuser}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-[11px] font-semibold rounded transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Refuser
              </button>
            )}
            {onRevoquer && (
              <button
                onClick={onRevoquer}
                className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
              >
                Révoquer
              </button>
            )}
            {onReaffecter && (
              <button
                onClick={onReaffecter}
                className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
              >
                Réaffecter un groupe
              </button>
            )}
            <button
              onClick={() => onDesactiver(!desactive)}
              className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
            >
              {desactive ? 'Réactiver' : 'Désactiver'}
            </button>
            {/* En retrait : la suppression ne sert qu'aux effacements et aux erreurs. */}
            <button
              onClick={onSupprimer}
              className="px-2.5 py-1 text-[11px] font-semibold text-[#D64545] hover:underline"
            >
              Supprimer
            </button>
          </>
        )}
      </div>

      {panneau}
    </li>
  );
};
