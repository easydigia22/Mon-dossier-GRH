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

export async function fetchAllTentativesLive(): Promise<TentativeLive[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('tentatives').select('user_id, data').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ userId: row.user_id as string, tentative: row.data as TentativeExercice }));
}

export async function saveCorrectionLive(
  userId: string,
  tentative: TentativeExercice,
  correction: NonNullable<TentativeExercice['correction']>
): Promise<void> {
  if (!supabase) return;
  const updated: TentativeExercice = { ...tentative, statut: 'corrige', correction };
  const { error } = await supabase.from('tentatives').update({ data: updated }).eq('user_id', userId).eq('id', tentative.id);
  if (error) throw error;
}
