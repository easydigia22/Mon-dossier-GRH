import { supabase } from './supabase';

export type UserRole = 'stagiaire' | 'formateur' | 'admin';
export type StatutCompte = 'en_attente' | 'approuve' | 'refuse';

export interface MonProfil {
  role: UserRole;
  statut: StatutCompte;
  email?: string;
  motifRefus?: string;
}

/** Profil du compte connecté, tel que fixé côté serveur (voir migrations profiles_*). */
export async function fetchMonProfil(): Promise<MonProfil> {
  if (!supabase) return { role: 'stagiaire', statut: 'approuve' };

  const { data, error } = await supabase
    .from('profiles')
    .select('role, statut, email, motif_refus')
    .maybeSingle();
  if (error) throw error;

  // Ligne absente : le trigger d'inscription n'a pas encore écrit. On retombe sur le
  // profil le moins privilégié — jamais sur un accès formateur par défaut.
  if (!data) return { role: 'stagiaire', statut: 'approuve' };

  return {
    role: (data.role as UserRole) ?? 'stagiaire',
    statut: (data.statut as StatutCompte) ?? 'en_attente',
    email: data.email ?? undefined,
    motifRefus: data.motif_refus ?? undefined
  };
}
