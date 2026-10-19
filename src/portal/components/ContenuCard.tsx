import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PencilLine, ListChecks, Newspaper, FileDown } from 'lucide-react';
import type { Contenu, TypeContenu } from '../content/types';

const ICONE: Record<TypeContenu, React.ComponentType<{ className?: string }>> = {
  cours: BookOpen,
  exercice: PencilLine,
  qcm: ListChecks,
  article: Newspaper,
  ressource: FileDown,
};

const LIBELLE_TYPE: Record<TypeContenu, string> = {
  cours: 'Cours',
  exercice: 'Exercice',
  qcm: 'QCM',
  article: 'Article',
  ressource: 'Ressource',
};

const LIBELLE_NIVEAU: Record<Contenu['niveau'], string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

/** URL de détail selon le type de contenu. */
export function lienContenu(c: Contenu): string {
  const base: Record<TypeContenu, string> = {
    cours: '/cours',
    exercice: '/exercices',
    qcm: '/qcm',
    article: '/actualites',
    ressource: '/ressources',
  };
  return `${base[c.type]}/${c.slug}`;
}

export const ContenuCard: React.FC<{ contenu: Contenu }> = ({ contenu }) => {
  const Icone = ICONE[contenu.type];
  return (
    <Link
      to={lienContenu(contenu)}
      className="card-soft p-5 h-full flex flex-col gap-3 hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-teal font-semibold">
          <Icone className="w-4 h-4" />
          {LIBELLE_TYPE[contenu.type]}
        </span>
        <span className="text-ink/40">·</span>
        <span className="text-ink/60">{LIBELLE_NIVEAU[contenu.niveau]}</span>
      </div>
      <h3 className="font-display font-semibold text-navy text-[17px] leading-snug">{contenu.titre}</h3>
      <p className="text-[13.5px] text-ink/70 leading-relaxed line-clamp-3">{contenu.resume}</p>
      {contenu.dateMiseAJour && (
        <p className="text-[11.5px] text-ink/45 mt-auto">Mis à jour le {contenu.dateMiseAJour}</p>
      )}
    </Link>
  );
};
