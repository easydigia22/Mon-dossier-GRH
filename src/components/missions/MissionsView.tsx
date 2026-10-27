import React, { useEffect, useState } from 'react';
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
import { MissionExercice, ModePedagogique, NiveauPedagogique, TentativeExercice } from '../../types';
import { evaluerParcours } from '../../services/certificat';

/** mm:ss, borné à zéro : un chrono négatif n'a pas de sens à l'écran. */
function formaterChrono(secondes: number): string {
  const s = Math.max(0, secondes);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

interface MissionsViewProps {
  missions: MissionExercice[];
  tentatives: TentativeExercice[];
  modePedagogique: ModePedagogique;
  niveau: NiveauPedagogique;
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

  const enEvaluation = modePedagogique === 'evaluation';

  // État du parcours : le certificat devient disponible (auprès du formateur)
  // quand toutes les missions sont corrigées avec une moyenne ≥ 10/20.
  const statutParcours = evaluerParcours(missions, tentatives);

  // Toutes les missions du catalogue sont visibles par le stagiaire, quel que
  // soit le niveau (les 10 situations professionnelles).
  const missionsVisibles = missions;

  const mission = missionsVisibles.find((m) => m.id === missionActiveId) || missionsVisibles[0];
  const tentativeExistante = mission ? tentatives.find((t) => t.missionId === mission.id) : undefined;

  // Chrono d'évaluation : redémarre à chaque changement de mission ou de mode.
  const [debutMission, setDebutMission] = useState<number>(() => Date.now());
  const [maintenant, setMaintenant] = useState<number>(() => Date.now());

  useEffect(() => {
    setDebutMission(Date.now());
    setMaintenant(Date.now());
  }, [mission?.id, modePedagogique]);

  // Recharge l'espace de réponse sur la mission réellement affichée : celle-ci
  // change aussi sans clic, quand une bascule de niveau masque la mission en cours.
  useEffect(() => {
    setIndicesAffiches(0);
    setVoirCorrige(false);
    const existante = tentatives.find((t) => t.missionId === mission?.id);
    setReponsesTextuelles(existante?.reponsesStagiaire.justificationsTextuelles || {});
    setValeursCalculees(existante?.reponsesStagiaire.valeursCalculees || {});
    setControlesCoches(existante?.reponsesStagiaire.controlesEffectues || []);
    // `tentatives` volontairement hors dépendances : une remise ne doit pas
    // réinitialiser le formulaire sous les doigts du stagiaire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission?.id]);

  useEffect(() => {
    if (!enEvaluation) return;
    const timer = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [enEvaluation, mission?.id]);

  // Le corrigé et les indices n'ont pas leur place pendant une évaluation.
  useEffect(() => {
    if (enEvaluation) {
      setVoirCorrige(false);
      setIndicesAffiches(0);
    }
  }, [enEvaluation]);

  if (!mission) {
    return (
      <div className="bg-white border border-[#ECE3D6] rounded-2xl p-8 shadow-sm text-center space-y-2">
        <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-[#1C2459]">Aucune mission disponible</p>
        <p className="text-xs text-slate-500">Le catalogue des missions est momentanément vide.</p>
      </div>
    );
  }

  const secondesRestantes = mission.dureeIndicativeMinutes * 60 - Math.floor((maintenant - debutMission) / 1000);
  const tempsEcoule = enEvaluation && secondesRestantes <= 0;

  const handleChangerMission = (id: string) => setMissionActiveId(id);

  const handleDemanderIndice = () => {
    if (indicesAffiches < mission.indicesProgressifs.length) {
      setIndicesAffiches(indicesAffiches + 1);
      showNotification(`Indice ${indicesAffiches + 1} révélé.`, 'info');
    }
  };

  const handleSoumettre = (e: React.FormEvent) => {
    e.preventDefault();

    const nouvelleTentative: TentativeExercice = {
      id: `tentative-${mission.id}-${Date.now()}`,
      missionId: mission.id,
      stagiaireNom: nomStagiaireActif,
      dateDebut: new Date(debutMission).toISOString(),
      dateRemise: new Date().toISOString(),
      statut: 'remis',
      reponsesStagiaire: {
        justificationsTextuelles: reponsesTextuelles,
        valeursCalculees,
        piecesValidees: [],
        controlesEffectues: controlesCoches
      },
      indicesConsultes: indicesAffiches
      // Pas de correction : la note est posée par le formateur (TrainerView).
    };

    onSoumettreTentative(nouvelleTentative);

    if (enEvaluation) {
      showNotification('Copie remise. En attente de correction par le formateur.', 'success');
    } else {
      showNotification('Mission remise. Votre formateur la corrigera.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Bannière de réussite du parcours — certificat délivrable par le formateur */}
      {statutParcours.reussi && statutParcours.moyenne !== null && (
        <div className="rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #1C2459 0%, #0F7D74 160%)' }}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-[#5FD0C5]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-semibold text-white">Parcours complété — félicitations !</h2>
            <p className="text-sm text-white/80 mt-0.5">
              Vous avez validé les {statutParcours.nbMissions} missions avec une moyenne de{' '}
              <strong className="text-white">{statutParcours.moyenne.toFixed(1)}/20</strong>. Votre certificat de
              complétion peut vous être délivré par votre formateur.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 border border-white/20">
            <FileCheck className="w-4 h-4" /> Certificat disponible
          </span>
        </div>
      )}

      {/* En-tête des missions */}
      <div className="bg-white border border-[#ECE3D6] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#149D92]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1C2459]">Missions &amp; Exercices Pédagogiques</h1>
              <p className="text-xs text-slate-500">
                {missionsVisibles.length} situations professionnelles réelles pour valider le module « Gestion administrative du personnel »
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {enEvaluation && (
              <span
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border tabular-nums ${
                  tempsEcoule
                    ? 'bg-red-50 text-[#D64545] border-red-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
                title="Temps restant pour cette mission"
              >
                <Clock className="w-3.5 h-3.5" />
                {tempsEcoule ? 'Temps écoulé' : formaterChrono(secondesRestantes)}
              </span>
            )}
            <span className="text-xs text-slate-500">Apprenant :</span>
            <span className="text-xs font-bold text-[#1C2459] bg-[#FBF7F0] px-3 py-1.5 rounded-lg border border-[#ECE3D6]">
              {nomStagiaireActif}
            </span>
          </div>
        </div>

        {/* Sélecteur horizontal des 10 missions */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-1.5 overflow-x-auto pb-1">
          {missionsVisibles.map((m) => {
            const fait = tentatives.some((t) => t.missionId === m.id);
            const estActive = m.id === missionActiveId;
            return (
              <button
                key={m.id}
                onClick={() => handleChangerMission(m.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  estActive
                    ? 'bg-[#1C2459] text-white'
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-[11px] text-[#1C2459] flex items-start gap-2">
        <span>
          Votre formateur peut consulter votre dossier de travail (entreprise, salariés, bulletins)
          pour corriger vos missions. Il ne peut rien y modifier.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche : Fiche de mission, Contexte, Barème */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-[#ECE3D6] rounded-2xl p-5 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#149D92]">
                Mission N° {mission.numero} / {missions.length}
              </span>
              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>{mission.dureeIndicativeMinutes} min</span>
              </span>
            </div>

            <h2 className="text-sm font-bold text-[#1C2459] leading-snug">{mission.titre}</h2>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Mise en situation professionnelle :</span>
              <p className="text-slate-600 leading-relaxed bg-[#FBF7F0] p-3 rounded-lg border border-[#ECE3D6]">
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

            {/* Grille de notation sur 20 — masquée pendant une évaluation */}
            {!enEvaluation && (
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
            )}
          </div>

          {/* Indices progressifs — indisponibles pendant une évaluation */}
          {enEvaluation ? (
            <div className="bg-slate-50 border border-[#ECE3D6] rounded-2xl p-5 text-xs text-slate-600 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#1C2459]">Mode Évaluation.</strong> Indices, barème et corrigé sont fermés.
                Votre copie est enregistrée à la remise et corrigée par le formateur.
              </span>
            </div>
          ) : (
          <div className="bg-white border border-[#ECE3D6] rounded-2xl p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1C2459] flex items-center gap-1.5">
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
          )}
        </div>

        {/* Colonne droite : Espace de travail du stagiaire & Remise */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSoumettre} className="bg-white border border-[#ECE3D6] rounded-2xl p-6 shadow-sm space-y-5 text-xs">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#1C2459] flex items-center gap-2">
                <span>Espace de réponse du Stagiaire</span>
                {tentativeExistante && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      tentativeExistante.correction
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tentativeExistante.correction
                      ? `Corrigée (${tentativeExistante.correction.noteTotaleSur20.toFixed(1)}/20)`
                      : 'Remise — en attente de correction'}
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
              <div className="space-y-1.5 bg-[#FBF7F0] p-3 rounded-lg border border-[#ECE3D6]">
                {mission.taches.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-[#1C2459] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
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
                className="w-full p-3 border border-[#ECE3D6] rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#149D92]"
              />
            </div>

            {/* 3. Valeurs numériques et calculs — adaptatif selon la mission */}
            {mission.champsResultats && mission.champsResultats.length > 0 ? (
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  2. Montants et résultats des calculs déterministes :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FBF7F0] p-3.5 rounded-lg border border-[#ECE3D6]">
                  {mission.champsResultats.map((champ) => (
                    <div key={champ.cle} className={champ.miseEnAvant ? 'sm:col-span-2' : ''}>
                      <span className="text-slate-600 block mb-1 text-[11px]">
                        {champ.label} ({champ.unite})
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={champ.placeholder}
                        value={valeursCalculees[champ.cle] ?? ''}
                        onChange={(e) => {
                          const next = { ...valeursCalculees };
                          if (e.target.value === '') delete next[champ.cle];
                          else next[champ.cle] = Number(e.target.value);
                          setValeursCalculees(next);
                        }}
                        className={`w-full px-3 py-1.5 border border-[#ECE3D6] rounded bg-white font-mono text-xs ${
                          champ.miseEnAvant ? 'font-black text-[#149D92]' : 'font-bold'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#FBF7F0] p-3 rounded-lg border border-[#ECE3D6] text-[11px] text-slate-500 italic leading-relaxed">
                2. Cette mission ne comporte pas de saisie chiffrée : concentrez-vous sur la
                justification juridique, les livrables attendus et les contrôles de cohérence ci-dessous.
              </div>
            )}

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
              {enEvaluation ? (
                <span className="text-xs text-slate-400">Corrigé indisponible en évaluation</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setVoirCorrige(!voirCorrige)}
                  className="text-xs font-semibold text-[#1C2459] hover:underline"
                >
                  {voirCorrige ? 'Masquer le corrigé expliqué' : 'Consulter le corrigé officiel'}
                </button>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#149D92] hover:bg-[#11857c] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{enEvaluation ? 'Remettre ma copie' : 'Soumettre pour correction'}</span>
              </button>
            </div>
          </form>

          {/* Volet Corrigé officiel détaillé et Erreurs fréquentes */}
          {voirCorrige && !enEvaluation && (
            <div className="bg-white border-2 border-[#149D92] rounded-xl p-6 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                <span className="font-extrabold text-sm text-[#1C2459] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#149D92]" />
                  <span>Corrigé Pédagogique &amp; Explication Officielle</span>
                </span>
                <span className="bg-teal-50 text-[#149D92] font-mono font-bold text-xs px-2.5 py-0.5 rounded">
                  Mission {mission.numero}
                </span>
              </div>

              <div>
                <strong className="text-slate-800 block mb-1 text-xs">Analyse &amp; Explication de référence :</strong>
                <p className="text-slate-700 leading-relaxed bg-[#FBF7F0] p-3.5 rounded-lg border border-[#ECE3D6]">
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
