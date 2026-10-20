import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PencilLine, ListChecks, Newspaper, FileDown } from 'lucide-react';
import type { Contenu, TypeContenu } from '../content/types';
import { formatPrix } from '../lib/contact';

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

/** Formate une date ISO (AAAA-MM-JJ) en JJ/MM/AAAA ; renvoie la valeur telle quelle sinon. */
export function formatDate(d?: string): string | undefined {
  if (!d) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : d;
}

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

/** Pastille Gratuit / Payant affichée sur les cartes et en tête de fiche. */
export const BadgeTarif: React.FC<{ contenu: Contenu; className?: string }> = ({ contenu, className = '' }) => {
  const payant = contenu.tarification === 'payant';
  if (payant) {
    return (
      <span className={`inline-flex items-center rounded-full bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 text-[11px] ${className}`}>
        Payant{typeof contenu.prix === 'number' ? ` · ${formatPrix(contenu.prix)}` : ''}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-full bg-green-100 text-green-800 font-semibold px-2 py-0.5 text-[11px] ${className}`}>
      Gratuit
    </span>
  );
};

export const ContenuCard: React.FC<{ contenu: Contenu }> = ({ contenu }) => {
  const Icone = ICONE[contenu.type];
  return (
    <Link
      to={lienContenu(contenu)}
      className="card-soft h-full flex flex-col overflow-hidden hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
    >
      {contenu.imageCouverture && (
        <div className="relative aspect-[16/9] bg-sand">
          <img src={contenu.imageCouverture} alt="" loading="lazy" className="w-full h-full object-cover" />
          <BadgeTarif contenu={contenu} className="absolute top-2 right-2 shadow-sm" />
        </div>
      )}
      <div className="p-5 flex flex-col gap-3 flex-1">
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 text-teal font-semibold">
          <Icone className="w-4 h-4" />
          {LIBELLE_TYPE[contenu.type]}
        </span>
        <span className="text-ink/40">·</span>
        <span className="text-ink/60">{LIBELLE_NIVEAU[contenu.niveau]}</span>
        {!contenu.imageCouverture && <BadgeTarif contenu={contenu} className="ml-auto" />}
      </div>
      <h3 className="font-display font-semibold text-navy text-[17px] leading-snug">{contenu.titre}</h3>
      <p className="text-[13.5px] text-ink/70 leading-relaxed line-clamp-3">{contenu.resume}</p>
      {(contenu.auteur || contenu.datePublication || contenu.dateMiseAJour) && (
        <p className="text-[11.5px] text-ink/50 mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {contenu.auteur && <span className="font-medium text-ink/65">{contenu.auteur}</span>}
          {contenu.auteur && (contenu.datePublication || contenu.dateMiseAJour) && <span className="text-ink/30">·</span>}
          {contenu.dateMiseAJour
            ? <span>Mis à jour le {formatDate(contenu.dateMiseAJour)}</span>
            : contenu.datePublication
              ? <span>Publié le {formatDate(contenu.datePublication)}</span>
              : null}
        </p>
      )}
      </div>
    </Link>
  );
};
