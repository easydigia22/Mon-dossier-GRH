import { supabase } from './supabase';

export type UserRole = 'stagiaire' | 'formateur' | 'admin';
export type StatutCompte = 'en_attente' | 'approuve' | 'refuse' | 'desactive';

export interface MonProfil {
  role: UserRole;
  statut: StatutCompte;
  email?: string;
  motifRefus?: string;
  /** Aucune ligne de profil lisible : compte en cours de création, statut inconnu. */
  profilAbsent?: boolean;
}

/** Profil du compte connecté, tel que fixé côté serveur (voir migrations profiles_*). */
export async function fetchMonProfil(): Promise<MonProfil> {
  if (!supabase) return { role: 'stagiaire', statut: 'approuve' };

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return { role: 'stagiaire', statut: 'approuve' };

  // Filtrer explicitement : depuis la policy `admin_read_all`, un select non filtré
  // renvoie toutes les lignes à un admin, et `maybeSingle()` échoue au-delà d'une.
  const { data, error } = await supabase
    .from('profiles')
    .select('role, statut, email, motif_refus')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  // Ligne absente : le trigger d'inscription n'a pas encore écrit. On retombe sur le
  // profil le moins privilégié — jamais sur un accès formateur par défaut — et on le
  // signale, pour ne pas réclamer un code de classe à un futur formateur.
  if (!data) return { role: 'stagiaire', statut: 'approuve', profilAbsent: true };

  return {
    role: (data.role as UserRole) ?? 'stagiaire',
    statut: (data.statut as StatutCompte) ?? 'en_attente',
    email: data.email ?? undefined,
    motifRefus: data.motif_refus ?? undefined
  };
}
