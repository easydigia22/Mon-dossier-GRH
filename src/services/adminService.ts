import { supabase } from './supabase';
import type { StatutCompte, UserRole } from './profile';

export interface ProfilAdmin {
  userId: string;
  email: string;
  role: UserRole;
  statut: StatutCompte;
  decideLe?: string;
  motifRefus?: string;
  creeLe: string;
}

/**
 * Tous les profils visibles par l'admin (politique `admin_read_all`).
 * Un non-admin n'obtient que sa propre ligne : la restriction vit dans la base,
 * pas ici.
 */
export async function fetchProfils(): Promise<ProfilAdmin[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, role, statut, decide_le, motif_refus, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((l) => ({
    userId: l.user_id,
    email: l.email ?? '(e-mail inconnu)',
    role: l.role as UserRole,
    statut: l.statut as StatutCompte,
    decideLe: l.decide_le ?? undefined,
    motifRefus: l.motif_refus ?? undefined,
    creeLe: l.created_at
  }));
}

/**
 * Approuver, refuser ou révoquer un compte formateur.
 * Passe par la fonction `security definer` : `profiles` est en écriture interdite
 * au client, un update direct échouerait.
 */
export async function deciderFormateur(
  userId: string,
  decision: StatutCompte,
  motif?: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.rpc('decider_formateur', {
    p_user_id: userId,
    p_decision: decision,
    p_motif: motif ?? null
  });
  if (error) throw new Error(error.message);
}
