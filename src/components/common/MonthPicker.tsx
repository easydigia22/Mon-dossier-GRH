import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MOIS_LONGS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
];

interface MonthPickerProps {
  /** Période au format "AAAA-MM" */
  value: string;
  onChange: (periode: string) => void;
}

function formaterLabel(periode: string): string {
  const [annee, mois] = periode.split('-').map(Number);
  if (!annee || !mois) return periode;
  return `${MOIS_LONGS[mois - 1]} ${annee}`;
}

/**
 * Sélecteur de mois sous forme de calendrier (grille de 12 mois + navigation par année),
 * remplace l'ancien <select> limité à une liste fixe de 3 mois.
 */
export const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange }) => {
  const [ouvert, setOuvert] = useState(false);
  const [anneeAffichee, setAnneeAffichee] = useState(() => Number(value.split('-')[0]) || new Date().getFullYear());
  const conteneurRef = useRef<HTMLDivElement>(null);

  const [anneeActive, moisActif] = value.split('-').map(Number);

  useEffect(() => {
    if (!ouvert) return;
    const handleClickExterieur = (e: MouseEvent) => {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false);
    };
    document.addEventListener('mousedown', handleClickExterieur);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickExterieur);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ouvert]);

  const ouvrir = () => {
    setAnneeAffichee(anneeActive || new Date().getFullYear());
    setOuvert(true);
  };

  const choisirMois = (indexMois: number) => {
    const periode = `${anneeAffichee}-${String(indexMois + 1).padStart(2, '0')}`;
    onChange(periode);
    setOuvert(false);
  };

  return (
    <div className="relative" ref={conteneurRef}>
      <button
        type="button"
        onClick={() => (ouvert ? setOuvert(false) : ouvrir())}
        className="flex items-center gap-2 bg-[#F4F7FA] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#1C2459]/30 transition-colors"
        aria-haspopup="dialog"
        aria-expanded={ouvert}
      >
        <Calendar className="w-4 h-4 text-[#1C2459]" />
        <span className="text-xs font-semibold text-[#1C2459] whitespace-nowrap">Mois :</span>
        <span className="text-xs font-medium text-slate-800 whitespace-nowrap">{formaterLabel(value)}</span>
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-label="Choisir un mois"
          className="absolute top-full left-0 mt-1.5 z-50 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setAnneeAffichee((a) => a - 1)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#1C2459] transition-colors"
              aria-label="Année précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[#1C2459]">{anneeAffichee}</span>
            <button
              type="button"
              onClick={() => setAnneeAffichee((a) => a + 1)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#1C2459] transition-colors"
              aria-label="Année suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MOIS_COURTS.map((libelle, index) => {
              const estSelectionne = anneeAffichee === anneeActive && index + 1 === moisActif;
              return (
                <button
                  key={libelle}
                  type="button"
                  onClick={() => choisirMois(index)}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    estSelectionne
                      ? 'bg-[#1C2459] text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#1C2459]'
                  }`}
                >
                  {libelle}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              const auj = new Date();
              setAnneeAffichee(auj.getFullYear());
              choisirMois(auj.getMonth());
            }}
            className="w-full mt-2 pt-2 border-t border-slate-100 text-[11px] font-medium text-[#149D92] hover:text-[#108a80] transition-colors"
          >
            Revenir au mois actuel
          </button>
        </div>
      )}
    </div>
  );
};
