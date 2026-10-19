import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { RUBRIQUES } from '../lib/rubriques';
import { recents } from '../content/store';
import { ContenuCard } from '../components/ContenuCard';

export const HomePage: React.FC = () => {
  useSeo({
    titre: 'Accueil',
    description:
      'Portail marocain de la gestion des ressources humaines, de la paie, du droit du travail, de la fiscalité et de l’actualité économique. Cours, exercices et QCM pour étudiants, stagiaires et professionnels.',
  });
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const derniers = recents(6);

  const lancerRecherche = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/recherche?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white bg-zellige">
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
      </section>

      {/* Rubriques */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="font-display text-2xl font-bold text-navy mb-2">Explorer par rubrique</h2>
        <p className="text-ink/60 mb-8">Chaque rubrique rassemble cours, cas pratiques et ressources.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RUBRIQUES.map((r) => {
            const Icone = r.icon;
            return (
              <Link key={r.cle} to={r.path} className="card-soft p-6 group hover:-translate-y-0.5 transition-transform">
                <div className="w-11 h-11 rounded-xl bg-teal-soft text-teal flex items-center justify-center mb-4">
                  <Icone className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-navy text-lg mb-1.5 flex items-center gap-1">
                  {r.label}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h3>
                <p className="text-[13.5px] text-ink/70 leading-relaxed">{r.description}</p>
              </Link>
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
            {derniers.map((c) => (
              <ContenuCard key={c.id} contenu={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau application */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="card-soft p-8 sm:p-10 bg-navy text-white bg-zellige flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold mb-2">Passez à la pratique</h2>
            <p className="text-white/80">
              L'application SimulRH simule une entreprise fictive : contrats, présences, congés, moteur de paie
              et bulletins conformes. Idéale pour s'exercer en conditions réelles.
            </p>
          </div>
          <a href="/app" className="shrink-0 inline-flex items-center gap-2 bg-teal hover:bg-[#108a80] text-white font-semibold rounded-xl px-6 py-3 transition-colors">
            Ouvrir l'application <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </>
  );
};
