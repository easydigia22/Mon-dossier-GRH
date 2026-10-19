import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Contenu, Rubrique, TypeContenu } from './types';
import {
  CONTENUS_INTEGRES,
  filtrerRubrique,
  filtrerType,
  trouverParSlug,
  trierRecents,
  rechercherDans,
  type FiltresCatalogue,
} from './store';
import { fetchContenusPublies } from './supabaseContent';

interface ContentApi {
  /** Vrai tant que le chargement Supabase initial n'est pas terminé. */
  loading: boolean;
  contenus: Contenu[];
  parRubrique: (r: Rubrique) => Contenu[];
  parType: (t: TypeContenu) => Contenu[];
  parSlug: (slug: string) => Contenu | undefined;
  recents: (limite?: number) => Contenu[];
  rechercher: (f: FiltresCatalogue) => Contenu[];
}

const ContentContext = createContext<ContentApi | null>(null);

/** Fusionne contenus intégrés et contenus Supabase ; Supabase prime en cas de même slug. */
function fusionner(integres: Contenu[], supabase: Contenu[]): Contenu[] {
  const parSlug = new Map<string, Contenu>();
  for (const c of integres) parSlug.set(c.slug, c);
  for (const c of supabase) parSlug.set(c.slug, c); // écrase l'intégré de même slug
  return Array.from(parSlug.values());
}

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contenus, setContenus] = useState<Contenu[]>(CONTENUS_INTEGRES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let annule = false;
    fetchContenusPublies()
      .then((sup) => {
        if (!annule && sup.length > 0) setContenus(fusionner(CONTENUS_INTEGRES, sup));
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
  }, []);

  const api = useMemo<ContentApi>(
    () => ({
      loading,
      contenus,
      parRubrique: (r) => filtrerRubrique(contenus, r),
      parType: (t) => filtrerType(contenus, t),
      parSlug: (slug) => trouverParSlug(contenus, slug),
      recents: (limite) => trierRecents(contenus, limite),
      rechercher: (f) => rechercherDans(contenus, f),
    }),
    [contenus, loading]
  );

  return <ContentContext.Provider value={api}>{children}</ContentContext.Provider>;
};

export function useContenus(): ContentApi {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContenus doit être utilisé dans un ContentProvider.');
  return ctx;
}
