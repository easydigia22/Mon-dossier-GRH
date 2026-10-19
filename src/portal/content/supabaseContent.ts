/**
 * Accès Supabase aux contenus du portail (CMS).
 *
 * - Lecture publique : seuls les contenus `statut = 'publie'` (RLS).
 * - Écriture / upload : réservés aux administrateurs (RLS).
 *
 * Si Supabase n'est pas configuré ou si la table n'existe pas encore, toutes
 * les fonctions de lecture renvoient [] : le site retombe proprement sur les
 * contenus intégrés (seed).
 */
import { supabase } from '../../services/supabase';
import type { Contenu, FichierTelechargeable } from './types';

const TABLE = 'portail_contenus';

/** Colonnes de la table (snake_case) → objet Contenu (camelCase). */
function versContenu(row: any): Contenu {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    rubrique: row.rubrique,
    titre: row.titre,
    resume: row.resume ?? '',
    publics: row.publics ?? [],
    niveau: row.niveau ?? 'debutant',
    statut: row.statut ?? 'brouillon',
    demo: false, // un contenu venant du CMS n'est jamais une démo
    datePublication: row.date_publication ?? undefined,
    dateMiseAJour: row.date_mise_a_jour ?? undefined,
    auteur: row.auteur ?? undefined,
    tags: row.tags ?? [],
    sources: row.sources ?? undefined,
    corps: row.corps ?? undefined,
    enonce: row.enonce ?? undefined,
    correction: row.correction ?? undefined,
    questions: row.questions ?? undefined,
    fichierUrl: undefined,
    fichiers: row.fichiers ?? undefined,
  };
}

/** Objet Contenu → ligne de table (snake_case) pour insert/update. */
function versRow(c: Contenu): Record<string, unknown> {
  return {
    slug: c.slug,
    type: c.type,
    rubrique: c.rubrique,
    titre: c.titre,
    resume: c.resume,
    publics: c.publics,
    niveau: c.niveau,
    statut: c.statut,
    date_publication: c.datePublication || null,
    date_mise_a_jour: c.dateMiseAJour || null,
    auteur: c.auteur || null,
    tags: c.tags ?? [],
    corps: c.corps || null,
    enonce: c.enonce || null,
    correction: c.correction || null,
    questions: c.questions ?? null,
    fichiers: c.fichiers ?? null,
    sources: c.sources ?? null,
  };
}

/** Contenus publiés, visibles du public. [] si Supabase indisponible. */
export async function fetchContenusPublies(): Promise<Contenu[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from(TABLE).select('*').eq('statut', 'publie');
  if (error) {
    // Table absente (migration non appliquée) ou autre erreur : repli silencieux.
    console.warn('[portail] Lecture des contenus Supabase impossible :', error.message);
    return [];
  }
  return (data ?? []).map(versContenu);
}

/** Tous les contenus (admin), quel que soit le statut. */
export async function fetchTousContenusAdmin(): Promise<Contenu[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(versContenu);
}

/** Crée ou met à jour un contenu (par `id` si présent, sinon insertion). */
export async function enregistrerContenu(c: Contenu): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const row = versRow(c);
  if (c.id) {
    const { error } = await supabase.from(TABLE).update(row).eq('id', c.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(TABLE).insert(row);
    if (error) throw error;
  }
}

export async function supprimerContenu(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

/**
 * Upload d'un fichier dans le bucket « documents » et renvoi d'une entrée
 * de téléchargement (URL publique). Le chemin inclut un horodatage pour éviter
 * les collisions de noms.
 */
export async function uploadFichier(
  file: File,
  langue: FichierTelechargeable['langue'],
  label: string
): Promise<FichierTelechargeable> {
  if (!supabase) throw new Error('Supabase non configuré.');
  const nomSafe = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
  const chemin = `${Date.now()}-${nomSafe}`;
  const { error } = await supabase.storage.from('documents').upload(chemin, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('documents').getPublicUrl(chemin);
  const taille = `${(file.size / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
  return { langue, url: data.publicUrl, label, taille };
}
