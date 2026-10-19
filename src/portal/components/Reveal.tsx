import React, { useEffect, useRef, useState } from 'react';

/**
 * Enveloppe un bloc pour le faire apparaître en fondu + léger glissé
 * la première fois qu'il entre dans le viewport (IntersectionObserver).
 * Désactivé automatiquement via CSS si prefers-reduced-motion est actif.
 */
export const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** Décalage d'apparition en ms, pour un effet escalier sur une grille. */
  delay?: number;
}> = ({ children, className = '', delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
};
