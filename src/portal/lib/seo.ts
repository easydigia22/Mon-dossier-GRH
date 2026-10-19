import { useEffect } from 'react';

const SUFFIXE = 'SimulRH — Portail GRH, paie & droit du travail au Maroc';

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

/**
 * Pose le titre et la description de la page courante (référencement).
 * Rendu côté client : suffisant pour la préversion ; une préversion SSR/SSG
 * (Phase 2) renforcera l'indexation sans changer cette API.
 */
export function useSeo(opts: { titre: string; description: string }) {
  useEffect(() => {
    const titreComplet = `${opts.titre} · ${SUFFIXE}`;
    document.title = titreComplet;
    setMeta('name', 'description', opts.description);
    setMeta('property', 'og:title', opts.titre);
    setMeta('property', 'og:description', opts.description);
    setMeta('property', 'og:type', 'website');
    try {
      setCanonical(window.location.origin + window.location.pathname);
    } catch {
      /* origine indisponible (SSR éventuel) : sans effet */
    }
  }, [opts.titre, opts.description]);
}
