import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Download } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { parSlug } from '../content/store';
import { Markdown } from '../lib/Markdown';
import { SourcesBox } from '../components/SourcesBox';
import { NotFoundPage } from './NotFoundPage';
import type { TypeContenu } from '../content/types';

/** Fiche de détail pour cours, articles, exercices et ressources. */
export const ContenuPage: React.FC<{ typeAttendu?: TypeContenu }> = ({ typeAttendu }) => {
  const { slug } = useParams<{ slug: string }>();
  const contenu = slug ? parSlug(slug) : undefined;
  const [correctionVisible, setCorrectionVisible] = useState(false);

  // Hooks appelés inconditionnellement : on fournit un repli si le contenu manque.
  useSeo({
    titre: contenu?.titre || 'Contenu introuvable',
    description: contenu?.resume || "Ce contenu n'existe pas ou n'est plus disponible.",
  });

  if (!contenu || (typeAttendu && contenu.type !== typeAttendu)) return <NotFoundPage />;

  const retour =
    contenu.type === 'exercice' ? '/exercices' : contenu.type === 'article' ? '/actualites' : contenu.type === 'ressource' ? '/ressources' : '/cours';

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <Link to={retour} className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-navy mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <h1 className="font-display text-3xl font-bold text-navy leading-tight">{contenu.titre}</h1>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[13px] text-ink/55">
        {contenu.auteur && <span>Par {contenu.auteur}</span>}
        {contenu.datePublication && <span>Publié le {contenu.datePublication}</span>}
        {contenu.dateMiseAJour && <span>Mis à jour le {contenu.dateMiseAJour}</span>}
      </div>

      <p className="mt-6 text-lg text-ink/80 leading-relaxed">{contenu.resume}</p>

      <div className="mt-6">
        {contenu.corps && <Markdown source={contenu.corps} />}

        {contenu.type === 'exercice' && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-xl font-semibold text-navy mb-2">Énoncé</h2>
              <p className="text-[15px] leading-relaxed text-ink">{contenu.enonce}</p>
            </div>
            {!correctionVisible ? (
              <button
                onClick={() => setCorrectionVisible(true)}
                className="inline-flex items-center gap-2 bg-navy text-white font-semibold rounded-lg px-4 py-2.5 hover:bg-navy-deep transition-colors"
              >
                <Eye className="w-4 h-4" /> Afficher la correction
              </button>
            ) : (
              <div className="card-soft p-5 bg-teal-soft/40">
                <h2 className="font-display text-xl font-semibold text-navy mb-2">Correction</h2>
                <p className="text-[15px] leading-relaxed text-ink">{contenu.correction}</p>
              </div>
            )}
          </div>
        )}

        {contenu.type === 'ressource' && (
          <div className="card-soft p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-navy">Document téléchargeable</p>
              <p className="text-[13px] text-ink/60">Gabarit à personnaliser.</p>
            </div>
            {contenu.fichierUrl ? (
              <a href={contenu.fichierUrl} download className="inline-flex items-center gap-2 bg-teal text-white font-semibold rounded-lg px-4 py-2.5 hover:bg-[#108a80]">
                <Download className="w-4 h-4" /> Télécharger
              </a>
            ) : (
              <span className="text-[13px] text-ink/50 italic">Fichier non disponible (démo)</span>
            )}
          </div>
        )}
      </div>

      {contenu.sources && <SourcesBox sources={contenu.sources} />}
    </article>
  );
};
