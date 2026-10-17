/**
 * Logique de complétion d'un parcours pédagogique et de délivrance du certificat.
 *
 * Règle de délivrance (décision produit) : le certificat est acquis lorsque
 * TOUTES les missions du parcours ont été corrigées par le formateur ET que la
 * moyenne générale des notes /20 atteint le seuil de réussite (≥ 10/20).
 *
 * Source unique de vérité partagée entre la vue stagiaire (MissionsView) et le
 * tableau de bord formateur (FormateurDashboard) pour éviter toute divergence.
 */
import type { MissionExercice, TentativeExercice } from '../types';

/** Note minimale (sur 20) pour valider le parcours et obtenir le certificat. */
export const SEUIL_REUSSITE = 10;

export interface StatutParcours {
  nbMissions: number;
  missionsCorrigees: number;
  moyenne: number | null; // moyenne /20 des missions corrigées, null si aucune
  complet: boolean; // toutes les missions du parcours sont corrigées
  reussi: boolean; // complet ET moyenne ≥ SEUIL_REUSSITE → certificat délivrable
}

/**
 * Règle de réussite centralisée, utilisable aussi bien à partir d'agrégats déjà
 * calculés (tableau de bord formateur) que du calcul complet ci-dessous.
 */
export function estParcoursReussi(
  missionsCorrigees: number,
  nbMissions: number,
  moyenne: number | null
): boolean {
  return nbMissions > 0 && missionsCorrigees >= nbMissions && moyenne !== null && moyenne >= SEUIL_REUSSITE;
}

/**
 * Évalue l'état du parcours d'un stagiaire à partir de ses tentatives locales.
 * Une mission compte comme corrigée dès qu'il existe une tentative au statut
 * « corrige » portant une correction ; la dernière correction connue fait foi.
 */
export function evaluerParcours(missions: MissionExercice[], tentatives: TentativeExercice[]): StatutParcours {
  const nbMissions = missions.length;
  const notesParMission = new Map<string, number>();

  for (const t of tentatives) {
    if (t.statut === 'corrige' && t.correction) {
      // En cas de tentatives multiples, on garde la dernière remise connue.
      notesParMission.set(t.missionId, t.correction.noteTotaleSur20);
    }
  }

  // On ne retient que les missions réellement présentes dans le parcours courant.
  const notes: number[] = [];
  for (const m of missions) {
    const note = notesParMission.get(m.id);
    if (note !== undefined) notes.push(note);
  }

  const missionsCorrigees = notes.length;
  const moyenne = missionsCorrigees ? notes.reduce((a, b) => a + b, 0) / missionsCorrigees : null;
  const complet = nbMissions > 0 && missionsCorrigees >= nbMissions;

  return {
    nbMissions,
    missionsCorrigees,
    moyenne,
    complet,
    reussi: estParcoursReussi(missionsCorrigees, nbMissions, moyenne)
  };
}

/**
 * Référence de certificat courte et déterministe (mêmes entrées → même code),
 * de la forme « SRH-XXXXXX-AAAA ». Purement pédagogique : sert de repère visuel
 * sur le document, pas de preuve cryptographique.
 */
export function referenceCertificat(nomStagiaire: string, dateObtention: Date = new Date()): string {
  const base = `${nomStagiaire.trim().toLowerCase()}|${dateObtention.toISOString().slice(0, 10)}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }
  const code = hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  return `SRH-${code}-${dateObtention.getFullYear()}`;
}
