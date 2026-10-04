import React, { useEffect, useState } from 'react';
import { Award, Download, Upload, Users, Plus, CheckCircle2, FileText, Settings2, FileSpreadsheet, Radio, Loader2, Pencil, RefreshCw } from 'lucide-react';
import { ClassePedagogique, MissionExercice, TentativeExercice } from '../../types';
import { exporterJSON } from '../../services/exportService';
import { cloudEnabled } from '../../services/cloudSync';
import { fetchAllTentativesLive, saveCorrectionLive, TentativeLive } from '../../services/trainerLive';

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

  // Suivi en direct des tentatives de tous les stagiaires (via Supabase, policies formateur)
  const [tentativesLive, setTentativesLive] = useState<TentativeLive[]>([]);
  const [chargementLive, setChargementLive] = useState(false);
  const [erreurLive, setErreurLive] = useState<string | null>(null);
  const [editionOuverte, setEditionOuverte] = useState<TentativeLive | null>(null);
  const [brouillonCorrection, setBrouillonCorrection] = useState<NonNullable<TentativeExercice['correction']> | null>(null);

  const chargerTentativesLive = async () => {
    setChargementLive(true);
    setErreurLive(null);
    try {
      setTentativesLive(await fetchAllTentativesLive());
    } catch (e: any) {
      setErreurLive(e.message || 'Chargement impossible.');
    } finally {
      setChargementLive(false);
    }
  };

  useEffect(() => {
    if (cloudEnabled) chargerTentativesLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ouvrirEdition = (item: TentativeLive) => {
    setEditionOuverte(item);
    setBrouillonCorrection(
      item.tentative.correction || {
        noteDossier: 0,
        noteRegles: 0,
        noteCalculs: 0,
        noteControles: 0,
        noteTotaleSur20: 0,
        commentairesFormateur: '',
        detailsEcarts: []
      }
    );
  };

  const handleEnregistrerCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editionOuverte || !brouillonCorrection) return;
    const noteTotale =
      Number(brouillonCorrection.noteDossier) +
      Number(brouillonCorrection.noteRegles) +
      Number(brouillonCorrection.noteCalculs) +
      Number(brouillonCorrection.noteControles);
    const correction = { ...brouillonCorrection, noteTotaleSur20: noteTotale };
    try {
      await saveCorrectionLive(editionOuverte.userId, editionOuverte.tentative, correction);
      showNotification('Correction enregistrée et transmise au stagiaire.', 'success');
      setEditionOuverte(null);
      chargerTentativesLive();
    } catch (e: any) {
      showNotification(`Échec de l'enregistrement : ${e.message}`, 'error');
    }
  };

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

      {/* Suivi en direct des remises (Supabase) */}
      {cloudEnabled && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-[#16324F] text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#149D92]" />
              <span>Suivi en direct des stagiaires</span>
            </h3>
            <button
              type="button"
              onClick={chargerTentativesLive}
              disabled={chargementLive}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#16324F] bg-slate-100 hover:bg-slate-200 rounded transition-colors disabled:opacity-50"
            >
              {chargementLive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Actualiser</span>
            </button>
          </div>

          <p className="text-slate-600">
            Les missions soumises par tous les stagiaires connectés à ce projet apparaissent ici automatiquement, sans import manuel.
          </p>

          {erreurLive && <p className="text-[#D64545]">{erreurLive}</p>}

          {!chargementLive && tentativesLive.length === 0 && !erreurLive && (
            <p className="text-slate-400 italic">Aucune remise pour le moment.</p>
          )}

          {tentativesLive.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="py-1.5 pr-2">Stagiaire</th>
                    <th className="py-1.5 pr-2">Mission</th>
                    <th className="py-1.5 pr-2">Remise le</th>
                    <th className="py-1.5 pr-2">Note / 20</th>
                    <th className="py-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {tentativesLive.map((item) => {
                    const mission = missions.find((m) => m.id === item.tentative.missionId);
                    return (
                      <tr key={`${item.userId}-${item.tentative.id}`} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2 pr-2 font-semibold text-slate-800">{item.tentative.stagiaireNom}</td>
                        <td className="py-2 pr-2 text-slate-600">
                          {mission ? `Mission ${mission.numero} — ${mission.titre}` : item.tentative.missionId}
                        </td>
                        <td className="py-2 pr-2 text-slate-500">
                          {item.tentative.dateRemise ? new Date(item.tentative.dateRemise).toLocaleString('fr-FR') : '—'}
                        </td>
                        <td className="py-2 pr-2 font-bold text-[#149D92]">
                          {item.tentative.correction ? `${item.tentative.correction.noteTotaleSur20.toFixed(1)}/20` : 'Non noté'}
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => ouvrirEdition(item)}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#16324F] bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Corriger</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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

      {/* Modal Correction d'une tentative (suivi en direct) */}
      {editionOuverte && brouillonCorrection && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleEnregistrerCorrection}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-[#16324F]">
                Corriger — {editionOuverte.tentative.stagiaireNom}
              </h3>
              <button type="button" onClick={() => setEditionOuverte(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {([
                ['noteDossier', 'Dossier et pièces (/4)', 4],
                ['noteRegles', 'Justification des règles (/4)', 4],
                ['noteCalculs', 'Exactitude des calculs (/8)', 8],
                ['noteControles', 'Contrôles de cohérence (/4)', 4]
              ] as const).map(([champ, label, max]) => (
                <label key={champ} className="block">
                  <span className="block font-medium text-slate-700 mb-1">{label}</span>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    step="0.5"
                    value={brouillonCorrection[champ]}
                    onChange={(e) => setBrouillonCorrection({ ...brouillonCorrection, [champ]: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded"
                  />
                </label>
              ))}
            </div>

            <label className="block">
              <span className="block font-medium text-slate-700 mb-1">Commentaire du formateur</span>
              <textarea
                rows={4}
                value={brouillonCorrection.commentairesFormateur}
                onChange={(e) => setBrouillonCorrection({ ...brouillonCorrection, commentairesFormateur: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg leading-relaxed"
              />
            </label>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <span className="text-slate-500">
                Total actuel :{' '}
                <strong className="text-[#149D92]">
                  {(
                    Number(brouillonCorrection.noteDossier) +
                    Number(brouillonCorrection.noteRegles) +
                    Number(brouillonCorrection.noteCalculs) +
                    Number(brouillonCorrection.noteControles)
                  ).toFixed(1)}
                  /20
                </strong>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditionOuverte(null)}
                  className="px-3 py-1.5 text-slate-700 bg-slate-100 rounded"
                >
                  Annuler
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#149D92] text-white font-semibold rounded hover:bg-[#11857c]">
                  Enregistrer la correction
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

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
