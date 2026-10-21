/**
 * Gestion du consentement aux cookies de mesure d'audience (Google Analytics).
 * GA n'est chargé QUE si l'utilisateur a accepté (loi 09-08 / CNDP, RGPD).
 */

const CLE = 'simulrh-consent-cookies';
const GA_ID = 'G-0J8W18NTMF';

/** Événement pour rouvrir le bandeau depuis la page Confidentialité. */
export const COOKIE_MANAGE_EVENT = 'simulrh-cookies-gerer';

export type ChoixConsent = 'accepte' | 'refuse';

let gaCharge = false;

export function lireConsent(): ChoixConsent | null {
  try {
    const v = localStorage.getItem(CLE);
    return v === 'accepte' || v === 'refuse' ? v : null;
  } catch {
    return null;
  }
}

export function enregistrerConsent(choix: ChoixConsent): void {
  try {
    localStorage.setItem(CLE, choix);
  } catch {
    /* stockage indisponible : sans effet, le bandeau se reproposera */
  }
}

export function effacerConsent(): void {
  try {
    localStorage.removeItem(CLE);
  } catch {
    /* sans effet */
  }
}

/**
 * Charge Google Analytics (gtag) dynamiquement, une seule fois, et envoie la vue
 * de la page courante. Les navigations suivantes sont suivies par ScrollToTop.
 */
export function chargerGA(): void {
  if (gaCharge) return;
  gaCharge = true;

  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag('js', new Date());
  w.gtag('config', GA_ID, { send_page_view: false });

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  w.gtag('event', 'page_view', {
    page_path: window.location.pathname + window.location.search,
    page_location: window.location.href,
    page_title: document.title,
  });
}
