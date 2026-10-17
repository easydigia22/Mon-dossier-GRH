import React from 'react';

/**
 * Logo officiel de la marque « RH PAIE » (icône marine + pièces DH).
 * Source de vérité : brand/app-icon-master.png → généré en public/app-logo.png
 * via `node scripts/generate-icons.mjs`.
 *
 * L'API (size / className) est conservée pour rester compatible avec tous les
 * emplacements existants (Header, AuthGate, LandingView).
 */
export const AppLogo: React.FC<{ size?: number; className?: string }> = ({ size = 38, className = '' }) => {
  return (
    <img
      src="/app-logo.png"
      width={size}
      height={size}
      alt="SIMULRH — Simulateur RH & Paie"
      loading="eager"
      decoding="async"
      className={`shrink-0 rounded-[22%] object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
