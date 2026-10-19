import React, { useEffect, useRef, useState } from 'react';

/**
 * Hero à image de fond défilante (carrousel), inspiré de rhmaroc.ma.
 * - fondu enchaîné entre les photos + léger zoom lent « Ken Burns »
 * - voile dégradé navy par-dessus pour garder le texte lisible
 * - points de navigation cliquables
 * - défilement en pause quand l'onglet n'est pas visible
 * - respecte prefers-reduced-motion (pas d'auto-play ni de zoom)
 * Les photos sont décoratives ; le vrai contenu est passé via `children`.
 */

const IMAGES = [
  '/portal/hero/hero-casa-dashboard.jpg', // présentation tableau de bord RH, skyline Casablanca
  '/portal/hero/hero-casa-reunion.jpg', // réunion d'équipe, vue sur Casablanca
  '/portal/hero/hero-2.jpg', // collaboration (high-five) autour de documents
  '/portal/hero/hero-3.jpg', // poignée de main (recrutement / accord)
];

const INTERVALLE = 6000; // ms entre deux photos

function mouvementReduit(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const HeroCarousel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [actif, setActif] = useState(0);
  const [reduit] = useState(mouvementReduit);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (reduit) return; // l'utilisateur limite les animations : image fixe

    const stop = () => {
      if (timer.current !== null) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    };
    const start = () => {
      stop();
      timer.current = window.setInterval(() => {
        setActif((i) => (i + 1) % IMAGES.length);
      }, INTERVALLE);
    };
    const surVisibilite = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', surVisibilite);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', surVisibilite);
    };
  }, [reduit]);

  return (
    <section className="relative isolate overflow-hidden bg-navy text-white flex items-center min-h-[58vh] sm:min-h-[62vh]">
      {/* Calque photos (décoratif) */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {IMAGES.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1200ms] ease-out ${
              i === actif ? 'opacity-100' : 'opacity-0'
            } ${reduit ? '' : 'hero-kenburns'}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        {/* Voile dégradé navy : lisibilité du titre et de la recherche */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/55" />
        <div className="absolute inset-0 bg-navy/20" />
        {/* Motif zellige discret par-dessus (continuité de marque) */}
        <div className="absolute inset-0 zellige-layer opacity-60" />
      </div>

      {/* Contenu éditorial */}
      <div className="w-full">{children}</div>

      {/* Points de navigation */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActif(i)}
            aria-label={`Afficher l'image ${i + 1} sur ${IMAGES.length}`}
            aria-current={i === actif}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === actif ? 'w-7 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </section>
  );
};
