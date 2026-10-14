import React, { useState } from 'react';
import { FolderOpen, RefreshCw, Lock, Loader2, Building2 } from 'lucide-react';
import type { MembreClasseLive } from '../../types';
import { fetchDossierStagiaire, DossierStagiaire } from '../../services/dossierStagiaire';
import { formatMAD } from '../../services/exportService';
import { SectionDossier } from './SectionDossier';

interface DossierStagiaireViewProps {
  effectif: MembreClasseLive[];
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

/** Consultation en lecture seule du dossier de travail d'un stagiaire de la classe. */
export const DossierStagiaireView: React.FC<DossierStagiaireViewProps> = ({ effectif, showNotification }) => {
  const [userIdActif, setUserIdActif] = useState<string>('');
  const [dossier, setDossier] = useState<DossierStagiaire | null>(null);
  const [chargement, setChargement] = useState(false);

  const membre = effectif.find((m) => m.stagiaireUserId === userIdActif);

  const charger = async (userId: string) => {
    setChargement(true);
    try {
      setDossier(await fetchDossierStagiaire(userId));
    } catch {
      showNotification('Impossible de charger le dossier de ce stagiaire.', 'error');
      setDossier(null);
    } finally {
      setChargement(false);
    }
  };

  const handleSelection = (userId: string) => {
    setUserIdActif(userId);
    if (userId) charger(userId);
    else setDossier(null);
  };

  const dateFr = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-[#149D92]" />
          <h3 className="text-sm font-bold text-[#1C2459]">Dossier de travail d'un stagiaire</h3>
        </div>

        {effectif.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aucun stagiaire n'a encore rejoint cette classe avec son propre compte. Communiquez-leur le code d'invitation.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={userIdActif}
              onChange={(e) => handleSelection(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">— Choisir un stagiaire —</option>
              {effectif.map((m) => (
                <option key={m.stagiaireUserId} value={m.stagiaireUserId}>
                  {m.prenom} {m.nom}{m.matricule ? ` (${m.matricule})` : ''}
                </option>
              ))}
            </select>
            {membre && (
              <button
                type="button"
                onClick={() => charger(membre.stagiaireUserId)}
                className="text-xs flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Rafraîchir
              </button>
            )}
          </div>
        )}
      </div>

      {chargement && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#1C2459]" />
        </div>
      )}

      {!chargement && dossier && membre && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-900">
            <Lock className="w-3.5 h-3.5" />
            <span>
              Lecture seule — dossier de <strong>{membre.prenom} {membre.nom}</strong> · chargé à {dateFr(dossier.chargeLe)}
            </span>
          </div>

          <SectionDossier
            titre="Entreprise"
            ouvertParDefaut
            vide={!dossier.entreprise}
            messageVide="Ce stagiaire n'a pas encore créé son entreprise."
          >
            {dossier.entreprise && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Building2 className="w-4 h-4 text-[#149D92]" />
                  <strong className="text-sm">{dossier.entreprise.raisonSociale}</strong>
                </div>
                <div>Forme : {dossier.entreprise.formeJuridique}</div>
                <div>Ville : {dossier.entreprise.ville}</div>
                <div>ICE : {dossier.entreprise.ice}</div>
                <div>N° CNSS : {dossier.entreprise.numeroCNSS}</div>
                <div>Secteur : {dossier.entreprise.secteur}</div>
                <div>Représentant : {dossier.entreprise.representantLegal}</div>
              </div>
            )}
          </SectionDossier>

          <SectionDossier titre="Salariés" compteur={dossier.salaries.length} vide={dossier.salaries.length === 0}
            messageVide="Aucun salarié saisi.">
            <ul className="space-y-1 text-slate-700">
              {dossier.salaries.map((s) => (
                <li key={s.id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{s.prenom} {s.nom}{s.matricule ? ` · ${s.matricule}` : ''}</span>
                  <span className="text-slate-500">{s.poste ?? ''}</span>
                </li>
              ))}
            </ul>
          </SectionDossier>

          <SectionDossier titre="Contrats" compteur={dossier.contrats.length} vide={dossier.contrats.length === 0}
            messageVide="Aucun contrat saisi.">
            <ul className="space-y-1 text-slate-700">
              {dossier.contrats.map((c) => (
                <li key={c.id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{c.type ?? 'Contrat'} · {c.poste ?? ''}</span>
                  <span className="text-slate-500">{c.dateEffet ?? ''}</span>
                </li>
              ))}
            </ul>
          </SectionDossier>

          <SectionDossier titre="Présences" compteur={dossier.evenementsPresence.length}
            vide={dossier.evenementsPresence.length === 0} messageVide="Aucun événement de présence.">
            <ul className="space-y-1 text-slate-700">
              {dossier.evenementsPresence.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{e.type ?? 'Événement'}</span>
                  <span className="text-slate-500">{e.periodeMois ?? ''}</span>
                </li>
              ))}
            </ul>
          </SectionDossier>

          <SectionDossier titre="Congés" compteur={dossier.demandesConges.length}
            vide={dossier.demandesConges.length === 0} messageVide="Aucune demande de congé.">
            <ul className="space-y-1 text-slate-700">
              {dossier.demandesConges.map((d) => (
                <li key={d.id} className="border-b border-slate-100 py-1">{d.type ?? 'Congé'} — {d.statut ?? ''}</li>
              ))}
            </ul>
          </SectionDossier>

          <SectionDossier titre="Bulletins" compteur={dossier.bulletins.length}
            vide={dossier.bulletins.length === 0} messageVide="Aucun bulletin calculé.">
            <ul className="space-y-1 text-slate-700">
              {dossier.bulletins.map((b) => (
                <li key={b.id} className="flex justify-between border-b border-slate-100 py-1">
                  <span>{b.salarieNomPrenom} · {b.periodeMois}</span>
                  <span className="font-mono text-[#149D92]">{formatMAD(b.salaireNetAPayer)}</span>
                </li>
              ))}
            </ul>
          </SectionDossier>
        </div>
      )}
    </div>
  );
};
