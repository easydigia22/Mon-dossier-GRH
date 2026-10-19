import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import type { Source } from '../content/types';

const LIBELLE_STATUT: Record<NonNullable<Source['statutTexte']>, string> = {
  adopte: 'Texte adopté',
  propose: 'Mesure proposée (non en vigueur)',
  en_vigueur: 'En vigueur',
};

/**
 * Encadré des sources d'un contenu réglementaire. Impose la traçabilité exigée :
 * référence, lien, date de vérification, période d'application et statut du texte.
 */
export const SourcesBox: React.FC<{ sources: Source[] }> = ({ sources }) => {
  if (!sources.length) return null;
  return (
    <aside className="card-soft p-5 bg-teal-soft/40 border-teal/30 mt-8">
      <h2 className="flex items-center gap-2 font-display font-semibold text-navy text-base mb-3">
        <ShieldCheck className="w-5 h-5 text-teal" />
        Sources et références
      </h2>
      <ul className="space-y-3">
        {sources.map((s, i) => (
          <li key={i} className="text-[13.5px] text-ink/80">
            <div className="font-medium text-navy">
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                  {s.intitule} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                s.intitule
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-ink/60 text-[12.5px]">
              {s.statutTexte && <span>{LIBELLE_STATUT[s.statutTexte]}</span>}
              {s.periodeApplication && <span>Application : {s.periodeApplication}</span>}
              <span>Vérifié le : {s.dateVerification || '—'}</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
};
