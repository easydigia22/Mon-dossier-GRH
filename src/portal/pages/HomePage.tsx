import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { RUBRIQUES } from '../lib/rubriques';
import { useContenus } from '../content/ContentContext';
import { ContenuCard } from '../components/ContenuCard';
import { HeroCarousel } from '../components/HeroCarousel';
import { Reveal } from '../components/Reveal';
import { AvisSection } from '../components/AvisSection';
import { LeadMagnet } from '../components/LeadMagnet';

export const HomePage: React.FC = () => {
  useSeo({
    titre: 'Accueil',
    description:
      'Portail marocain de la gestion des ressources humaines, de la paie, du droit du travail, de la fiscalité et de l’actualité économique. Cours, exercices et QCM pour étudiants, stagiaires et professionnels.',
  });
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { recents } = useContenus();
  const derniers = recents(6);

  const lancerRecherche = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/recherche?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      {/* Hero — carrousel de photos RH */}
      <HeroCarousel>
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <p className="text-teal-soft/90 text-sm font-semibold uppercase tracking-wider mb-3">Maroc · GRH · Paie · Droit · Fiscalité</p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold max-w-3xl leading-tight">
            Comprendre la paie et la gestion du personnel au Maroc, pas à pas.
          </h1>
          <p className="mt-5 text-white/80 text-lg max-w-2xl leading-relaxed">
            Cours clairs, exercices corrigés et QCM pour les étudiants, les stagiaires de l'OFPPT,
            les formateurs et les professionnels RH, paie et comptabilité.
          </p>

          <form onSubmit={lancerRecherche} className="mt-8 max-w-xl flex gap-2" role="search">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un cours, un exercice, un thème…"
                className="w-full rounded-xl pl-10 pr-3 py-3 text-ink bg-white placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-teal"
                aria-label="Rechercher dans le portail"
              />
            </div>
            <button type="submit" className="bg-teal hover:bg-[#108a80] text-white font-semibold rounded-xl px-5 transition-colors">
              Rechercher
            </button>
          </form>
        </div>
      </HeroCarousel>

      {/* Rubriques */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="font-display text-2xl font-bold text-navy mb-2">Explorer par rubrique</h2>
        <p className="text-ink/60 mb-8">Chaque rubrique rassemble cours, cas pratiques et ressources.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RUBRIQUES.map((r, i) => {
            const Icone = r.icon;
            return (
              <Reveal key={r.cle} delay={i * 70} className="h-full">
                <Link to={r.path} className="card-soft group hover:-translate-y-0.5 transition-transform h-full block overflow-hidden">
                  <div className="relative aspect-[16/10] overflow-hidden bg-teal-soft">
                    <img
                      src={r.image}
                      alt={r.label}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/55 via-navy/10 to-transparent" />
                    <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-white/95 text-teal shadow-sm flex items-center justify-center backdrop-blur-sm">
                      <Icone className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display font-semibold text-navy text-lg mb-1.5 flex items-center gap-1">
                      {r.label}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </h3>
                    <p className="text-[13.5px] text-ink/70 leading-relaxed">{r.description}</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Contenus récents */}
      <section className="bg-sand/60 border-y border-[#ECE3D6]">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-navy mb-1">Récemment publié</h2>
              <p className="text-ink/60">Les derniers cours, exercices et articles.</p>
            </div>
            <Link to="/recherche" className="hidden sm:inline-flex items-center gap-1 text-teal font-semibold text-sm hover:underline">
              Tout voir <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {derniers.map((c, i) => (
              <Reveal key={c.id} delay={i * 70} className="h-full">
                <ContenuCard contenu={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Lead magnet — guide PDF contre e-mail (opt-in) */}
      <LeadMagnet />

      {/* Avis / témoignages (vrais avis modérés, sinon exemples étiquetés) */}
      <AvisSection />

      {/* Bandeau application */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <Reveal>
          <div className="overflow-hidden rounded-2xl shadow-xl bg-navy text-white bg-zellige grid md:grid-cols-2 items-center gap-8 p-8 sm:p-10">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-bold mb-2">Passez à la pratique</h2>
              <p className="text-white/80">
                L'application SimulRH simule une entreprise fictive : contrats, présences, congés, moteur de paie
                et bulletins conformes. Idéale pour s'exercer en conditions réelles.
              </p>
              <a href="/app" className="mt-6 inline-flex items-center gap-2 bg-teal hover:bg-[#108a80] text-white font-semibold rounded-xl px-6 py-3 transition-colors">
                Ouvrir l'application <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="relative">
              <img
                src="/portal/hero/hero-casa-ecran.jpg"
                alt="Tableau de bord RH de l'application SimulRH : effectif, présences, congés et masse salariale"
                className="rounded-xl shadow-2xl ring-1 ring-white/15 w-full h-auto"
                loading="lazy"
                width={1672}
                height={941}
              />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
};
