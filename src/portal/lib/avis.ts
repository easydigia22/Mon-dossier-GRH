/**
 * Accès Supabase aux avis / témoignages du portail.
 *
 * - Lecture publique : seuls les avis `statut = 'publie'` (RLS).
 * - Soumission publique : insérée en `statut = 'en_attente'`, donc invisible
 *   tant qu'un administrateur ne l'a pas validée (modération).
 *
 * Si Supabase n'est pas configuré ou si la table n'existe pas encore, la
 * lecture renvoie [] et la soumission échoue proprement : le site retombe sur
 * les témoignages d'exemple (clairement étiquetés) affichés par le composant.
 */
import { supabase } from '../../services/supabase';

const TABLE = 'portail_avis';

export type StatutAvis = 'en_attente' | 'publie' | 'rejete';

export interface Avis {
  id: string;
  prenom: string;
  qualite: string;
  texte: string;
  note?: number | null;
  publishedAt?: string | null;
}

/** Avis vu côté administration (avec statut et date de soumission). */
export interface AvisAdmin extends Avis {
  statut: StatutAvis;
  createdAt: string;
}

export interface NouvelAvis {
  prenom: string;
  qualite: string;
  texte: string;
  note?: number | null;
  consentement: boolean;
}

function versAvis(row: any): Avis {
  return {
    id: row.id,
    prenom: row.prenom,
    qualite: row.qualite,
    texte: row.texte,
    note: row.note ?? null,
    publishedAt: row.published_at ?? null,
  };
}

/** Avis publiés, visibles du public. [] si Supabase indisponible. */
export async function fetchAvisPublies(): Promise<Avis[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, prenom, qualite, texte, note, published_at')
    .eq('statut', 'publie')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(12);
  if (error) {
    // Table absente (migration non appliquée) ou autre erreur : repli silencieux.
    console.warn('[portail] Lecture des avis Supabase impossible :', error.message);
    return [];
  }
  return (data ?? []).map(versAvis);
}

/**
 * Enregistre un avis soumis par un visiteur. Toujours en `statut = 'en_attente'`
 * (forcé aussi par la RLS) : il n'apparaîtra sur le site qu'après validation
 * par un administrateur.
 */
export async function soumettreAvis(input: NouvelAvis): Promise<void> {
  if (!supabase) {
    throw new Error("Le recueil d'avis n'est pas disponible pour le moment.");
  }
  if (!input.consentement) {
    throw new Error('Le consentement à la publication est requis.');
  }
  const { error } = await supabase.from(TABLE).insert({
    prenom: input.prenom.trim(),
    qualite: input.qualite.trim(),
    texte: input.texte.trim(),
    note: input.note ?? null,
    consentement: true,
    statut: 'en_attente',
  });
  if (error) throw error;
}

/* -------------------------------------------------------------------------- */
/* Modération (administrateurs — protégé par la RLS côté base).               */
/* -------------------------------------------------------------------------- */

function versAvisAdmin(row: any): AvisAdmin {
  return {
    ...versAvis(row),
    statut: row.statut,
    createdAt: row.created_at,
  };
}

/** Tous les avis (tous statuts), pour l'espace admin. */
export async function fetchAvisAdmin(): Promise<AvisAdmin[]> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, prenom, qualite, texte, note, statut, created_at, published_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(versAvisAdmin);
}

/** Change le statut d'un avis (publier / rejeter / remettre en attente). */
export async function changerStatutAvis(id: string, statut: StatutAvis): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.from(TABLE).update({ statut }).eq('id', id);
  if (error) throw error;
}

/** Supprime définitivement un avis. */
export async function supprimerAvis(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}
