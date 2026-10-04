import { supabase } from './supabase';

export type UserRole = 'stagiaire' | 'formateur';

/**
 * Rôle de l'utilisateur connecté, fixé côté serveur à l'inscription (voir migration
 * `profiles_roles.sql`). Retourne 'stagiaire' par défaut si la ligne n'existe pas encore
 * (ex: juste après l'inscription, avant que le trigger n'ait eu le temps de s'exécuter).
 */
export async function fetchMyRole(): Promise<UserRole> {
  if (!supabase) return 'stagiaire';
  const { data, error } = await supabase.from('profiles').select('role').maybeSingle();
  if (error) throw error;
  return (data?.role as UserRole) ?? 'stagiaire';
}
