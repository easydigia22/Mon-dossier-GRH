import React from 'react';
import { Sliders, Download, Upload, RotateCcw, ShieldCheck, CheckCircle2, Info, BookOpen, AlertTriangle } from 'lucide-react';
import { RegleParametreJuridique } from '../../types';
import { exporterJSON } from '../../services/exportService';

interface SettingsViewProps {
  regles: RegleParametreJuridique[];
  onResetDemo: () => void;
  fullAppState: any;
  onRestoreState: (state: any) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  regles,
  onResetDemo,
  fullAppState,
  onRestoreState,
  showNotification
}) => {
  const handleExportBackup = () => {
    exporterJSON(fullAppState, `Sauvegarde_MonDossierAdministratif_${new Date().toISOString().split('T')[0]}`);
    showNotification('Sauvegarde JSON complète téléchargée.', 'success');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Attention : restaurer une sauvegarde remplacera toutes les données actuelles. Confirmez-vous ?')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data || !data.salaries || !data.entreprise) {
          throw new Error('Structure de fichier invalide');
        }
        onRestoreState(data);
        showNotification('Sauvegarde restaurée avec succès.', 'success');
      } catch (err) {
        showNotification('Fichier de sauvegarde invalide ou corrompu.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#16324F] text-white flex items-center justify-center">
              <Sliders className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#16324F]">Paramètres Juridiques, Fiscaux &amp; Sauvegardes</h1>
              <p className="text-xs text-slate-500">
                Sources officielles vérifiées du droit du travail et de la paie marocaine · Gestion locale des données
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#149D92] hover:bg-[#11857c] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Exporter sauvegarde (JSON)</span>
            </button>
          </div>
        </div>

        {/* Panneau de sauvegarde / restauration */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-[#F4F7FA] border border-slate-200 rounded-lg space-y-2">
            <strong className="block font-bold text-[#16324F]">Restauration d'une sauvegarde</strong>
            <p className="text-slate-600">
              Chargez un fichier JSON précédemment exporté pour reprendre votre travail sur n'importe quel ordinateur :
            </p>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded cursor-pointer hover:bg-slate-50 font-medium">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Sélectionner le fichier de sauvegarde (.json)</span>
              <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
            </label>
          </div>

          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg space-y-2 text-red-900">
            <strong className="block font-bold text-red-950 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-red-700" />
              <span>Réinitialisation de la démonstration</span>
            </strong>
            <p className="text-[11px] leading-relaxed">
              Efface les modifications locales et restaure les 12 salariés et les événements originaux de la SARL Atlas.
            </p>
            <button
              onClick={onResetDemo}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-xs transition-colors"
            >
              Réinitialiser la copie démo
            </button>
          </div>
        </div>
      </div>

      {/* Registre des règles juridiques vérifiées */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-[#16324F] uppercase tracking-wider">
              Référentiel des Textes Légaux &amp; Sociaux Marocains ({regles.length} règles vérifiées)
            </h2>
            <p className="text-[11px] text-slate-500">
              Code du Travail (Loi 65-99), Dahir CNSS 1-72-184, Loi AMO 65-00 et Code Général des Impôts (CGI Art. 73)
            </p>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sources Officielles</span>
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {regles.map((r) => (
            <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    {r.domaine}
                  </span>
                  <h3 className="font-bold text-sm text-[#16324F]">{r.intitule}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#149D92] font-semibold bg-teal-50 px-2 py-0.5 rounded">
                    {r.sourceExacte}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Validé
                  </span>
                </div>
              </div>

              <div className="bg-[#F4F7FA] p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-900 font-semibold">
                Formule / Barème : {r.valeurOuFormule}
              </div>

              <p className="text-slate-600 text-xs leading-relaxed">
                {r.descriptionDetaillee}
              </p>

              <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                <span>Population : {r.populationConcernee}</span>
                <span>·</span>
                <span>Date de consultation : {r.dateConsultation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
