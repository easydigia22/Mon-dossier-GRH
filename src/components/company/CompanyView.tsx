import React, { useState } from 'react';
import { Building2, Save, FileCheck, Info, CheckCircle2 } from 'lucide-react';
import { Entreprise } from '../../types';

interface CompanyViewProps {
  entreprise: Entreprise;
  onSaveEntreprise: (ent: Entreprise) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CompanyView: React.FC<CompanyViewProps> = ({
  entreprise,
  onSaveEntreprise,
  showNotification
}) => {
  const [formData, setFormData] = useState<Entreprise>(entreprise);
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEntreprise(formData);
    setIsEditing(false);
    showNotification("Fiche de l'entreprise mise à jour.", 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#16324F] text-white flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#16324F]">{entreprise.raisonSociale}</h1>
              <p className="text-xs text-slate-500">
                Entreprise marocaine support de simulation · Secteur privé non agricole
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-xs font-semibold bg-[#16324F] text-white rounded-lg hover:bg-[#11273e] transition-colors"
              >
                Modifier la fiche
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* Note pédagogique sur les obligations d'identification légale au Maroc */}
        <div className="my-4 p-3 bg-[#F4F7FA] border border-slate-200 rounded-lg flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#149D92] shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600">
            <strong>Rappel réglementaire (Droit marocain des affaires) :</strong> Toute entreprise du secteur privé est identifiée par son Registre du Commerce (RC), sa Taxe Professionnelle (Patente), son numéro d'affiliation CNSS et son Identifiant Commun de l'Entreprise (ICE à 15 chiffres). Ces identifiants doivent figurer sur tous les bulletins de paie et documents administratifs (Art. 370 Code du Travail).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne 1 : Identité & Immatriculation */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                Identité Juridique
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Raison Sociale</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.raisonSociale}
                  onChange={(e) => setFormData({ ...formData, raisonSociale: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Forme Juridique</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.formeJuridique}
                  onChange={(e) => setFormData({ ...formData, formeJuridique: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Activité &amp; Secteur</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.secteur}
                  onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Siège social</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.siegeSocial}
                    onChange={(e) => setFormData({ ...formData, siegeSocial: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                  />
                </div>
              </div>
            </div>

            {/* Colonne 2 : Immatriculations officielles fictives */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                Immatriculations Administratives (Fictives)
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Identifiant Commun de l'Entreprise (ICE)
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.ice}
                  onChange={(e) => setFormData({ ...formData, ice: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">N° Affiliation CNSS</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.numeroCNSS}
                    onChange={(e) => setFormData({ ...formData, numeroCNSS: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Registre du Commerce (RC)</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.registreCommerce}
                    onChange={(e) => setFormData({ ...formData, registreCommerce: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">N° Patente (Taxe Pro)</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.patente}
                    onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Représentant Légal</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={formData.representantLegal}
                    onChange={(e) => setFormData({ ...formData, representantLegal: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Horaire légal mensuel moyen</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={formData.horaireMensuelMoyen}
                    onChange={(e) => setFormData({ ...formData, horaireMensuelMoyen: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                  />
                  <span className="text-[10px] text-slate-500">191h standard (Art. 184)</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Horaire hebdomadaire</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={formData.horaireHebdo}
                    onChange={(e) => setFormData({ ...formData, horaireHebdo: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white disabled:bg-slate-50 disabled:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#149D92]"
                  />
                  <span className="text-[10px] text-slate-500">44h / semaine</span>
                </div>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#149D92] hover:bg-[#11857c] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer les modifications</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
