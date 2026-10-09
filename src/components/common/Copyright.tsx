import React from 'react';
import { MENTION_COPYRIGHT } from '../../services/branding';

export { MENTION_COPYRIGHT };

interface CopyrightProps {
  /** Classes additionnelles pour positionner la mention selon l'écran. */
  className?: string;
}

/** Mention de propriété affichée en bas d'une interface. */
export const Copyright: React.FC<CopyrightProps> = ({ className = '' }) => (
  <p className={`text-[11px] text-slate-400 text-center ${className}`.trim()}>
    {MENTION_COPYRIGHT}
  </p>
);

/**
 * Variante imprimée : masquée à l'écran, répétée en bas de chaque feuille
 * (les éléments en position fixe sont rejoués sur chaque page par le moteur
 * d'impression). Montée une seule fois, au niveau de l'application.
 */
export const CopyrightImpression: React.FC = () => (
  <div className="hidden print:block fixed bottom-0 left-0 right-0 bg-white text-center text-[8px] text-slate-500 py-1">
    {MENTION_COPYRIGHT}
  </div>
);
