import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import { AppLogo } from '../../components/common/AppLogo';
import { RUBRIQUES } from '../lib/rubriques';
import { TaglineBar } from './TaglineBar';
import { MENTION_COPYRIGHT } from '../../services/branding';

const LIENS_PRINCIPAUX = [
  { to: '/cours', label: 'Cours' },
  { to: '/exercices', label: 'Exercices' },
  { to: '/qcm', label: 'QCM' },
];

/** Enveloppe commune à toutes les pages publiques du portail. */
export const PortalLayout: React.FC = () => {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const location = useLocation();

  // Ferme le menu mobile à chaque changement de page.
  // Corps en bloc : éviter que la flèche ne renvoie la valeur de setMenuOuvert()
  // à React comme fausse fonction de nettoyage (cf. ScrollToTop dans PortalApp).
  React.useEffect(() => {
    setMenuOuvert(false);
  }, [location.pathname]);

  const lienClasse = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-teal-soft text-navy' : 'text-ink/80 hover:text-navy hover:bg-sand'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink" style={{ fontFamily: 'var(--font-sans)' }}>
      <TaglineBar />

      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-[#ECE3D6]">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <AppLogo size={34} />
            <span className="flex flex-col leading-tight">
              <span className="font-display font-bold text-navy text-lg">SimulRH</span>
              <span className="text-[10.5px] text-ink/60 -mt-0.5 hidden sm:block">Portail GRH · Paie · Droit · Fiscalité</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Rubriques">
            {RUBRIQUES.slice(0, 5).map((r) => (
              <NavLink key={r.cle} to={r.path} className={lienClasse}>{r.label}</NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-1">
            {LIENS_PRINCIPAUX.map((l) => (
              <NavLink key={l.to} to={l.to} className={lienClasse}>{l.label}</NavLink>
            ))}
            <a
              href="/app"
              className="ml-2 inline-flex items-center gap-1.5 bg-navy text-white text-sm font-semibold rounded-lg px-3.5 py-2 hover:bg-navy-deep transition-colors"
            >
              <LogIn className="w-4 h-4" />
              L'application
            </a>
          </div>

          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-navy hover:bg-sand"
            onClick={() => setMenuOuvert((v) => !v)}
            aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOuvert}
          >
            {menuOuvert ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOuvert && (
          <nav className="lg:hidden border-t border-[#ECE3D6] bg-cream px-4 py-3 space-y-1" aria-label="Menu mobile">
            {RUBRIQUES.map((r) => (
              <NavLink key={r.cle} to={r.path} className={lienClasse}>{r.label}</NavLink>
            ))}
            <div className="h-px bg-[#ECE3D6] my-2" />
            {LIENS_PRINCIPAUX.map((l) => (
              <NavLink key={l.to} to={l.to} className={lienClasse}>{l.label}</NavLink>
            ))}
            <a href="/app" className="mt-2 flex items-center gap-1.5 bg-navy text-white text-sm font-semibold rounded-lg px-3.5 py-2.5">
              <LogIn className="w-4 h-4" /> Ouvrir l'application
            </a>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-deep text-white/80 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AppLogo size={28} />
              <span className="font-display font-bold text-white text-base">SimulRH</span>
            </div>
            <p className="text-white/60 text-[13px] leading-relaxed">
              Portail pédagogique marocain dédié à la GRH, à la paie, au droit du travail et à la fiscalité.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-[13px] uppercase tracking-wide">Rubriques</h3>
            <ul className="space-y-1.5 text-[13px]">
              {RUBRIQUES.map((r) => (
                <li key={r.cle}><Link to={r.path} className="hover:text-white">{r.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-[13px] uppercase tracking-wide">Apprendre</h3>
            <ul className="space-y-1.5 text-[13px]">
              <li><Link to="/cours" className="hover:text-white">Cours</Link></li>
              <li><Link to="/exercices" className="hover:text-white">Exercices</Link></li>
              <li><Link to="/qcm" className="hover:text-white">QCM</Link></li>
              <li><a href="/app" className="hover:text-white">Application SimulRH</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-[13px] uppercase tracking-wide">Informations</h3>
            <ul className="space-y-1.5 text-[13px]">
              <li><Link to="/a-propos" className="hover:text-white">À propos</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/mentions-legales" className="hover:text-white">Mentions légales</Link></li>
              <li><Link to="/confidentialite" className="hover:text-white">Confidentialité</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="max-w-6xl mx-auto px-4 py-4 text-[11.5px] text-white/50">{MENTION_COPYRIGHT}</p>
        </div>
      </footer>
    </div>
  );
};
