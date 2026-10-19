import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Share, Plus, MoreVertical, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

/* ==========================================================================
   InstallApp — hôte de la modale d'installation PWA + logique d'installation.

   Problèmes résolus :
   - Android/Chrome : déclenche le vrai prompt natif (beforeinstallprompt).
   - iOS/Safari : pas de prompt natif → on explique « Partager → Sur l'écran
     d'accueil ».
   - Navigateur interne (WhatsApp, Instagram, Facebook…) : l'installation PWA y
     est IMPOSSIBLE → on invite à rouvrir le lien dans Chrome/Safari (+ copie du
     lien). C'est la cause la plus fréquente du « je ne trouve pas le bouton ».

   Déclenchée depuis l'en-tête / le menu mobile via l'évènement global
   `srh:install-help`. Si l'app est déjà installée, ne rend rien.
========================================================================== */

export const INSTALL_HELP_EVENT = 'srh:install-help';

function detect() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (typeof navigator !== 'undefined' &&
      navigator.platform === 'MacIntel' &&
      (navigator as any).maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const inApp =
    /FBAN|FBAV|Instagram|Line\/|WhatsApp|WeChat|MicroMessenger|Twitter|TikTok|Snapchat|Messenger/i.test(ua) ||
    (isAndroid && /; wv\)/.test(ua));
  return { isIOS, isAndroid, inApp };
}

const Etape: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <li className="flex items-start gap-3">
    <span className="w-6 h-6 rounded-full bg-teal-soft text-teal text-[13px] font-bold flex items-center justify-center shrink-0">
      {n}
    </span>
    <span className="text-[14px] text-ink/85 leading-snug pt-0.5">{children}</span>
  </li>
);

export const InstallApp: React.FC = () => {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();
  const env = useMemo(detect, []);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Réagit à l'évènement global avec la valeur courante de canInstall.
  const actionRef = useRef<() => void>(() => {});
  actionRef.current = () => {
    if (canInstall) void promptInstall();
    else setOpen(true);
  };
  useEffect(() => {
    const h = () => actionRef.current();
    window.addEventListener(INSTALL_HELP_EVENT, h);
    return () => window.removeEventListener(INSTALL_HELP_EVENT, h);
  }, []);

  if (isInstalled) return null;

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible */
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Installer l'application"
    >
      <div className="absolute inset-0 bg-navy-deep/55" onClick={() => setOpen(false)} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl p-5 sm:p-6 max-h-[88vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-ink/40 hover:text-ink/70 hover:bg-sand transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <img src="/icon-192.png" alt="" className="w-11 h-11 rounded-xl shadow-sm" />
          <div>
            <h2 className="font-display text-lg font-bold text-navy leading-tight">Installer SimulRH</h2>
            <p className="text-[13px] text-ink/60">Un accès rapide depuis votre écran d'accueil.</p>
          </div>
        </div>

        {env.inApp ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl bg-safran-soft border border-[#E9A23B]/40 text-[#8a5a12] px-4 py-3 text-[13.5px]">
              <ExternalLink className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Vous avez ouvert ce lien dans une application (WhatsApp, Facebook…). L'installation
                n'est possible que depuis un vrai navigateur.
              </span>
            </div>
            <ol className="space-y-3">
              <Etape n={1}>
                Touchez le menu <MoreVertical className="inline w-4 h-4 -mt-0.5" /> (en haut à droite).
              </Etape>
              <Etape n={2}>Choisissez « Ouvrir dans le navigateur » (Chrome ou Safari).</Etape>
              <Etape n={3}>Rouvrez ce bouton « Installer » — il fonctionnera.</Etape>
            </ol>
            <button
              type="button"
              onClick={copier}
              className="w-full inline-flex items-center justify-center gap-2 bg-navy text-white font-semibold rounded-lg px-4 py-2.5 text-[14px] hover:bg-navy-deep transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Lien copié !' : 'Copier le lien du site'}
            </button>
          </div>
        ) : env.isIOS ? (
          <ol className="space-y-3">
            <Etape n={1}>
              Touchez <Share className="inline w-4 h-4 -mt-0.5 text-teal" /> <strong>Partager</strong> (barre
              en bas de Safari).
            </Etape>
            <Etape n={2}>
              Faites défiler puis choisissez <Plus className="inline w-4 h-4 -mt-0.5" />{' '}
              <strong>« Sur l'écran d'accueil »</strong>.
            </Etape>
            <Etape n={3}>Confirmez avec <strong>« Ajouter »</strong>.</Etape>
          </ol>
        ) : (
          <ol className="space-y-3">
            <Etape n={1}>
              Ouvrez le menu <MoreVertical className="inline w-4 h-4 -mt-0.5" /> du navigateur (en haut à
              droite).
            </Etape>
            <Etape n={2}>
              Touchez <Smartphone className="inline w-4 h-4 -mt-0.5 text-teal" />{' '}
              <strong>« Installer l'application »</strong> ou « Ajouter à l'écran d'accueil ».
            </Etape>
            <Etape n={3}>Validez l'installation.</Etape>
          </ol>
        )}
      </div>
    </div>
  );
};
