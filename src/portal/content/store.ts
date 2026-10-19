/**
 * Logique de sélection des contenus (filtres, recherche), en fonctions pures.
 *
 * Les fonctions prennent la liste de contenus en paramètre : la liste réelle
 * (contenus intégrés + contenus Supabase) est fournie par le ContentProvider,
 * voir `ContentContext.tsx`.
 */
import type { Contenu, Rubrique, TypeContenu, Public, Niveau } from './types';
import { CONTENUS_DEMO } from './seed';

/** Un contenu est réellement public s'il est publié ET non marqué démo. */
export function estPublic(c: Contenu): boolean {
  return c.statut === 'publie' && !c.demo;
}

/** Contenus intégrés au code (référence), hors contenus dépubliés. */
export const CONTENUS_INTEGRES: Contenu[] = CONTENUS_DEMO.filter((c) => c.statut !== 'depublie');

export function filtrerRubrique(contenus: Contenu[], rubrique: Rubrique): Contenu[] {
  return contenus.filter((c) => c.rubrique === rubrique);
}

export function filtrerType(contenus: Contenu[], type: TypeContenu): Contenu[] {
  return contenus.filter((c) => c.type === type);
}

export function trouverParSlug(contenus: Contenu[], slug: string): Contenu | undefined {
  return contenus.find((c) => c.slug === slug);
}

export function trierRecents(contenus: Contenu[], limite = 6): Contenu[] {
  return [...contenus]
    .sort((a, b) => (b.dateMiseAJour || b.datePublication || '').localeCompare(a.dateMiseAJour || a.datePublication || ''))
    .slice(0, limite);
}

export interface FiltresCatalogue {
  texte?: string;
  type?: TypeContenu;
  rubrique?: Rubrique;
  public?: Public;
  niveau?: Niveau;
}

/** Recherche + filtres réellement appliqués (pas de bouton décoratif). */
export function rechercherDans(contenus: Contenu[], filtres: FiltresCatalogue): Contenu[] {
  const q = (filtres.texte || '').trim().toLowerCase();
  return contenus.filter((c) => {
    if (filtres.type && c.type !== filtres.type) return false;
    if (filtres.rubrique && c.rubrique !== filtres.rubrique) return false;
    if (filtres.public && !c.publics.includes(filtres.public)) return false;
    if (filtres.niveau && c.niveau !== filtres.niveau) return false;
    if (q) {
      const foin = [c.titre, c.resume, ...(c.tags || [])].join(' ').toLowerCase();
      if (!foin.includes(q)) return false;
    }
    return true;
  });
}
