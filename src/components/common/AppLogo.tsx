import React from 'react';

/**
 * Pictogramme original combinant :
 * 1. Le dossier administratif (classeur/chemise)
 * 2. La personne (buste / collaborateur)
 * 3. Le document officiel (feuille avec lignes de paie et tampon)
 */
export const AppLogo: React.FC<{ size?: number; className?: string }> = ({ size = 38, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Mon Dossier Administratif Logo"
    >
      {/* 1. Chemise / Dossier administratif (fond marine) */}
      <path
        d="M6 14C6 11.7909 7.79086 10 10 10H19.1716C20.2324 10 21.2498 10.4214 22 11.1716L24.8284 14H38C40.2091 14 42 15.7909 42 18V38C42 40.2091 40.2091 42 38 42H10C7.79086 42 6 40.2091 6 38V14Z"
        fill="#16324F"
      />
      {/* 2. Document officiel inséré dans le dossier (blanc cassé & turquoise) */}
      <rect x="18" y="6" width="22" height="28" rx="2" fill="#F4F7FA" stroke="#149D92" strokeWidth="1.5" />
      {/* Lignes de texte du document */}
      <line x1="22" y1="12" x2="34" y2="12" stroke="#16324F" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="16" x2="32" y2="16" stroke="#149D92" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="20" x2="28" y2="20" stroke="#16324F" strokeWidth="1.2" strokeLinecap="round" />

      {/* 3. Silhouette Personne / Salarié (turquoise vif au premier plan) */}
      <circle cx="16" cy="24" r="5" fill="#149D92" />
      <path
        d="M9 38C9 33.5817 12.5817 30 17 30H19C23.4183 30 27 33.5817 27 38V39H9V38Z"
        fill="#149D92"
      />

      {/* Tampon de validation pédagogique discret */}
      <circle cx="34" cy="26" r="3" stroke="#E9A23B" strokeWidth="1.2" />
      <path d="M33 26L33.8 26.8L35.2 25.2" stroke="#E9A23B" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
