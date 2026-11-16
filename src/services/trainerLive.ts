/**
 * Suivi en direct, côté formateur, des tentatives de mission de tous les stagiaires.
 * S'appuie sur les policies RLS "formateur_read_all" / "formateur_update_all" (migration
 * 20261004130000). Sans compte Supabase connecté en formateur, ces appels échoueront
 * simplement (RLS) et l'appelant doit traiter l'erreur.
 */

import { supabase } from './supabase';
import type { TentativeExercice } from '../types';

export interface TentativeLive {
  /** Identifiant du compte stagiaire propriétaire (pas d'e-mail exposé par RLS) */
  userId: string;
  tentative: TentativeExercice;
}

/** Dernières modifications RH réalisées dans le dossier personnel du stagiaire. */
export interface ActiviteRHLive {
  userId: string;
  updatedAt: string;
}

export async function fetchAllTentativesLive(): Promise<TentativeLive[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('tentatives').select('user_id, data').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ userId: row.user_id as string, tentative: row.data as TentativeExercice }));
}

export async function fetchAllActivitesRHLive(): Promise<ActiviteRHLive[]> {
  if (!supabase) return [];
  const client = supabase;
  // Les policies formateur_read_roster accordent une lecture seule limitée aux
  // stagiaires rattachés à une classe du formateur.
  const tables = ['salaries', 'contrats', 'evenements_presence', 'demandes_conges', 'bulletins'];
  const resultats = await Promise.all(
    tables.map(async (table) => {
      const { data, error } = await client.from(table).select('user_id, updated_at');
      if (error) throw error;
      return (data ?? []).map((ligne) => ({ userId: ligne.user_id as string, updatedAt: ligne.updated_at as string }));
    })
  );
  return resultats.flat();
}

export async function saveCorrectionLive(
  userId: string,
  tentative: TentativeExercice,
  correction: NonNullable<TentativeExercice['correction']>
): Promise<void> {
  if (!supabase) return;
  const updated: TentativeExercice = { ...tentative, statut: 'corrige', correction };
  const { data, error } = await supabase
    .from('tentatives')
    .update({ data: updated })
    .eq('user_id', userId)
    .eq('id', tentative.id)
    .select('id');
  if (error) throw error;
  // RLS ne refuse pas un UPDATE : elle le réduit à zéro ligne, sans erreur. Sans ce
  // contrôle, un admin (lecture seule) ou un formateur révoqué verrait « correction
  // transmise » alors que rien n'a été écrit.
  if (!data || data.length === 0) {
    throw new Error("Correction refusée : vous n'avez pas le droit de corriger cette tentative.");
  }
}
