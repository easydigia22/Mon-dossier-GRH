import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Eye, Download, MessageCircle } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { rubriqueMeta } from '../lib/rubriques';
import { useContenus } from '../content/ContentContext';
import { Markdown } from '../lib/Markdown';
import { SourcesBox } from '../components/SourcesBox';
import { NotFoundPage } from './NotFoundPage';
import { formatDate, BadgeTarif } from '../components/ContenuCard';
import { lienWhatsAppCommande, formatPrix } from '../lib/contact';
import type { TypeContenu, Contenu } from '../content/types';

/** Construit les données structurées schema.org (Article + FAQPage + fil d'Ariane) d'un contenu. */
function construireJsonLd(c: Contenu, origin: string, chemin: string): object[] {
  const rub = rubriqueMeta(c.rubrique);
  const abs = (p?: string) => (p ? (/^https?:\/\//i.test(p) ? p : origin + p) : origin + '/portal/brand/logo-simulrh.png');
  const article = {
    '@context': 'https://schema.org',
    '@type': c.type === 'article' ? 'Article' : 'CreativeWork',
    headline: c.titre,
    description: c.resume,
    datePublished: c.datePublication,
    dateModified: c.dateMiseAJour || c.datePublication,
    inLanguage: 'fr-MA',
    author: { '@type': 'Organization', name: c.auteur || 'SimulRH' },
    publisher: {
      '@type': 'Organization',
      name: 'SimulRH',
      logo: { '@type': 'ImageObject', url: origin + '/portal/brand/logo-simulrh.png' },
    },
    image: [abs(c.imageCouverture)],
    mainEntityOfPage: { '@type': 'WebPage', '@id': origin + chemin },
  };
  const blocs: object[] = [article];
  if (c.faq && c.faq.length > 0) {
    blocs.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.reponse },
      })),
    });
  }
  // Fil d'Ariane : Accueil › Rubrique › Titre
  blocs.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${origin}/` },
      ...(rub ? [{ '@type': 'ListItem', position: 2, name: rub.label, item: origin + rub.path }] : []),
      { '@type': 'ListItem', position: rub ? 3 : 2, name: c.titre, item: origin + chemin },
    ],
  });
  return blocs;
}

/** Fiche de détail pour cours, articles, exercices et ressources. */
export const ContenuPage: React.FC<{ typeAttendu?: TypeContenu }> = ({ typeAttendu }) => {
  const { slug } = useParams<{ slug: string }>();
  const { parSlug } = useContenus();
  const contenu = slug ? parSlug(slug) : undefined;
  const [correctionVisible, setCorrectionVisible] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const chemin = typeof window !== 'undefined' ? window.location.pathname : '';
  const jsonLd = contenu ? construireJsonLd(contenu, origin, chemin) : undefined;

  // Hooks appelés inconditionnellement : on fournit un repli si le contenu manque.
  useSeo({
    titre: contenu?.titre || 'Contenu introuvable',
    description: contenu?.resume || "Ce contenu n'existe pas ou n'est plus disponible.",
    image: contenu?.imageCouverture,
    type: contenu?.type === 'article' ? 'article' : 'website',
    jsonLd,
  });

  if (!contenu || (typeAttendu && contenu.type !== typeAttendu)) return <NotFoundPage />;

  const rub = rubriqueMeta(contenu.rubrique);
  const payant = contenu.tarification === 'payant';

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink/60 mb-6" aria-label="Fil d'Ariane">
        <Link to="/" className="hover:text-navy">Accueil</Link>
        <span aria-hidden="true" className="text-ink/30">›</span>
        {rub && (
          <>
            <Link to={rub.path} className="hover:text-navy">{rub.label}</Link>
            <span aria-hidden="true" className="text-ink/30">›</span>
          </>
        )}
        <span className="text-ink/80 font-medium">{contenu.titre}</span>
      </nav>

      {contenu.imageCouverture && (
        <img
          src={contenu.imageCouverture}
          alt=""
          className="w-full aspect-[16/9] object-cover rounded-xl border border-[#ECE3D6] mb-6"
        />
      )}

      <div className="mb-2"><BadgeTarif contenu={contenu} /></div>
      <h1 className="font-display text-3xl font-bold text-navy leading-tight">{contenu.titre}</h1>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[13px] text-ink/55">
        {contenu.auteur && <span>Par {contenu.auteur}</span>}
        {contenu.datePublication && <span>Publié le {formatDate(contenu.datePublication)}</span>}
        {contenu.dateMiseAJour && <span>Mis à jour le {formatDate(contenu.dateMiseAJour)}</span>}
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

        {/* Contenu payant : pas de téléchargement public. On propose la commande
            par WhatsApp ; le document est envoyé après paiement. */}
        {payant && (
          <div className="card-soft p-6 mt-8 bg-amber-50/60 border border-amber-200">
            <h2 className="font-display text-xl font-semibold text-navy">Document payant</h2>
            <p className="text-[14.5px] text-ink/75 mt-1.5 leading-relaxed">
              Ce document est payant{typeof contenu.prix === 'number' ? <> — <strong className="text-amber-800">{formatPrix(contenu.prix)}</strong></> : ''}.
              Commandez-le via WhatsApp : vous recevrez le fichier après confirmation du paiement.
            </p>
            <a
              href={lienWhatsAppCommande(contenu.titre, contenu.prix)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 bg-[#25D366] text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-[#1ebe5a] transition-colors"
            >
              <MessageCircle className="w-5 h-5" /> Commander sur WhatsApp
            </a>
          </div>
        )}

        {/* Fichiers téléchargeables — affichés pour tout contenu GRATUIT qui en
            possède (cours avec support PDF, ressource, etc.). Masqués si payant. */}
        {!payant && contenu.fichiers && contenu.fichiers.length > 0 && (
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
        {!payant && contenu.type === 'ressource' && !(contenu.fichiers && contenu.fichiers.length > 0) && (
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

      {contenu.faq && contenu.faq.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-navy mb-3">Questions fréquentes</h2>
          <div className="space-y-2.5">
            {contenu.faq.map((f, i) => (
              <details key={i} className="card-soft p-4">
                <summary className="font-semibold text-navy cursor-pointer list-none flex items-start gap-2">
                  <span>{f.question}</span>
                </summary>
                <p className="mt-2 text-[15px] text-ink/80 leading-relaxed">{f.reponse}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {contenu.sources && <SourcesBox sources={contenu.sources} />}
    </article>
  );
};
