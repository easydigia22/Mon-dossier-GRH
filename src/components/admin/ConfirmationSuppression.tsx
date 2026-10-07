import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { apercuSuppression, ApercuSuppression, CompteAdmin, supprimerCompte } from '../../services/adminService';

interface ConfirmationSuppressionProps {
  compte: CompteAdmin;
  onAnnuler: () => void;
  onSupprime: () => void;
  onErreur: (message: string) => void;
}

export const ConfirmationSuppression: React.FC<ConfirmationSuppressionProps> = ({
  compte,
  onAnnuler,
  onSupprime,
  onErreur
}) => {
  const [apercu, setApercu] = useState<ApercuSuppression | null>(null);
  const [apercuEchoue, setApercuEchoue] = useState(false);
  const [saisie, setSaisie] = useState('');
  const [occupe, setOccupe] = useState(false);

  const chargerApercu = () => {
    setApercuEchoue(false);
    apercuSuppression(compte.userId)
      .then(setApercu)
      .catch((e) => {
        setApercuEchoue(true);
        onErreur(e instanceof Error ? e.message : String(e));
      });
  };

  useEffect(chargerApercu, [compte.userId]);

  // Recopier l'adresse oblige à regarder quelle ligne on vise : c'est la protection
  // contre l'erreur réelle, supprimer le mauvais compte d'une liste.
  const confirme = saisie.trim().toLowerCase() === compte.email.toLowerCase();

  const supprimer = async () => {
    setOccupe(true);
    try {
      await supprimerCompte(compte.userId);
      onSupprime();
    } catch (e) {
      onErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div className="w-full mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-3 space-y-2">
      <div className="flex items-start gap-2 text-[11px] text-red-900">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Suppression définitive, sans retour possible.</p>
          {apercuEchoue ? (
            <p className="text-red-700">
              Impossible de calculer ce qui sera effacé.{' '}
              <button onClick={chargerApercu} className="underline font-semibold">
                Réessayer
              </button>
            </p>
          ) : apercu === null ? (
            <p className="text-red-700">Calcul de ce qui sera effacé…</p>
          ) : (
            <p className="text-red-700">
              Seront effacés : {apercu.groupes} groupe(s), {apercu.bulletins} bulletin(s),{' '}
              {apercu.remises} remise(s).
              {apercu.stagiairesDetaches > 0 &&
                ` ${apercu.stagiairesDetaches} stagiaire(s) seront détachés et devront rejoindre une autre classe.`}
              {' '}Toutes les autres données du compte partent avec : salariés, contrats, présences,
              congés, procédures et paramètres.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder={`Saisissez ${compte.email} pour confirmer`}
          className="flex-1 min-w-[16rem] px-2 py-1 text-[11px] border border-red-200 rounded"
        />
        {occupe ? (
          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
        ) : (
          <>
            <button
              onClick={supprimer}
              disabled={!confirme || apercu === null}
              className="px-2.5 py-1 bg-[#D64545] hover:bg-[#b93a3a] text-white text-[11px] font-semibold rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Supprimer définitivement
            </button>
            <button
              onClick={onAnnuler}
              className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold rounded transition-colors"
            >
              Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
};
