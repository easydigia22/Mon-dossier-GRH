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
      <section className="bg-navy text-white bg-zellige">
        <div className="max-w-6xl mx-auto px-4 py-12 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Icone className="w-7 h-7 text-teal-soft" />
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">{meta.label}</h1>
            <p className="mt-2 text-white/80 max-w-2xl">{meta.description}</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-wrap gap-2 mb-10">
          {meta.sousThemes.map((s) => (
            <span key={s} className="text-sm bg-sand text-navy/90 rounded-full px-3 py-1.5 border border-[#ECE3D6]">{s}</span>
          ))}
        </div>

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
