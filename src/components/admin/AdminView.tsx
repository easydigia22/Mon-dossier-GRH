import React, { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import {
  CompteAdmin,
  deciderFormateur,
  desactiverCompte,
  fetchComptes
} from '../../services/adminService';
import type { StatutCompte } from '../../services/profile';
import { LigneCompte } from './LigneCompte';
import { ConfirmationSuppression } from './ConfirmationSuppression';
import { ReaffectationGroupes } from './ReaffectationGroupes';

interface AdminViewProps {
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

type Panneau = { type: 'suppression' | 'reaffectation' | 'refus'; userId: string } | null;

export const AdminView: React.FC<AdminViewProps> = ({ showNotification }) => {
  const [comptes, setComptes] = useState<CompteAdmin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [motifSaisi, setMotifSaisi] = useState('');

  const recharger = () => {
    setChargement(true);
    fetchComptes()
      .then((c) => {
        setComptes(c);
        setErreur(null);
      })
      .catch((e) => setErreur(e instanceof Error ? e.message : String(e)))
      .finally(() => setChargement(false));
  };

  useEffect(recharger, []);

  const agir = async (compte: CompteAdmin, action: () => Promise<void>, message: string) => {
    setOccupe(compte.userId);
    try {
      await action();
      showNotification(message, 'success');
      setPanneau(null);
      setMotifSaisi('');
      recharger();
    } catch (e) {
      showNotification(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setOccupe(null);
    }
  };

  const decider = (compte: CompteAdmin, decision: StatutCompte, motif?: string) =>
    agir(
      compte,
      () => deciderFormateur(compte.userId, decision, motif),
      `Compte ${compte.email} : décision enregistrée.`
    );

  const basculer = (compte: CompteAdmin, desactive: boolean) =>
    agir(
      compte,
      () => desactiverCompte(compte.userId, desactive),
      `Compte ${compte.email} : ${desactive ? 'désactivé' : 'réactivé'}.`
    );

  const formateurs = comptes.filter((c) => c.role === 'formateur');
  const enAttente = formateurs.filter((c) => c.statut === 'en_attente');
  const formateursTraites = formateurs.filter((c) => c.statut !== 'en_attente');
  const stagiaires = comptes.filter((c) => c.role === 'stagiaire');
  const formateursApprouves = formateurs.filter((c) => c.statut === 'approuve');

  const panneauDe = (compte: CompteAdmin): React.ReactNode => {
    if (panneau?.userId !== compte.userId) return null;

    if (panneau.type === 'refus') {
      return (
        <div className="w-full mt-2 flex flex-wrap items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <input
            type="text"
            value={motifSaisi}
            onChange={(e) => setMotifSaisi(e.target.value)}
            placeholder="Motif du refus (affiché au formateur)"
            className="flex-1 min-w-[12rem] px-2 py-1 text-[11px] border border-red-200 rounded"
          />
          <button
            onClick={() => decider(compte, 'refuse', motifSaisi.trim() || undefined)}
            className="px-2.5 py-1 bg-[#D64545] hover:bg-[#b93a3a] text-white text-[11px] font-semibold rounded transition-colors"
          >
            Confirmer le refus
          </button>
          <button
            onClick={() => setPanneau(null)}
            className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
          >
            Annuler
          </button>
        </div>
      );
    }

    if (panneau.type === 'suppression') {
      return (
        <ConfirmationSuppression
          compte={compte}
          onAnnuler={() => setPanneau(null)}
          onSupprime={() => {
            showNotification(`Compte ${compte.email} supprimé définitivement.`, 'success');
            setPanneau(null);
            recharger();
          }}
          onErreur={(m) => showNotification(m, 'error')}
        />
      );
    }

    return (
      <ReaffectationGroupes
        formateur={compte}
        destinataires={formateursApprouves.filter((f) => f.userId !== compte.userId)}
        onAnnuler={() => setPanneau(null)}
        onReaffecte={(nom) => {
          showNotification(`Groupe « ${nom} » réaffecté.`, 'success');
          setPanneau(null);
          recharger();
        }}
        onErreur={(m) => showNotification(m, 'error')}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-[#149D92]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1C2459]">Administration</h1>
            <p className="text-xs text-slate-500">
              Comptes de l'établissement : approbation, désactivation, groupes et suppression
            </p>
          </div>
        </div>
        <p className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
          La désactivation est réversible et ne supprime rien. La suppression, elle, est
          définitive : elle efface le compte et toutes ses données, sans récupération possible.
        </p>
      </div>

      {chargement && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[#1C2459]" />
        </div>
      )}

      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-xs">{erreur}</div>
      )}

      {!chargement && !erreur && (
        <>
          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C2459] mb-2">
              Demandes en attente ({enAttente.length})
            </h2>
            {enAttente.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucune demande en attente.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {enAttente.map((c) => (
                  <LigneCompte
                    key={c.userId}
                    compte={c}
                    occupe={occupe === c.userId}
                    onApprouver={() => decider(c, 'approuve')}
                    onRefuser={() => {
                      setMotifSaisi('');
                      setPanneau({ type: 'refus', userId: c.userId });
                    }}
                    onDesactiver={(d) => basculer(c, d)}
                    onSupprimer={() => setPanneau({ type: 'suppression', userId: c.userId })}
                    panneau={panneauDe(c)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C2459] mb-2">
              Formateurs ({formateursTraites.length})
            </h2>
            {formateursTraites.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun compte formateur traité pour le moment.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {formateursTraites.map((c) => (
                  <LigneCompte
                    key={c.userId}
                    compte={c}
                    occupe={occupe === c.userId}
                    onRevoquer={c.statut === 'approuve' ? () => decider(c, 'en_attente') : undefined}
                    onReaffecter={
                      (c.nbGroupes ?? 0) > 0
                        ? () => setPanneau({ type: 'reaffectation', userId: c.userId })
                        : undefined
                    }
                    onDesactiver={(d) => basculer(c, d)}
                    onSupprimer={() => setPanneau({ type: 'suppression', userId: c.userId })}
                    panneau={panneauDe(c)}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C2459] mb-2">Stagiaires ({stagiaires.length})</h2>
            {stagiaires.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun compte stagiaire.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stagiaires.map((c) => (
                  <LigneCompte
                    key={c.userId}
                    compte={c}
                    occupe={occupe === c.userId}
                    onDesactiver={(d) => basculer(c, d)}
                    onSupprimer={() => setPanneau({ type: 'suppression', userId: c.userId })}
                    panneau={panneauDe(c)}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};
