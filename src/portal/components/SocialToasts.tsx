import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { useContenus } from '../content/ContentContext';
import { usePresenceCount } from '../lib/usePresence';
import { lienContenu } from './ContenuCard';

/* ==========================================================================
   SocialToasts — petites notifications d'engagement, en bas à gauche.

   PRINCIPE : rien d'inventé. On n'affiche jamais de fausse activité nominative
   (« Mme X a demandé un devis ») : ce serait trompeur et interdit (loi 31-08 au
   Maroc, directive Omnibus UE). On montre uniquement des informations vraies :
   - des appels à l'action réels (devis/audit, simulateur, accès libre) ;
   - de vrais contenus du portail (tirés du catalogue) ;
   - un vrai compteur de ressources ;
   - des témoignages RÉELS seulement (voir TESTIMONIALS, vide par défaut).

   Comportement « discret » : 1er toast après ~9 s, puis un toutes les ~28 s,
   fermable ; une fois fermé, on ne réaffiche plus pendant 24 h (localStorage).
========================================================================== */

const FIRST_DELAY = 9_000;   // délai avant le premier toast
const VISIBLE = 8_000;       // durée d'affichage d'un toast
const INTERVAL = 28_000;     // temps entre deux apparitions
const SNOOZE_MS = 24 * 3_600_000; // durée de silence après fermeture
const STORAGE_KEY = 'srh_toasts_dismissed';

interface Toast {
  emoji: string;
  text: string;
  lien?: string;
  cta?: string;
}

/**
 * Témoignages RÉELS uniquement. Laisser vide tant que l'on n'a pas l'accord
 * explicite des personnes citées. Exemple de format :
 *   { texte: 'Les cours de paie sont très clairs.', auteur: 'Salma, stagiaire OFPPT' }
 */
const TESTIMONIALS: { texte: string; auteur: string }[] = [];

export const SocialToasts: React.FC = () => {
  const { contenus, recents } = useContenus();
  const presents = usePresenceCount();
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const stopped = useRef(false);
  const timers = useRef<number[]>([]);

  const queue = useMemo<Toast[]>(() => {
    const items: Toast[] = [];
    // Présence RÉELLE : affichée seulement s'il y a au moins 2 personnes
    // (sinon ce serait juste le visiteur lui-même → on n'affiche rien).
    if (presents != null && presents >= 2) {
      items.push({ emoji: '👀', text: `${presents} personnes consultent le portail en ce moment.` });
    }
    items.push({
      emoji: '💼',
      text: "Besoin d'un audit ou d'un accompagnement RH & paie ? Demandez un devis.",
      lien: '/contact',
      cta: 'Demander un devis',
    });
    recents(4).forEach((c) =>
      items.push({ emoji: '📘', text: `À découvrir : « ${c.titre} ».`, lien: lienContenu(c), cta: 'Lire' })
    );
    items.push({
      emoji: '🧮',
      text: 'Entraînez-vous sur le simulateur de paie avec une entreprise fictive.',
      lien: '/app',
      cta: "Ouvrir l'application",
    });
    if (contenus.length > 0) {
      items.push({
        emoji: '📚',
        text: `${contenus.length} cours, exercices et ressources à explorer gratuitement.`,
        lien: '/recherche',
        cta: 'Explorer',
      });
    }
    items.push({
      emoji: '✅',
      text: 'Accès libre : cours, exercices et QCM, sans création de compte.',
      lien: '/cours',
      cta: 'Commencer',
    });
    TESTIMONIALS.forEach((t) => items.push({ emoji: '⭐', text: `« ${t.texte} » — ${t.auteur}` }));
    return items;
  }, [contenus, recents, presents]);

  useEffect(() => {
    if (queue.length === 0) return;
    // Silence si l'utilisateur a fermé un toast il y a moins de 24 h.
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      if (d && Date.now() - Number(d) < SNOOZE_MS) return;
    } catch {
      /* localStorage indisponible : on continue sans mémoire. */
    }

    stopped.current = false;
    let i = 0;
    const push = () => {
      if (stopped.current) return;
      setIdx(i % queue.length);
      setShown(true);
      const tHide = window.setTimeout(() => {
        setShown(false);
        const tNext = window.setTimeout(() => {
          i += 1;
          push();
        }, Math.max(INTERVAL - VISIBLE, 2_000));
        timers.current.push(tNext);
      }, VISIBLE);
      timers.current.push(tHide);
    };
    const tStart = window.setTimeout(push, FIRST_DELAY);
    timers.current.push(tStart);

    const localTimers = timers.current;
    return () => {
      stopped.current = true;
      localTimers.forEach(clearTimeout);
      timers.current = [];
    };
  }, [queue.length]);

  const fermer = () => {
    stopped.current = true;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setShown(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  if (queue.length === 0) return null;
  const toast = queue[idx];

  return (
    <div
      aria-live="polite"
      className={`fixed z-50 bottom-4 left-4 right-4 sm:right-auto sm:max-w-[330px] ${
        shown ? '' : 'pointer-events-none'
      }`}
    >
      <div
        role="status"
        className={`pointer-events-auto card-soft bg-white relative px-4 py-3.5 pr-9 transition-all duration-500 motion-reduce:transition-none ${
          shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <button
          type="button"
          onClick={fermer}
          aria-label="Ne plus afficher pour aujourd'hui"
          className="absolute top-2 right-2 p-1 rounded-md text-ink/40 hover:text-ink/70 hover:bg-sand transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <span className="text-xl leading-none mt-0.5 shrink-0" aria-hidden="true">{toast.emoji}</span>
          <div className="min-w-0">
            <p className="text-[13.5px] text-ink/85 leading-snug">{toast.text}</p>
            {toast.lien && (
              <Link
                to={toast.lien}
                onClick={fermer}
                className="inline-flex items-center gap-1 text-teal font-semibold text-[12.5px] mt-1.5 hover:underline"
              >
                {toast.cta ?? 'Voir'} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
