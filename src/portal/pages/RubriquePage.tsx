import React from 'react';
import { useSeo } from '../lib/seo';
import { rubriqueMeta } from '../lib/rubriques';
import { useContenus } from '../content/ContentContext';
import { ContenuCard } from '../components/ContenuCard';
import type { Rubrique } from '../content/types';

export const RubriquePage: React.FC<{ rubrique: Rubrique }> = ({ rubrique }) => {
  const meta = rubriqueMeta(rubrique)!;
  useSeo({ titre: meta.label, description: meta.description });
  const { parRubrique } = useContenus();
  const contenus = parRubrique(rubrique);
  const Icone = meta.icon;

  return (
    <>
      <section className="relative overflow-hidden bg-navy-deep text-white">
        {/* Illustration de la rubrique posée en fond : vidéo si disponible, sinon photo. */}
        {meta.video ? (
          <video
            className="absolute inset-0 w-full h-full object-cover opacity-[0.65]"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={meta.image}
            aria-hidden="true"
          >
            <source src={meta.video} type="video/mp4" />
          </video>
        ) : (
          <img
            src={meta.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-[0.65]"
          />
        )}
        {/* Dégradé marine allégé : assez dense à gauche pour la lisibilité, dégagé à droite. */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-deep/90 via-navy-deep/60 to-navy-deep/25" />
        <div className="absolute inset-0 zellige-layer opacity-40" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 py-14 sm:py-16 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <Icone className="w-7 h-7 text-teal-soft" />
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold drop-shadow-sm">{meta.label}</h1>
            <p className="mt-2 text-white/85 max-w-2xl">{meta.description}</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-2 mb-10">
          {meta.sousThemes.map((s) => (
            <span key={s} className="text-sm bg-sand text-navy/90 rounded-full px-3 py-1.5 border border-[#ECE3D6]">{s}</span>
          ))}
        </div>

        {meta.video && (
          <div className="mb-12">
            <h2 className="font-display text-xl font-bold text-navy mb-1.5">{meta.label} en vidéo</h2>
            <p className="text-ink/60 text-[14px] mb-4">Un aperçu animé pour mettre en contexte la rubrique.</p>
            <figure className="card-soft overflow-hidden">
              <div className="aspect-video bg-navy-deep">
                <video
                  className="w-full h-full object-contain"
                  controls
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={meta.image}
                >
                  <source src={meta.video} type="video/mp4" />
                  Votre navigateur ne prend pas en charge la lecture vidéo.
                </video>
              </div>
            </figure>
          </div>
        )}

        <h2 className="font-display text-xl font-bold text-navy mb-5">Contenus de la rubrique</h2>
        {contenus.length === 0 ? (
          <div className="card-soft p-10 text-center text-ink/60">
            Aucun contenu publié pour le moment dans cette rubrique.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contenus.map((c) => (
              <ContenuCard key={c.id} contenu={c} />
            ))}
          </div>
        )}
      </section>
    </>
  );
};
