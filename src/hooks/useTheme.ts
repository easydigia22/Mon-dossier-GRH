import { useCallback, useEffect, useState } from 'react';

/**
 * Thème clair / sombre de SIMULRH.
 *
 * Le dark mode est piloté par la classe `dark` sur <html> : une couche de
 * surcharge CSS (voir index.css) bascule l'ensemble des couleurs sans toucher
 * aux composants. La préférence explicite de l'utilisateur est persistée en
 * localStorage ; en l'absence de choix, on suit la préférence système et on
 * réagit à ses changements en direct.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'simulrh-theme';

function lirePreferenceStockee(): Theme | null {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

function prefereSombreSysteme(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function themeInitial(): Theme {
  return lirePreferenceStockee() ?? (prefereSombreSysteme() ? 'dark' : 'light');
}

function appliquer(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0E1220' : '#1C2459');
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(themeInitial);

  // Applique le thème courant au DOM.
  useEffect(() => {
    appliquer(theme);
  }, [theme]);

  // Suit le système tant qu'aucune préférence explicite n'a été enregistrée.
  useEffect(() => {
    if (lirePreferenceStockee()) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => {
      if (!lirePreferenceStockee()) setThemeState(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* stockage indisponible : le thème reste valable pour la session */
    }
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
