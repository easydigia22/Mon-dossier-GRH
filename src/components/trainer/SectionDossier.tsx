import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SectionDossierProps {
  titre: string;
  /** Affiché entre parenthèses à côté du titre (ex. nombre de salariés). */
  compteur?: number;
  ouvertParDefaut?: boolean;
  /** Si vrai, le corps n'est pas rendu et messageVide s'affiche à la place. */
  vide?: boolean;
  messageVide?: string;
  children: React.ReactNode;
}

/** Section pliable d'un dossier stagiaire, en lecture seule. */
export const SectionDossier: React.FC<SectionDossierProps> = ({
  titre,
  compteur,
  ouvertParDefaut = false,
  vide = false,
  messageVide = 'Rien à afficher pour l\'instant.',
  children
}) => {
  const [ouvert, setOuvert] = useState(ouvertParDefaut);

  return (
    <div className="border border-[#ECE3D6] rounded-lg bg-white">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-[#1C2459] flex items-center gap-2">
          {ouvert ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {titre}
          {typeof compteur === 'number' && (
            <span className="text-xs font-normal text-slate-500">({compteur})</span>
          )}
        </span>
      </button>
      {ouvert && (
        <div className="px-4 pb-4 text-xs">
          {vide ? <p className="text-slate-500 italic">{messageVide}</p> : children}
        </div>
      )}
    </div>
  );
};
