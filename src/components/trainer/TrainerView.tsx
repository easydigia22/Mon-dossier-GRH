import React, { useState } from 'react';
import { Award, Download, Upload, Users, Plus, CheckCircle2, FileText, Settings2, FileSpreadsheet } from 'lucide-react';
import { ClassePedagogique, MissionExercice, TentativeExercice } from '../../types';
import { exporterJSON } from '../../services/exportService';

interface TrainerViewProps {
  classes: ClassePedagogique[];
  setClasses: React.Dispatch<React.SetStateAction<ClassePedagogique[]>>;
  missions: MissionExercice[];
  tentatives: TentativeExercice[];
  periodeActive: string;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const TrainerView: React.FC<TrainerViewProps> = ({
  classes,
  setClasses,
  missions,
  tentatives,
  periodeActive,
  showNotification
}) => {
  const [classeActiveId, setClasseActiveId] = useState<string>(classes[0]?.id || '');
  const [modalClasseOuverte, setModalClasseOuverte] = useState(false);
  const [nouvelleClasse, setNouvelleClasse] = useState<Partial<ClassePedagogique>>({
    nom: 'TSGE 1 - Groupe A',
    anneeScolaire: '2024 / 2025',
    formateurNom: 'Formateur OFPPT',
    etablissement: 'ISTA Guéliz Marrakech',
    stagiaires: [
      { matricule: 'STG-01', nom: 'EL AMRANI', prenom: 'Youssef' },
      { matricule: 'STG-02', nom: 'BENKIRANE', prenom: 'Meryem' }
    ]
  });

  const classeActive = classes.find((c) => c.id === classeActiveId) || classes[0];

  const handleAjouterClasse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouvelleClasse.nom) return;
    const c: ClassePedagogique = {
      id: `cls-${Date.now()}`,
      nom: nouvelleClasse.nom,
      anneeScolaire: nouvelleClasse.anneeScolaire || '2024 / 2025',
      formateurNom: nouvelleClasse.formateurNom || 'Formateur OFPPT',
      etablissement: nouvelleClasse.etablissement || 'ISTA OFPPT',
      stagiaires: nouvelleClasse.stagiaires || []
    };
    setClasses([...classes, c]);
    setClasseActiveId(c.id);
    setModalClasseOuverte(false);
    showNotification(`Classe « ${c.nom} » créée.`, 'success');
  };

  const handleExporterPaquetExercice = (mission: MissionExercice) => {
    const paquet = {
      type: 'PAQUET_MISSION_OFPPT',
      version: '1.0',
      dateExport: new Date().toISOString(),
      classe: classeActive,
      periodeActive,
      mission
    };
    exporterJSON(paquet, `Mission_${mission.numero}_${classeActive?.nom.replace(/\s+/g, '_')}`);
    showNotification(`Paquet d'exercice Mission ${mission.numero} exporté.`, 'success');
  };

  const handleImporterRemises = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        showNotification('Remise stagiaire importée avec succès.', 'success');
      } catch (err) {
        showNotification('Format de fichier JSON de remise invalide.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* En-tête Espace Formateur */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#16324F] text-white flex items-center justify-center">
              <Award className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#16324F]">Espace Formateur &amp; Évaluation</h1>
              <p className="text-xs text-slate-500">
                Gestion des groupes stagiaires, exportation des paquets d'exercices et consolidation des notes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalClasseOuverte(true)}
              className="px-3.5 py-2 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une classe</span>
            </button>
          </div>
        </div>

        {/* Sélecteur de classe */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Groupe / Classe active :</span>
            <select
              value={classeActiveId}
              onChange={(e) => setClasseActiveId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-[#16324F] bg-slate-50"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.anneeScolaire}) - {c.etablissement}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500">
            Formateur en charge : <strong>{classeActive?.formateurNom}</strong>
          </div>
        </div>
      </div>

      {/* Cartes d'action formateur */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colonne 1 : Exporter des paquets d'exercices vers les stagiaires */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-[#16324F] text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-[#149D92]" />
              <span>Exporter un paquet d'exercice (JSON)</span>
            </h3>
            <span className="text-[10px] text-slate-400">Pour distribution USB / Classroom</span>
          </div>

          <p className="text-slate-600 text-xs">
            Sélectionnez une mission à exporter. Le fichier JSON généré contient le scénario, les données de l'entreprise fictive, les pièces et la grille de notation :
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {missions.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-slate-800 truncate">
                    Mission {m.numero} : {m.titre}
                  </div>
                  <div className="text-[10px] text-slate-400">{m.competences[0]}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleExporterPaquetExercice(m)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[#149D92] bg-teal-50 hover:bg-teal-100 rounded transition-colors whitespace-nowrap"
                >
                  Télécharger paquet
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne 2 : Importer les remises stagiaires & Corriger */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-[#16324F] text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#149D92]" />
              <span>Importer les copies remises par les stagiaires</span>
            </h3>
            <span className="text-[10px] text-slate-400">Fichier de remise JSON</span>
          </div>

          <p className="text-slate-600 text-xs">
            Importez les travaux enregistrés par les apprenants pour visualiser leurs calculs, leurs justifications et attribuer l'évaluation finale :
          </p>

          <label className="border-2 border-dashed border-slate-300 hover:border-[#149D92] rounded-xl p-6 text-center block cursor-pointer transition-colors bg-slate-50">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <span className="font-semibold text-slate-700 block">Cliquez pour charger une copie remise (.json)</span>
            <span className="text-[11px] text-slate-400 block mt-1">Paquet de remise conforme</span>
            <input type="file" accept=".json" onChange={handleImporterRemises} className="hidden" />
          </label>

          <div className="p-3 bg-[#F4F7FA] border border-slate-200 rounded-lg text-slate-600 space-y-1">
            <strong className="block text-[#16324F]">Copies déjà enregistrées en local ({tentatives.length}) :</strong>
            {tentatives.length === 0 ? (
              <span className="text-slate-400 italic">Aucune tentative remise pour le moment.</span>
            ) : (
              <ul className="list-disc pl-4 space-y-0.5">
                {tentatives.map((t) => (
                  <li key={t.id}>
                    {t.stagiaireNom} — Note : <strong>{t.correction?.noteTotaleSur20 || '-'}/20</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal Création de classe */}
      {modalClasseOuverte && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAjouterClasse}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 text-xs"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-[#16324F]">Créer un nouveau groupe / classe</h3>
              <button
                type="button"
                onClick={() => setModalClasseOuverte(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Nom de la classe (ex: TSGE 2 - Gr B)</label>
              <input
                type="text"
                required
                value={nouvelleClasse.nom || ''}
                onChange={(e) => setNouvelleClasse({ ...nouvelleClasse, nom: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Établissement OFPPT</label>
              <input
                type="text"
                value={nouvelleClasse.etablissement || ''}
                onChange={(e) => setNouvelleClasse({ ...nouvelleClasse, etablissement: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Nom du Formateur</label>
              <input
                type="text"
                value={nouvelleClasse.formateurNom || ''}
                onChange={(e) => setNouvelleClasse({ ...nouvelleClasse, formateurNom: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalClasseOuverte(false)}
                className="px-3 py-1.5 text-slate-700 bg-slate-100 rounded"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#149D92] text-white font-semibold rounded hover:bg-[#11857c]"
              >
                Enregistrer la classe
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
