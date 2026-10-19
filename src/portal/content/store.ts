/**
 * Couche d'accès aux contenus du portail.
 *
 * Toutes les pages passent par ce module (jamais par `seed` directement), afin
 * que le passage à Supabase en Phase 2 se fasse en ne changeant QUE ce fichier.
 * La signature des fonctions restera la même (versions asynchrones si besoin).
 */
import type { Contenu, Rubrique, TypeContenu, Public, Niveau } from './types';
import { CONTENUS_DEMO } from './seed';

/**
 * Un contenu est réellement public s'il est publié ET non marqué démo.
 * En Phase 1, aucun contenu n'est démo=false : rien n'est donc « public ».
 * La préversion affiche les contenus démo avec un bandeau explicite.
 */
export function estPublic(c: Contenu): boolean {
  return c.statut === 'publie' && !c.demo;
}

/** Y a-t-il au moins un contenu réellement publié (non démo) ? */
export function existeContenuPublic(): boolean {
  return CONTENUS_DEMO.some(estPublic);
}

/**
 * Contenus affichables dans la préversion. En Phase 1 on montre les contenus
 * démo (étiquetés), sinon on ne verrait rien. Quand de vrais contenus publiés
 * existeront, ils primeront et les contenus démo pourront être masqués.
 */
export function contenusAffichables(): Contenu[] {
  const publics = CONTENUS_DEMO.filter(estPublic);
  if (publics.length > 0) return publics;
  return CONTENUS_DEMO; // préversion : démos étiquetées
}

export function parRubrique(rubrique: Rubrique): Contenu[] {
  return contenusAffichables().filter((c) => c.rubrique === rubrique);
}

export function parType(type: TypeContenu): Contenu[] {
  return contenusAffichables().filter((c) => c.type === type);
}

export function parSlug(slug: string): Contenu | undefined {
  return contenusAffichables().find((c) => c.slug === slug);
}

export function recents(limite = 6): Contenu[] {
  return [...contenusAffichables()]
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
export function rechercher(filtres: FiltresCatalogue): Contenu[] {
  const q = (filtres.texte || '').trim().toLowerCase();
  return contenusAffichables().filter((c) => {
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
