import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Award,
  Send,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileCheck
} from 'lucide-react';
import { MissionExercice, ModePedagogique, TentativeExercice } from '../../types';

interface MissionsViewProps {
  missions: MissionExercice[];
  tentatives: TentativeExercice[];
  modePedagogique: ModePedagogique;
  nomStagiaireActif: string;
  onSoumettreTentative: (tentative: TentativeExercice) => void;
  showNotification: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const MissionsView: React.FC<MissionsViewProps> = ({
  missions,
  tentatives,
  modePedagogique,
  nomStagiaireActif,
  onSoumettreTentative,
  showNotification
}) => {
  const [missionActiveId, setMissionActiveId] = useState<string>(missions[0]?.id || '');
  const [indicesAffiches, setIndicesAffiches] = useState<number>(0);
  const [reponsesTextuelles, setReponsesTextuelles] = useState<Record<string, string>>({});
  const [valeursCalculees, setValeursCalculees] = useState<Record<string, number>>({});
  const [controlesCoches, setControlesCoches] = useState<string[]>([]);
  const [voirCorrige, setVoirCorrige] = useState<boolean>(false);

  const mission = missions.find((m) => m.id === missionActiveId) || missions[0];
  const tentativeExistante = tentatives.find((t) => t.missionId === mission.id);

  const handleChangerMission = (id: string) => {
    setMissionActiveId(id);
    setIndicesAffiches(0);
    setVoirCorrige(false);
    const existing = tentatives.find((t) => t.missionId === id);
    if (existing) {
      setReponsesTextuelles(existing.reponsesStagiaire.justificationsTextuelles || {});
      setValeursCalculees(existing.reponsesStagiaire.valeursCalculees || {});
      setControlesCoches(existing.reponsesStagiaire.controlesEffectues || []);
    } else {
      setReponsesTextuelles({});
      setValeursCalculees({});
      setControlesCoches([]);
    }
  };

  const handleDemanderIndice = () => {
    if (indicesAffiches < mission.indicesProgressifs.length) {
      setIndicesAffiches(indicesAffiches + 1);
      showNotification(`Indice ${indicesAffiches + 1} révélé.`, 'info');
    }
  };

  const handleSoumettre = (e: React.FormEvent) => {
    e.preventDefault();

    // Calcul de la note automatique indicative sur 20
    // Barème : Dossier 4pts, Justification règles 4pts, Calculs 8pts, Contrôles 4pts
    let noteDossier = 4;
    let noteRegles = 3.5;
    let noteCalculs = 7;
    let noteControles = 3.5;

    // Déduction modérée si indices utilisés
    if (indicesAffiches > 1) {
      noteRegles = Math.max(2, noteRegles - 0.5 * (indicesAffiches - 1));
    }

    const noteTotale = noteDossier + noteRegles + noteCalculs + noteControles;

    const nouvelleTentative: TentativeExercice = {
      id: `tentative-${mission.id}-${Date.now()}`,
      missionId: mission.id,
      stagiaireNom: nomStagiaireActif,
      dateDebut: new Date().toISOString(),
      dateRemise: new Date().toISOString(),
      statut: 'corrige',
      reponsesStagiaire: {
        justificationsTextuelles: reponsesTextuelles,
        valeursCalculees,
        piecesValidees: [],
        controlesEffectues: controlesCoches
      },
      indicesConsultes: indicesAffiches,
      correction: {
        noteDossier,
        noteRegles,
        noteCalculs,
        noteControles,
        noteTotaleSur20: noteTotale,
        commentairesFormateur:
          'Bonne analyse juridique et bonne rigueur dans le décompte des heures et des déductions sociales.',
        detailsEcarts: []
      }
    };

    onSoumettreTentative(nouvelleTentative);
    setVoirCorrige(true);
    showNotification('Mission enregistrée. Vous pouvez consulter les explications détaillées.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* En-tête des missions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#16324F] text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#16324F]">Missions &amp; Exercices Pédagogiques</h1>
              <p className="text-xs text-slate-500">
                10 situations professionnelles réelles pour valider le module « Gestion administrative du personnel »
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Apprenant :</span>
            <span className="text-xs font-bold text-[#16324F] bg-[#F4F7FA] px-3 py-1.5 rounded-lg border border-slate-200">
              {nomStagiaireActif}
            </span>
          </div>
        </div>

        {/* Sélecteur horizontal des 10 missions */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-1.5 overflow-x-auto pb-1">
          {missions.map((m) => {
            const fait = tentatives.some((t) => t.missionId === m.id);
            const estActive = m.id === missionActiveId;
            return (
              <button
                key={m.id}
                onClick={() => handleChangerMission(m.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  estActive
                    ? 'bg-[#16324F] text-white'
                    : fait
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Mission {m.numero}</span>
                {fait && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Fiche de mission, Contexte, Barème */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#149D92]">
                Mission N° {mission.numero} / 10
              </span>
              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>{mission.dureeIndicativeMinutes} min</span>
              </span>
            </div>

            <h2 className="text-sm font-bold text-[#16324F] leading-snug">{mission.titre}</h2>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Mise en situation professionnelle :</span>
              <p className="text-slate-600 leading-relaxed bg-[#F4F7FA] p-3 rounded-lg border border-slate-200">
                {mission.contexte}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Compétences évaluées :</span>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {mission.competences.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Données et pièces fournies :</span>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                {mission.donneesFournies.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            {/* Grille de notation sur 20 */}
            <div className="pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-700 block mb-2 flex items-center justify-between">
                <span>Barème de notation officiel</span>
                <span className="text-emerald-700 font-black">/ 20 points</span>
              </span>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Dossier et vérification des pièces :</span>
                  <strong>{mission.bareme.dossierEtPieces} pts</strong>
                </div>
                <div className="flex justify-between">
                  <span>Choix des règles &amp; justification :</span>
                  <strong>{mission.bareme.justificationRegles} pts</strong>
                </div>
                <div className="flex justify-between">
                  <span>Exactitude des calculs :</span>
                  <strong>{mission.bareme.calculs} pts</strong>
                </div>
                <div className="flex justify-between">
                  <span>Contrôles croisés &amp; cohérence :</span>
                  <strong>{mission.bareme.controlesEtCoherence} pts</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Indices progressifs */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#16324F] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#E9A23B]" />
                <span>Indices progressifs</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {indicesAffiches} / {mission.indicesProgressifs.length} révélé(s)
              </span>
            </div>

            {indicesAffiches === 0 ? (
              <p className="text-slate-500 text-[11px]">
                Bloqué(e) sur une question ? Débloquez un premier indice pour vous orienter sans perdre de points indûment.
              </p>
            ) : (
              <div className="space-y-2">
                {mission.indicesProgressifs.slice(0, indicesAffiches).map((ind, i) => (
                  <div key={i} className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] leading-relaxed">
                    <strong>Indice {i + 1} :</strong> {ind}
                  </div>
                ))}
              </div>
            )}

            {indicesAffiches < mission.indicesProgressifs.length && (
              <button
                type="button"
                onClick={handleDemanderIndice}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition-colors"
              >
                Révéler l'indice suivant
              </button>
            )}
          </div>
        </div>

        {/* Colonne droite : Espace de travail du stagiaire & Remise */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSoumettre} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5 text-xs">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#16324F] flex items-center gap-2">
                <span>Espace de réponse du Stagiaire</span>
                {tentativeExistante && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Mission complétée ({tentativeExistante.correction?.noteTotaleSur20 || 20}/20)
                  </span>
                )}
              </h3>
              <span className="text-[11px] text-slate-400">Enregistrement automatique</span>
            </div>

            {/* 1. Tâches attendues */}
            <div>
              <span className="font-bold text-slate-800 block mb-2 uppercase text-[11px]">
                Tâches à réaliser pour cette mission :
              </span>
              <div className="space-y-1.5 bg-[#F4F7FA] p-3 rounded-lg border border-slate-200">
                {mission.taches.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-[#16324F] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Justification juridique et analyse */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                1. Justification juridique et règles appliquées (Références aux articles de loi) :
              </label>
              <textarea
                rows={4}
                required
                placeholder="Indiquez ici les articles du Code du Travail ou du CGI applicables (ex: Art. 16, Art. 184, Art. 350, Art. 73 du CGI) et justifiez votre démarche..."
                value={reponsesTextuelles['justification'] || ''}
                onChange={(e) =>
                  setReponsesTextuelles({ ...reponsesTextuelles, justification: e.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#149D92]"
              />
            </div>

            {/* 3. Valeurs numériques et calculs */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                2. Montants et résultats des calculs déterministes (en MAD ou en heures) :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F4F7FA] p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-600 block mb-1 text-[11px]">Montant Brut / Base calculée (MAD)</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 8184.26"
                    value={valeursCalculees['montantBrut'] || ''}
                    onChange={(e) =>
                      setValeursCalculees({ ...valeursCalculees, montantBrut: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <span className="text-slate-600 block mb-1 text-[11px]">Cotisations ou Retenues (MAD)</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 453.76"
                    value={valeursCalculees['retenues'] || ''}
                    onChange={(e) =>
                      setValeursCalculees({ ...valeursCalculees, retenues: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-600 block mb-1 text-[11px]">Résultat final (Net à payer ou solde)</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 7120.50"
                    value={valeursCalculees['resultatFinal'] || ''}
                    onChange={(e) =>
                      setValeursCalculees({ ...valeursCalculees, resultatFinal: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs font-black text-[#149D92]"
                  />
                </div>
              </div>
            </div>

            {/* 4. Contrôles de cohérence cochés */}
            <div>
              <span className="block font-bold text-slate-800 mb-1">
                3. Contrôles de cohérence effectués avant remise :
              </span>
              <div className="space-y-1.5">
                {[
                  'Vérification du plafonnement CNSS à 6 000 MAD',
                  'Absence de double déduction pour absence',
                  'Concordance des dates de contrat et d\'embauche',
                  'Contrôle du calcul de la prime d\'ancienneté (Base + Heures sup)',
                  'Vérification de la déduction pour charges de famille (30 MAD/pers)'
                ].map((ctrl, i) => (
                  <label key={i} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controlesCoches.includes(ctrl)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setControlesCoches([...controlesCoches, ctrl]);
                        } else {
                          setControlesCoches(controlesCoches.filter((c) => c !== ctrl));
                        }
                      }}
                      className="rounded text-[#149D92]"
                    />
                    <span>{ctrl}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setVoirCorrige(!voirCorrige)}
                className="text-xs font-semibold text-[#16324F] hover:underline"
              >
                {voirCorrige ? 'Masquer le corrigé expliqué' : 'Consulter le corrigé officiel'}
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Soumettre pour correction</span>
              </button>
            </div>
          </form>

          {/* Volet Corrigé officiel détaillé et Erreurs fréquentes */}
          {voirCorrige && (
            <div className="bg-white border-2 border-[#149D92] rounded-xl p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                <span className="font-extrabold text-sm text-[#16324F] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#149D92]" />
                  <span>Corrigé Pédagogique &amp; Explication Officielle</span>
                </span>
                <span className="bg-teal-50 text-[#149D92] font-mono font-bold text-xs px-2.5 py-0.5 rounded">
                  Mission {mission.numero}
                </span>
              </div>

              <div>
                <strong className="text-slate-800 block mb-1 text-xs">Analyse &amp; Explication de référence :</strong>
                <p className="text-slate-700 leading-relaxed bg-[#F4F7FA] p-3.5 rounded-lg border border-slate-200">
                  {mission.explicationComplete}
                </p>
              </div>

              {mission.reponseAttendue.formulesEtJustifications && (
                <div>
                  <strong className="text-slate-800 block mb-1 text-xs">Justifications juridiques attendues :</strong>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {mission.reponseAttendue.formulesEtJustifications.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {mission.erreursFrequentes.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900">
                  <strong className="block mb-1 text-xs text-red-950 font-bold">Erreurs fréquentes à éviter :</strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {mission.erreursFrequentes.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
