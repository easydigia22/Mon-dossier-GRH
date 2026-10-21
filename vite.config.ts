import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
import {CONTENUS_DEMO} from './src/portal/content/seed';

/**
 * Génère public → dist/sitemap.xml au build, à partir des routes statiques du
 * portail et du contenu éditorial (seed). Les pages dépubliées sont exclues.
 * Domaine de prod : simulrh.one.
 */
function sitemapPlugin(): Plugin {
  const SITE = 'https://simulrh.one';
  const PREFIXE_TYPE: Record<string, string> = {
    cours: '/cours',
    exercice: '/exercices',
    qcm: '/qcm',
    article: '/actualites',
    ressource: '/ressources',
  };
  const ROUTES_STATIQUES = [
    '/', '/grh', '/paie', '/droit-du-travail', '/fiscalite', '/actualites', '/ofppt', '/ressources',
    '/cours', '/exercices', '/qcm', '/a-propos', '/contact', '/mentions-legales', '/confidentialite',
  ];
  let outDir = 'dist';
  return {
    name: 'generate-sitemap',
    apply: 'build',
    configResolved(cfg) {
      outDir = cfg.build.outDir;
    },
    closeBundle() {
      const today = new Date().toISOString().slice(0, 10);
      const urls: { loc: string; lastmod: string }[] = ROUTES_STATIQUES.map((p) => ({ loc: p, lastmod: today }));
      for (const c of CONTENUS_DEMO) {
        if (c.statut === 'depublie') continue;
        const prefixe = PREFIXE_TYPE[c.type];
        if (!prefixe) continue;
        urls.push({ loc: `${prefixe}/${c.slug}`, lastmod: c.dateMiseAJour || c.datePublication || today });
      }
      const xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        urls
          .map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`)
          .join('\n') +
        '\n</urlset>\n';
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml, 'utf8');
      // eslint-disable-next-line no-console
      console.log(`[sitemap] ${urls.length} URLs → ${path.join(outDir, 'sitemap.xml')}`);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      sitemapPlugin(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['apple-touch-icon.png', 'logo-ofppt.jpg', 'robots.txt'],
        manifest: {
          id: '/',
          name: 'SIMULRH — Simulateur RH & Paie',
          short_name: 'SIMULRH',
          description: "Simulateur RH et Paie pour la formation professionnelle OFPPT au Maroc.",
          lang: 'fr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#F4F7FA',
          theme_color: '#1C2459',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
          navigateFallbackDenylist: [/^\/supabase/]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
