/**
 * Coordonnées de contact du portail. Centralisées ici pour être modifiées en un
 * seul endroit (numéro WhatsApp des commandes de documents payants, etc.).
 */

/** Numéro WhatsApp au format international SANS « + » ni espaces (requis par wa.me). */
export const WHATSAPP_NUMERO = '212781995665';

/** Formate un prix en dirhams pour l'affichage (ex. 49 → « 49 MAD »). */
export function formatPrix(prix?: number): string {
  if (typeof prix !== 'number' || Number.isNaN(prix)) return '';
  return `${prix} MAD`;
}

/**
 * Lien wa.me pré-rempli pour commander un document payant. Le message reprend le
 * titre et, si connu, le prix — l'admin reçoit une demande déjà qualifiée.
 */
export function lienWhatsAppCommande(titre: string, prix?: number): string {
  const prixTxt = typeof prix === 'number' ? ` (${formatPrix(prix)})` : '';
  const message = `Bonjour, je souhaite commander le document « ${titre} »${prixTxt}. Merci de m'indiquer les modalités de paiement.`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(message)}`;
}
