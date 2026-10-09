/**
 * Rattachement réel stagiaire <-> classe via un code d'invitation.
 * S'appuie sur la fonction SQL `join_classe` et la table `classe_stagiaires`
 * (migration 20261004140000_classe_join_code.sql).
 */

import { supabase } from './supabase';
import type { MembreClasseLive } from '../types';

export function genererCodeInvitation(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans caractères ambigus (0/O, 1/I)
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

/** Pour un compte stagiaire : la classe qu'il a rejointe, ou null s'il n'a encore saisi aucun code. */
export async function fetchMaClasse(): Promise<MembreClasseLive | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('classe_stagiaires').select('*').maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    stagiaireUserId: data.stagiaire_user_id,
    classeId: data.classe_id,
    matricule: data.matricule,
    nom: data.nom,
    prenom: data.prenom,
    joinedAt: data.joined_at
  };
}

/** Rejoindre (ou changer de) classe en saisissant le code fourni par le formateur. */
export async function rejoindreClasse(code: string, nom: string, prenom: string, matricule?: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('join_classe', {
    p_code: code,
    p_nom: nom,
    p_prenom: prenom,
    p_matricule: matricule || null
  });
  if (error) throw new Error(error.message.includes('Code de classe invalide') ? 'Code de classe invalide.' : error.message);
}

/** Pour le formateur : effectif réellement rattaché (comptes stagiaires) à l'une de ses classes. */
export async function fetchEffectifLive(classeId: string): Promise<MembreClasseLive[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('classe_stagiaires').select('*').eq('classe_id', classeId).order('joined_at');
  if (error) throw error;
  return (data ?? []).map((d) => ({
    stagiaireUserId: d.stagiaire_user_id,
    classeId: d.classe_id,
    matricule: d.matricule,
    nom: d.nom,
    prenom: d.prenom,
    joinedAt: d.joined_at
  }));
}

/**
 * Détache tous les stagiaires rattachés à une classe et renvoie leur nombre.
 * Appelé avant de supprimer une classe archivée : `classe_stagiaires` n'a aucune
 * clé étrangère vers `classes`, donc rien ne détacherait ces stagiaires tout seuls,
 * et l'application les croirait rattachés à une classe disparue — sans jamais leur
 * reproposer la saisie d'un code.
 */
export async function detacherTousDeLaClasse(classeId: string): Promise<number> {
  if (!supabase) return 0;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return 0;

  // Filtre explicite sur le propriétaire plutôt que de s'en remettre à RLS seule.
  const { data, error } = await supabase
    .from('classe_stagiaires')
    .delete()
    .eq('classe_user_id', userId)
    .eq('classe_id', classeId)
    .select('stagiaire_user_id');
  if (error) throw error;
  return data?.length ?? 0;
}

export async function retirerDuEffectif(stagiaireUserId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('classe_stagiaires').delete().eq('stagiaire_user_id', stagiaireUserId);
  if (error) throw error;
}
