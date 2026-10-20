import { useEffect } from 'react';

const SUFFIXE = 'SimulRH — Portail GRH, paie & droit du travail au Maroc';
const SITE_NAME = 'SimulRH';
/** Image de partage par défaut (logo raster) quand la page n'en fournit pas. */
const IMAGE_DEFAUT = '/portal/brand/logo-simulrh.png';

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

/** Transforme un chemin relatif en URL absolue (requis par Open Graph / schema). */
function absolu(path: string, origin: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return origin + (path.startsWith('/') ? path : `/${path}`);
}

/** Injecte (ou met à jour) le bloc JSON-LD de la page. */
function setJsonLd(data: object | object[] | undefined) {
  const ID = 'seo-jsonld';
  const existant = document.getElementById(ID);
  if (!data) {
    existant?.remove();
    return;
  }
  const script = (existant as HTMLScriptElement | null) ?? document.createElement('script');
  script.id = ID;
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(data);
  if (!existant) document.head.appendChild(script);
}

/**
 * Pose le référencement de la page courante : titre, description, Open Graph,
 * Twitter Card, canonical et, en option, un bloc JSON-LD (Article, FAQPage…).
 * Rendu côté client : suffisant pour la préversion ; une préversion SSR/SSG
 * renforcera l'indexation sans changer cette API.
 */
export function useSeo(opts: {
  titre: string;
  description: string;
  /** Image de partage (chemin relatif ou URL absolue). Défaut : logo. */
  image?: string;
  /** Type Open Graph : « article » pour un contenu éditorial, « website » sinon. */
  type?: 'website' | 'article';
  /** Données structurées (schema.org) à injecter : objet unique ou tableau. */
  jsonLd?: object | object[];
}) {
  const { titre, description, image, type = 'website', jsonLd } = opts;
  // On sérialise jsonLd pour une dépendance d'effet stable (évite les ré-injections).
  const jsonLdCle = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const origin = (() => {
      try {
        return window.location.origin;
      } catch {
        return '';
      }
    })();
    const url = origin + (typeof window !== 'undefined' ? window.location.pathname : '');
    const imageAbs = absolu(image || IMAGE_DEFAUT, origin);

    document.title = `${titre} · ${SUFFIXE}`;
    setMeta('name', 'description', description);

    // Open Graph
    setMeta('property', 'og:title', titre);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:image', imageAbs);
    if (url) setMeta('property', 'og:url', url);

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', titre);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageAbs);

    if (url) setCanonical(url);
    setJsonLd(jsonLd);

    return () => setJsonLd(undefined);
  }, [titre, description, image, type, jsonLdCle]);
}
