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

/** Un groupe tel que l'admin le voit (policy `admin_read_classes`). */
export interface ClasseAdmin {
  userId: string;
  id: string;
  nom: string;
}

/** Un compte dans la liste d'administration, enrichi de son contexte. */
export interface CompteAdmin extends ProfilAdmin {
  /** Formateurs : nombre de groupes possédés. */
  nbGroupes?: number;
  /** Stagiaires : nom de la classe rejointe, si elle est lisible. */
  classeRejointe?: string;
}

export interface ApercuSuppression {
  groupes: number;
  stagiairesDetaches: number;
  bulletins: number;
  remises: number;
}

/**
 * Tous les comptes, enrichis : nombre de groupes pour un formateur, classe
 * rejointe pour un stagiaire. Trois lectures assemblées côté client — le volume
 * attendu est de quelques dizaines de comptes.
 */
export async function fetchComptes(): Promise<CompteAdmin[]> {
  if (!supabase) return [];

  const [profils, classes, rattachements] = await Promise.all([
    fetchProfils(),
    supabase.from('classes').select('user_id, id, data'),
    supabase.from('classe_stagiaires').select('stagiaire_user_id, classe_user_id, classe_id')
  ]);

  if (classes.error) throw classes.error;
  if (rattachements.error) throw rattachements.error;

  const lignesClasses = classes.data ?? [];
  const nomDeClasse = new Map<string, string>(
    lignesClasses.map((c) => [`${c.user_id}|${c.id}`, (c.data as { nom?: string })?.nom ?? 'Groupe sans nom'])
  );
  const nbGroupesPar = new Map<string, number>();
  lignesClasses.forEach((c) => nbGroupesPar.set(c.user_id, (nbGroupesPar.get(c.user_id) ?? 0) + 1));

  const classeDuStagiaire = new Map<string, string>(
    (rattachements.data ?? []).map((r) => [
      r.stagiaire_user_id,
      nomDeClasse.get(`${r.classe_user_id}|${r.classe_id}`) ?? 'Classe inconnue'
    ])
  );

  return profils.map((p) => ({
    ...p,
    nbGroupes: p.role === 'formateur' ? nbGroupesPar.get(p.userId) ?? 0 : undefined,
    classeRejointe: p.role === 'stagiaire' ? classeDuStagiaire.get(p.userId) : undefined
  }));
}

/** Les groupes d'un formateur, pour le panneau de réaffectation. */
export async function fetchClassesDe(userId: string): Promise<ClasseAdmin[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('classes').select('user_id, id, data').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((c) => ({
    userId: c.user_id,
    id: c.id,
    nom: (c.data as { nom?: string })?.nom ?? 'Groupe sans nom'
  }));
}

export async function desactiverCompte(userId: string, desactive: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.rpc('desactiver_compte', {
    p_user_id: userId,
    p_desactive: desactive
  });
  if (error) throw new Error(error.message);
}

export async function reaffecterGroupe(classeId: string, ancien: string, nouveau: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.rpc('reaffecter_groupe', {
    p_classe_id: classeId,
    p_ancien: ancien,
    p_nouveau: nouveau
  });
  if (error) throw new Error(error.message);
}

export async function apercuSuppression(userId: string): Promise<ApercuSuppression> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { data, error } = await supabase.rpc('apercu_suppression', { p_user_id: userId });
  if (error) throw new Error(error.message);
  const l = (data ?? [])[0] ?? {};
  return {
    groupes: Number(l.groupes ?? 0),
    stagiairesDetaches: Number(l.stagiaires_detaches ?? 0),
    bulletins: Number(l.bulletins ?? 0),
    remises: Number(l.remises ?? 0)
  };
}

export async function supprimerCompte(userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.rpc('supprimer_compte', { p_user_id: userId });
  if (error) throw new Error(error.message);
}
