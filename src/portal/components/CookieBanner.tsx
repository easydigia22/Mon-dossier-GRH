import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { lireConsent, enregistrerConsent, chargerGA, COOKIE_MANAGE_EVENT } from '../lib/consent';

/**
 * Bandeau de consentement aux cookies de mesure d'audience.
 * - Visiteur déjà consentant : charge GA sans réafficher le bandeau.
 * - Pas encore de choix (ou gestion depuis Confidentialité) : affiche le bandeau.
 * GA n'est chargé qu'après « Accepter ».
 */
export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const choix = lireConsent();
    if (choix === 'accepte') chargerGA();
    else if (choix === null) setVisible(true);

    const ouvrir = () => setVisible(true);
    window.addEventListener(COOKIE_MANAGE_EVENT, ouvrir);
    return () => window.removeEventListener(COOKIE_MANAGE_EVENT, ouvrir);
  }, []);

  if (!visible) return null;

  const accepter = () => {
    enregistrerConsent('accepte');
    chargerGA();
    setVisible(false);
  };
  const refuser = () => {
    enregistrerConsent('refuse');
    setVisible(false);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="card-soft max-w-3xl mx-auto p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="w-9 h-9 rounded-xl bg-teal-soft text-teal flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5" />
          </span>
          <p className="text-[13.5px] text-ink/75 leading-relaxed">
            Nous utilisons un cookie de <strong className="text-navy">mesure d'audience</strong> (Google
            Analytics) pour comprendre l'usage du portail et l'améliorer. Aucun profilage publicitaire.
            Vous pouvez accepter ou refuser — voir la{' '}
            <Link to="/confidentialite" className="text-teal font-medium hover:underline">politique de confidentialité</Link>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refuser}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-ink/70 hover:text-navy hover:bg-[#F6F3EC] border border-[#E3D8C8]"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={accepter}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-navy text-white hover:bg-navy-deep"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
};
