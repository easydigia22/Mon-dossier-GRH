import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { rechercher } from '../content/store';
import { RUBRIQUES } from '../lib/rubriques';
import { ContenuCard } from '../components/ContenuCard';
import type { Niveau, Public, Rubrique, TypeContenu } from '../content/types';

const PUBLICS: { v: Public; label: string }[] = [
  { v: 'etudiant', label: 'Étudiant' },
  { v: 'stagiaire', label: 'Stagiaire' },
  { v: 'formateur', label: 'Formateur' },
  { v: 'professionnel', label: 'Professionnel' },
];
const NIVEAUX: { v: Niveau; label: string }[] = [
  { v: 'debutant', label: 'Débutant' },
  { v: 'intermediaire', label: 'Intermédiaire' },
  { v: 'avance', label: 'Avancé' },
];

interface CataloguePageProps {
  /** Fixe le type (pages /cours, /exercices, /qcm). Absent = recherche globale. */
  type?: TypeContenu;
  titre: string;
  description: string;
}

export const CataloguePage: React.FC<CataloguePageProps> = ({ type, titre, description }) => {
  useSeo({ titre, description });
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [rubrique, setRubrique] = useState<Rubrique | ''>((params.get('rubrique') as Rubrique) || '');
  const [pub, setPub] = useState<Public | ''>('');
  const [niveau, setNiveau] = useState<Niveau | ''>('');

  const resultats = useMemo(
    () =>
      rechercher({
        texte: q,
        type,
        rubrique: rubrique || undefined,
        public: pub || undefined,
        niveau: niveau || undefined,
      }),
    [q, type, rubrique, pub, niveau]
  );

  const majRecherche = (valeur: string) => {
    setQ(valeur);
    const p = new URLSearchParams(params);
    if (valeur) p.set('q', valeur);
    else p.delete('q');
    setParams(p, { replace: true });
  };

  const selectClasse = 'rounded-lg border border-[#E3D8C8] bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-navy mb-2">{titre}</h1>
      <p className="text-ink/65 mb-8 max-w-2xl">{description}</p>

      <div className="flex flex-col gap-3 mb-8">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="search"
            value={q}
            onChange={(e) => majRecherche(e.target.value)}
            placeholder="Mot-clé, thème…"
            className="w-full rounded-xl pl-10 pr-3 py-2.5 bg-white border border-[#E3D8C8] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-teal"
            aria-label="Rechercher"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={rubrique} onChange={(e) => setRubrique(e.target.value as Rubrique | '')} className={selectClasse} aria-label="Rubrique">
            <option value="">Toutes les rubriques</option>
            {RUBRIQUES.map((r) => (
              <option key={r.cle} value={r.cle}>{r.label}</option>
            ))}
          </select>
          <select value={pub} onChange={(e) => setPub(e.target.value as Public | '')} className={selectClasse} aria-label="Public">
            <option value="">Tous les publics</option>
            {PUBLICS.map((p) => (
              <option key={p.v} value={p.v}>{p.label}</option>
            ))}
          </select>
          <select value={niveau} onChange={(e) => setNiveau(e.target.value as Niveau | '')} className={selectClasse} aria-label="Niveau">
            <option value="">Tous les niveaux</option>
            {NIVEAUX.map((n) => (
              <option key={n.v} value={n.v}>{n.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-ink/55 mb-4">{resultats.length} résultat{resultats.length > 1 ? 's' : ''}</p>

      {resultats.length === 0 ? (
        <div className="card-soft p-10 text-center text-ink/60">Aucun contenu ne correspond à ces critères.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultats.map((c) => (
            <ContenuCard key={c.id} contenu={c} />
          ))}
        </div>
      )}
    </div>
  );
};
