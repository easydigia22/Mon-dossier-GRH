import { supabase } from './supabase';

/**
 * Accès aux établissements (tenants) — migration 20261018000000_multi_etablissements.
 * Toutes les écritures passent par des fonctions RPC security definer côté serveur.
 */

export type StatutEtablissement = 'en_attente' | 'approuve' | 'refuse';

export interface EtablissementPublic {
  id: string;
  nom: string;
  ville: string | null;
}

export interface Etablissement extends EtablissementPublic {
  code: string | null;
  statut: StatutEtablissement;
  creePar: string | null;
  creeLe: string;
}

/** Liste publique (id/nom/ville) des établissements approuvés — pour le choix à l'inscription. */
export async function listerEtablissementsPublics(): Promise<EtablissementPublic[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('lister_etablissements_publics');
  if (error) throw error;
  return (data ?? []) as EtablissementPublic[];
}

/** Rattache le formateur connecté à un établissement existant approuvé. */
export async function choisirEtablissement(etablissementId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('choisir_etablissement', { p_etablissement_id: etablissementId });
  if (error) throw error;
}

/** Le formateur connecté propose un nouvel établissement (statut « en attente »). */
export async function proposerEtablissement(nom: string, ville?: string): Promise<string> {
  if (!supabase) throw new Error('Hors ligne');
  const { data, error } = await supabase.rpc('proposer_etablissement', {
    p_nom: nom,
    p_ville: ville || null
  });
  if (error) throw error;
  return data as string;
}

// --- Super-admin -----------------------------------------------------------

/** Tous les établissements (super-admin uniquement, via RLS). */
export async function fetchEtablissements(): Promise<Etablissement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('etablissements')
    .select('id, nom, ville, code, statut, cree_par, cree_le')
    .order('cree_le', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((e: any) => ({
    id: e.id,
    nom: e.nom,
    ville: e.ville ?? null,
    code: e.code ?? null,
    statut: e.statut as StatutEtablissement,
    creePar: e.cree_par ?? null,
    creeLe: e.cree_le
  }));
}

/** Création d'un établissement par le super-admin (approuvé d'emblée). */
export async function creerEtablissement(nom: string, ville?: string): Promise<string> {
  if (!supabase) throw new Error('Hors ligne');
  const { data, error } = await supabase.rpc('creer_etablissement', { p_nom: nom, p_ville: ville || null });
  if (error) throw error;
  return data as string;
}

/** Approuver / refuser un établissement proposé (super-admin). */
export async function deciderEtablissement(id: string, decision: StatutEtablissement): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('decider_etablissement', { p_id: id, p_decision: decision });
  if (error) throw error;
}

/** Désigner (ou changer) l'admin d'un établissement (super-admin). */
export async function designerAdminEtablissement(userId: string, etablissementId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('designer_admin_etablissement', {
    p_user_id: userId,
    p_etablissement_id: etablissementId
  });
  if (error) throw error;
}

export interface CompteEtablissement {
  userId: string;
  email: string;
  role: 'stagiaire' | 'formateur' | 'admin' | 'superadmin';
  statut: 'en_attente' | 'approuve' | 'refuse' | 'desactive';
}

/** Comptes rattachés à un établissement (super-admin via RLS). */
export async function fetchComptesParEtablissement(etablissementId: string): Promise<CompteEtablissement[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, role, statut')
    .eq('etablissement_id', etablissementId)
    .order('role');
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    userId: p.user_id,
    email: p.email ?? '(e-mail inconnu)',
    role: p.role,
    statut: p.statut
  }));
}
