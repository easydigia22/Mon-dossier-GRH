import React, { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { RefreshCw, X } from 'lucide-react';

/**
 * Affiche une bulle « Nouvelle version disponible » dès qu'un déploiement est
 * détecté, avec un bouton qui active le nouveau service worker et recharge en un
 * clic — fini le Ctrl+Maj+R manuel après chaque mise en prod.
 *
 * Repose sur le mode `registerType: 'prompt'` de vite-plugin-pwa : le nouveau SW
 * reste en attente tant que l'utilisateur ne confirme pas, ce qui évite de
 * recharger pendant une saisie.
 */
export const PwaUpdatePrompt: React.FC = () => {
  const [nouvelleVersion, setNouvelleVersion] = useState(false);
  // updateSW(true) active le SW en attente puis recharge la page.
  const [updateSW, setUpdateSW] = useState<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNouvelleVersion(true);
      },
      onRegisteredSW(_swUrl, registration) {
        // Vérifie périodiquement l'existence d'une nouvelle version, même si
        // l'utilisateur garde l'onglet ouvert longtemps (toutes les 5 minutes).
        if (registration) {
          setInterval(() => registration.update().catch(() => {}), 5 * 60 * 1000);
        }
      },
      onRegisterError(err) {
        console.error('[PWA] Échec d\'enregistrement du service worker :', err);
      }
    });
    setUpdateSW(() => update);
  }, []);

  if (!nouvelleVersion) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-xs w-[calc(100%-2rem)] sm:w-80 bg-white border border-[#ECE3D6] rounded-xl shadow-lg p-4 no-print">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-[#1C2459] text-white flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-[#149D92]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1C2459]">Nouvelle version disponible</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Une mise à jour de l'application est prête. Rechargez pour en profiter.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => updateSW?.(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#149D92] hover:bg-[#11857c] rounded-lg transition-colors"
            >
              Mettre à jour
            </button>
            <button
              onClick={() => setNouvelleVersion(false)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          onClick={() => setNouvelleVersion(false)}
          className="shrink-0 text-slate-400 hover:text-slate-600"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
