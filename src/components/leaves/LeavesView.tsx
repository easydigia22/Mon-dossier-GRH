import React, { useState } from 'react';
import { CalendarDays, Plus, CheckCircle2, XCircle, Info, HeartHandshake, ShieldCheck } from 'lucide-react';
import { DemandeConge, Salarie, StatutWorkflow } from '../../types';
import { formatDateJJMMAAAA } from '../../services/exportService';

interface LeavesViewProps {
  demandes: DemandeConge[];
  salaries: Salarie[];
  onSaveDemande: (d: DemandeConge) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const LeavesView: React.FC<LeavesViewProps> = ({
  demandes,
  salaries,
  onSaveDemande,
  showNotification
}) => {
  const [modalOuverte, setModalOuverte] = useState(false);
  const [nouvelleDemande, setNouvelleDemande] = useState<Partial<DemandeConge> | null>(null);

  const handleNouveau = () => {
    setNouvelleDemande({
      id: `dc-${Date.now()}`,
      salarieId: salaries[0]?.id || '',
      type: 'annuel',
      dateDepart: '2025-02-10',
      dateRetour: '2025-02-15',
      nombreJoursOuvrables: 6,
      soldeAvant: 18,
      soldeApres: 12,
      statut: 'Approuvee',
      motif: 'Congé annuel légal payé',
      dateDemande: new Date().toISOString().split('T')[0],
      avisResponsable: 'Favorable, continuité de service assurée'
    });
    setModalOuverte(true);
  };

  const handleEnregistrer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouvelleDemande || !nouvelleDemande.salarieId) {
      showNotification('Veuillez sélectionner un salarié.', 'error');
      return;
    }
    onSaveDemande(nouvelleDemande as DemandeConge);
    setModalOuverte(false);
    setNouvelleDemande(null);
  };

  const getLibelleTypeConge = (type: string) => {
    switch (type) {
      case 'annuel':
        return 'Congé Annuel Payé (Art. 231)';
      case 'mariage':
        return 'Mariage du salarié (4 jours légaux rémunérés - Art. 274)';
      case 'naissance':
        return 'Naissance d\'un enfant (3 jours rémunérés - Art. 269)';
      case 'deces':
        return 'Décès familial (3 jours légaux - Art. 274)';
      case 'circoncision':
        return 'Circoncision (2 jours légaux - Art. 274)';
      case 'maladie':
        return 'Arrêt maladie justifié';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#16324F]">Congés Annuels, Exceptionnels &amp; Maladies</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestion des droits acquis (1,5 j/mois), décompte en jours ouvrables et événements familiaux rémunérés
            </p>
          </div>
          <button
            onClick={handleNouveau}
            className="px-3.5 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle demande</span>
          </button>
        </div>

        {/* Rappel juridique sur le congé annuel et les congés exceptionnels */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-[#F4F7FA] border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#16324F]">
              <CalendarDays className="w-4 h-4 text-[#149D92]" />
              <span>Congé Annuel Payé (Articles 231 à 268)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              • Acquisition : 1,5 jour de travail effectif par mois de service (soit 18 jours ouvrables par an).<br />
              • Ouverture du droit : après 6 mois de service continu dans l'entreprise.<br />
              • Décompte en <strong>jours ouvrables</strong> : tous les jours sauf les dimanches et jours fériés chômés.
            </p>
          </div>

          <div className="p-3.5 bg-[#F4F7FA] border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#16324F]">
              <HeartHandshake className="w-4 h-4 text-[#149D92]" />
              <span>Congés Exceptionnels Rémunérés (Articles 269 &amp; 274)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              • Mariage du salarié : 4 jours payés.<br />
              • Naissance d'un enfant : 3 jours payés.<br />
              • Décès d'un conjoint ou enfant : 3 jours payés.<br />
              <em>Ces congés ne réduisent pas le solde de congé annuel payé !</em>
            </p>
          </div>
        </div>
      </div>

      {/* Tableau des demandes de congés */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-[#16324F] uppercase tracking-wider">
            Historique des demandes &amp; autorisations ({demandes.length})
          </span>
          <span className="text-[11px] text-slate-400">Circuit légal d'approbation employeur</span>
        </div>

        <div className="divide-y divide-slate-100">
          {demandes.map((d) => {
            const sal = salaries.find((s) => s.id === d.salarieId);
            return (
              <div
                key={d.id}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                      {getLibelleTypeConge(d.type)}
                    </span>
                    <span className="font-bold text-[#16324F]">
                      {sal ? `${sal.nom} ${sal.prenom} (${sal.matricule})` : 'Inconnu'}
                    </span>
                  </div>

                  <div className="text-slate-600">
                    <strong>Période demandée :</strong> du {formatDateJJMMAAAA(d.dateDepart)} au {formatDateJJMMAAAA(d.dateRetour)} ({d.nombreJoursOuvrables} jours ouvrables)
                  </div>

                  <div className="text-[11px] text-slate-500">
                    <strong>Motif :</strong> {d.motif} {d.avisResponsable && `· Avis : ${d.avisResponsable}`}
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500">
                      Solde avant : <strong>{d.soldeAvant} j</strong>
                    </div>
                    <div className="text-xs font-bold text-[#149D92]">
                      Solde après : {d.soldeApres} j
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                      d.statut === 'Approuvee'
                        ? 'bg-emerald-50 text-emerald-700'
                        : d.statut === 'Refusee'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {d.statut === 'Approuvee' ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                    {d.statut}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal saisie demande de congé */}
      {modalOuverte && nouvelleDemande && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleEnregistrer}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-sm font-bold text-[#16324F]">Nouvelle demande de congé</h3>
              <button
                type="button"
                onClick={() => setModalOuverte(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Salarié demandeur</label>
                <select
                  value={nouvelleDemande.salarieId || ''}
                  onChange={(e) => setNouvelleDemande({ ...nouvelleDemande, salarieId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded"
                >
                  {salaries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.matricule} - {s.nom} {s.prenom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Type de congé</label>
                <select
                  value={nouvelleDemande.type || 'annuel'}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    let nbJours = 6;
                    if (t === 'mariage') nbJours = 4;
                    if (t === 'naissance') nbJours = 3;
                    if (t === 'deces') nbJours = 3;
                    if (t === 'circoncision') nbJours = 2;

                    const soldeAv = nouvelleDemande.soldeAvant || 18;
                    // Les congés exceptionnels ne déduisent pas le congé annuel
                    const soldeAp = t === 'annuel' ? soldeAv - nbJours : soldeAv;

                    setNouvelleDemande({
                      ...nouvelleDemande,
                      type: t,
                      nombreJoursOuvrables: nbJours,
                      soldeApres: Math.max(0, soldeAp)
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded font-semibold"
                >
                  <option value="annuel">Congé annuel payé (Art. 231)</option>
                  <option value="mariage">Mariage du salarié (4 jours légaux payés)</option>
                  <option value="naissance">Naissance d'un enfant (3 jours légaux payés)</option>
                  <option value="deces">Décès d'un proche (3 jours légaux payés)</option>
                  <option value="circoncision">Circoncision d'un enfant (2 jours)</option>
                  <option value="maladie">Arrêt maladie</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date de départ</label>
                  <input
                    type="date"
                    required
                    value={nouvelleDemande.dateDepart || ''}
                    onChange={(e) => setNouvelleDemande({ ...nouvelleDemande, dateDepart: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date de reprise</label>
                  <input
                    type="date"
                    required
                    value={nouvelleDemande.dateRetour || ''}
                    onChange={(e) => setNouvelleDemande({ ...nouvelleDemande, dateRetour: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jours ouvrables</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={nouvelleDemande.nombreJoursOuvrables || 0}
                    onChange={(e) => {
                      const nb = Number(e.target.value);
                      const soldeAv = nouvelleDemande.soldeAvant || 18;
                      const soldeAp = nouvelleDemande.type === 'annuel' ? soldeAv - nb : soldeAv;
                      setNouvelleDemande({
                        ...nouvelleDemande,
                        nombreJoursOuvrables: nb,
                        soldeApres: Math.max(0, soldeAp)
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Solde avant (j)</label>
                  <input
                    type="number"
                    value={nouvelleDemande.soldeAvant || 18}
                    onChange={(e) =>
                      setNouvelleDemande({ ...nouvelleDemande, soldeAvant: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Solde après (j)</label>
                  <input
                    type="number"
                    value={nouvelleDemande.soldeApres || 12}
                    readOnly
                    className="w-full px-3 py-1.5 border border-slate-200 rounded bg-slate-100 font-bold text-[#149D92]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Motif</label>
                <input
                  type="text"
                  required
                  value={nouvelleDemande.motif || ''}
                  onChange={(e) => setNouvelleDemande({ ...nouvelleDemande, motif: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Décision de la direction</label>
                <select
                  value={nouvelleDemande.statut || 'Approuvee'}
                  onChange={(e) => setNouvelleDemande({ ...nouvelleDemande, statut: e.target.value as StatutWorkflow })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded"
                >
                  <option value="Brouillon">Brouillon</option>
                  <option value="Soumise">Soumise</option>
                  <option value="Approuvee">Approuvée</option>
                  <option value="Refusee">Refusée</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOuverte(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-[#149D92] text-white rounded-lg hover:bg-[#11857c]"
              >
                Enregistrer la décision
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
