import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Bandeau affiché tant que le portail ne sert que des contenus de démonstration.
 * Exigence du cahier des charges : les contenus fictifs doivent être identifiés
 * comme tels et ne jamais passer pour des informations réelles.
 */
export const DemoBanner: React.FC = () => (
  <div className="bg-safran-soft border-b border-[#E9A23B]/40 text-[#8a5a12]">
    <div className="max-w-6xl mx-auto px-4 py-2 flex items-start gap-2 text-[12.5px] leading-snug">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#B4563B]" />
      <p>
        <strong>Préversion.</strong> Les contenus affichés sont des <strong>exemples de démonstration</strong>,
        non vérifiés et non contractuels. Aucune information juridique, sociale ou fiscale ici ne doit
        être considérée comme à jour tant qu'elle n'est pas publiée avec sa source officielle.
      </p>
    </div>
  </div>
);
