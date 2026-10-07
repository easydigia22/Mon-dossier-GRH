import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import { deciderFormateur, fetchProfils, ProfilAdmin } from '../../services/adminService';
import type { StatutCompte } from '../../services/profile';

interface AdminViewProps {
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

const LIBELLE_STATUT: Record<StatutCompte, string> = {
  en_attente: 'En attente',
  approuve: 'Approuvé',
  refuse: 'Refusé',
  desactive: 'Désactivé'
};

const CLASSE_STATUT: Record<StatutCompte, string> = {
  en_attente: 'bg-amber-50 text-amber-800 border-amber-200',
  approuve: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  refuse: 'bg-red-50 text-red-800 border-red-200',
  desactive: 'bg-slate-100 text-slate-600 border-slate-300'
};

export const AdminView: React.FC<AdminViewProps> = ({ showNotification }) => {
  const [profils, setProfils] = useState<ProfilAdmin[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  // Refus en ligne plutôt qu'un window.prompt : une boîte de dialogue native bloque
  // la page, ne se teste pas et jure avec le reste de l'application.
  const [refusPour, setRefusPour] = useState<string | null>(null);
  const [motifSaisi, setMotifSaisi] = useState('');

  const recharger = () => {
    setChargement(true);
    fetchProfils()
      .then((p) => {
        setProfils(p);
        setErreur(null);
      })
      .catch((e) => setErreur(e instanceof Error ? e.message : String(e)))
      .finally(() => setChargement(false));
  };

  useEffect(recharger, []);

  const decider = async (profil: ProfilAdmin, decision: StatutCompte, motif?: string) => {
    setEnCours(profil.userId);
    try {
      await deciderFormateur(profil.userId, decision, motif);
      showNotification(`Compte ${profil.email} : ${LIBELLE_STATUT[decision].toLowerCase()}.`, 'success');
      setRefusPour(null);
      setMotifSaisi('');
      recharger();
    } catch (e) {
      showNotification(e instanceof Error ? e.message : String(e), 'error');
    } finally {
      setEnCours(null);
    }
  };

  const formateurs = profils.filter((p) => p.role === 'formateur');
  const enAttente = formateurs.filter((p) => p.statut === 'en_attente');
  const traites = formateurs.filter((p) => p.statut !== 'en_attente');

  const ligne = (p: ProfilAdmin) => (
    <li key={p.userId} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-[#1C2459] truncate">{p.email}</div>
        <div className="text-[10px] text-slate-400">
          Inscrit le {new Date(p.creeLe).toLocaleDateString('fr-FR')}
          {p.decideLe && ` · décidé le ${new Date(p.decideLe).toLocaleDateString('fr-FR')}`}
          {p.motifRefus && ` · motif : ${p.motifRefus}`}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${CLASSE_STATUT[p.statut]}`}>
          {LIBELLE_STATUT[p.statut]}
        </span>
        {enCours === p.userId ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <>
            {p.statut !== 'approuve' && (
              <button
                onClick={() => decider(p, 'approuve')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#149D92] hover:bg-[#11857c] text-white text-[11px] font-semibold rounded transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approuver
              </button>
            )}
            {p.statut !== 'refuse' && (
              <button
                onClick={() => {
                  setRefusPour(p.userId);
                  setMotifSaisi('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 text-[11px] font-semibold rounded transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Refuser
              </button>
            )}
            {p.statut === 'approuve' && (
              <button
                onClick={() => decider(p, 'en_attente')}
                className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
              >
                Révoquer
              </button>
            )}
          </>
        )}
      </div>

      {refusPour === p.userId && (
        <div className="w-full mt-2 flex flex-wrap items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <input
            type="text"
            value={motifSaisi}
            onChange={(e) => setMotifSaisi(e.target.value)}
            placeholder="Motif du refus (affiché au formateur)"
            className="flex-1 min-w-[12rem] px-2 py-1 text-[11px] border border-red-200 rounded"
          />
          <button
            onClick={() => decider(p, 'refuse', motifSaisi.trim() || undefined)}
            className="px-2.5 py-1 bg-[#D64545] hover:bg-[#b93a3a] text-white text-[11px] font-semibold rounded transition-colors"
          >
            Confirmer le refus
          </button>
          <button
            onClick={() => setRefusPour(null)}
            className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
          >
            Annuler
          </button>
        </div>
      )}
    </li>
  );

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
              Approuver, refuser ou révoquer les comptes formateurs de l'établissement
            </p>
          </div>
        </div>
        <p className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
          Une révocation ne supprime rien : le formateur perd l'accès et retombe sur l'écran
          d'attente. Ses groupes, ses stagiaires et leur travail restent en base.
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
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C2459] mb-2">
              Demandes en attente ({enAttente.length})
            </h2>
            {enAttente.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucune demande en attente.</p>
            ) : (
              <ul className="divide-y divide-slate-100">{enAttente.map(ligne)}</ul>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#1C2459] mb-2">
              Comptes formateurs ({traites.length})
            </h2>
            {traites.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun compte formateur traité pour le moment.</p>
            ) : (
              <ul className="divide-y divide-slate-100">{traites.map(ligne)}</ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};
