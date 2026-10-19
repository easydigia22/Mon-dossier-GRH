import React from 'react';
import { GraduationCap } from 'lucide-react';

/**
 * Bandeau d'accroche en tête du portail : présente la plateforme et son public.
 * Remplace l'ancien bandeau de préversion.
 */
export const TaglineBar: React.FC = () => (
  <div className="bg-navy text-white/90 border-b border-white/10">
    <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-center text-[12.5px] sm:text-[13px] leading-snug">
      <GraduationCap className="w-4 h-4 shrink-0 text-teal-soft" />
      <p>
        <strong className="font-semibold text-white">La plateforme de référence</strong> pour les étudiants,
        les stagiaires de l'OFPPT, les formateurs et les professionnels —{' '}
        <span className="text-teal-soft font-medium">GRH · Paie · Droit du travail · Fiscalité</span>.
      </p>
    </div>
  </div>
);
