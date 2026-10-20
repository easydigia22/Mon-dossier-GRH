import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Download } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { useContenus } from '../content/ContentContext';
import { Markdown } from '../lib/Markdown';
import { SourcesBox } from '../components/SourcesBox';
import { NotFoundPage } from './NotFoundPage';
import type { TypeContenu } from '../content/types';

/** Fiche de détail pour cours, articles, exercices et ressources. */
export const ContenuPage: React.FC<{ typeAttendu?: TypeContenu }> = ({ typeAttendu }) => {
  const { slug } = useParams<{ slug: string }>();
  const { parSlug } = useContenus();
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

        {/* Fichiers téléchargeables — affichés pour tout contenu qui en possède
            (cours avec support PDF, ressource, etc.). */}
        {contenu.fichiers && contenu.fichiers.length > 0 && (
          <div className="space-y-3 mt-8">
            <h2 className="font-display text-xl font-semibold text-navy">Téléchargements</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {contenu.fichiers.map((f) => (
                <a
                  key={f.url}
                  href={f.url}
                  download
                  dir={f.langue === 'ar' ? 'rtl' : 'ltr'}
                  className="card-soft p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                >
                  <span className="w-10 h-10 rounded-lg bg-teal-soft text-teal flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-navy truncate">{f.label}</span>
                    <span className="block text-[12.5px] text-ink/55">
                      {f.langue === 'ar' ? 'العربية' : 'Français'}{f.taille ? ` · ${f.taille}` : ''}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Ressource sans fichier téléversé : repli sur l'ancien champ `fichierUrl`. */}
        {contenu.type === 'ressource' && !(contenu.fichiers && contenu.fichiers.length > 0) && (
          <div className="card-soft p-5 flex items-center justify-between gap-4 mt-8">
            <div>
              <p className="font-medium text-navy">Document téléchargeable</p>
              <p className="text-[13px] text-ink/60">Gabarit à personnaliser.</p>
            </div>
            {contenu.fichierUrl ? (
              <a href={contenu.fichierUrl} download className="inline-flex items-center gap-2 bg-teal text-white font-semibold rounded-lg px-4 py-2.5 hover:bg-[#108a80]">
                <Download className="w-4 h-4" /> Télécharger
              </a>
            ) : (
              <span className="text-[13px] text-ink/50 italic">Fichier non disponible</span>
            )}
          </div>
        )}
      </div>

      {contenu.sources && <SourcesBox sources={contenu.sources} />}
    </article>
  );
};
