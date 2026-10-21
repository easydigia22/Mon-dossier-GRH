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

/**
 * « Head-prerender » : écrit un index.html statique par route du portail, dont le
 * <head> est déjà complet (title, description, Open Graph, Twitter, canonical,
 * JSON-LD). Le corps reste rendu par le JS. Les robots et aperçus sociaux voient
 * ainsi le bon titre/image/schema sans exécuter de JavaScript.
 * On ne touche PAS à dist/index.html (géré par la PWA) ni à /app, /admin.
 */
function prerenderPlugin(): Plugin {
  const SITE = 'https://simulrh.one';
  const SUFFIXE = 'SimulRH — Portail GRH, paie & droit du travail au Maroc';
  const SITE_NAME = 'SimulRH';
  const IMG_DEFAUT = `${SITE}/portal/brand/logo-simulrh.png`;
  const PREFIXE_TYPE: Record<string, string> = {
    cours: '/cours', exercice: '/exercices', qcm: '/qcm', article: '/actualites', ressource: '/ressources',
  };
  // Libellé + chemin des rubriques (dupliqué ici pour éviter d'importer lucide au build).
  const RUBRIQUE: Record<string, { label: string; path: string }> = {
    grh: { label: 'GRH', path: '/grh' },
    paie: { label: 'Paie au Maroc', path: '/paie' },
    'droit-du-travail': { label: 'Droit du travail', path: '/droit-du-travail' },
    fiscalite: { label: 'Fiscalité & lois de finances', path: '/fiscalite' },
    actualites: { label: 'Actualités', path: '/actualites' },
    ofppt: { label: 'Espace OFPPT', path: '/ofppt' },
    ressources: { label: 'Ressources pro', path: '/ressources' },
  };
  const META_STATIQUE: Record<string, { titre: string; description: string }> = {
    '/grh': { titre: 'GRH', description: 'Recrutement, compétences, formation, évaluation et administration du personnel.' },
    '/paie': { titre: 'Paie au Maroc', description: 'Cours, lecture du bulletin, cas pratiques, exercices corrigés et outils de simulation.' },
    '/droit-du-travail': { titre: 'Droit du travail', description: 'Contrats, durée du travail, congés, rupture du contrat et relations professionnelles.' },
    '/fiscalite': { titre: 'Fiscalité & lois de finances', description: 'Dossiers classés par année, explications pédagogiques et cas pratiques.' },
    '/actualites': { titre: 'Actualités', description: 'Articles RH, paie, droit du travail et fiscalité au Maroc, sourcés et datés.' },
    '/ofppt': { titre: 'Espace OFPPT', description: 'Ressources organisées par filière, module et niveau pour la formation professionnelle.' },
    '/ressources': { titre: 'Ressources pro', description: 'Modèles, fiches pratiques, tableaux et documents téléchargeables.' },
    '/cours': { titre: 'Cours', description: 'Parcours de cours par sujet, niveau et public : GRH, paie, droit du travail et fiscalité.' },
    '/exercices': { titre: 'Exercices', description: 'Exercices avec corrections expliquées pour s’entraîner en RH et paie.' },
    '/qcm': { titre: 'QCM', description: 'Questionnaires avec score et explications pour vérifier ses connaissances.' },
    '/a-propos': { titre: 'À propos', description: 'Le portail SimulRH : mission pédagogique, contenus et public visé.' },
    '/contact': { titre: 'Contact', description: 'Contacter l’équipe du portail SimulRH.' },
    '/mentions-legales': { titre: 'Mentions légales', description: 'Mentions légales du portail SimulRH.' },
    '/confidentialite': { titre: 'Confidentialité', description: 'Politique de confidentialité du portail SimulRH : données, cookies et droits.' },
  };

  const esc = (s: unknown) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const abs = (p?: string) => (!p ? IMG_DEFAUT : /^https?:\/\//i.test(p) ? p : SITE + p);

  function jsonLdContenu(c: any, url: string): object[] {
    const rub = RUBRIQUE[c.rubrique];
    const article = {
      '@context': 'https://schema.org', '@type': c.type === 'article' ? 'Article' : 'CreativeWork',
      headline: c.titre, description: c.resume, datePublished: c.datePublication,
      dateModified: c.dateMiseAJour || c.datePublication, inLanguage: 'fr-MA',
      author: { '@type': 'Organization', name: c.auteur || 'SimulRH' },
      publisher: { '@type': 'Organization', name: 'SimulRH', logo: { '@type': 'ImageObject', url: IMG_DEFAUT } },
      image: [abs(c.imageCouverture)], mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    };
    const blocs: object[] = [article];
    if (c.faq && c.faq.length) {
      blocs.push({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: c.faq.map((f: any) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.reponse } })),
      });
    }
    blocs.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE}/` },
        ...(rub ? [{ '@type': 'ListItem', position: 2, name: rub.label, item: SITE + rub.path }] : []),
        { '@type': 'ListItem', position: rub ? 3 : 2, name: c.titre, item: url },
      ],
    });
    return blocs;
  }

  function page(template: string, opts: { titre: string; description: string; url: string; image?: string; type: 'website' | 'article'; jsonLd?: object[] }) {
    const titreComplet = `${opts.titre} · ${SUFFIXE}`;
    const image = abs(opts.image);
    const tags = [
      `<meta name="description" content="${esc(opts.description)}">`,
      `<meta property="og:title" content="${esc(opts.titre)}">`,
      `<meta property="og:description" content="${esc(opts.description)}">`,
      `<meta property="og:type" content="${opts.type}">`,
      `<meta property="og:site_name" content="${SITE_NAME}">`,
      `<meta property="og:image" content="${esc(image)}">`,
      `<meta property="og:url" content="${esc(opts.url)}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${esc(opts.titre)}">`,
      `<meta name="twitter:description" content="${esc(opts.description)}">`,
      `<meta name="twitter:image" content="${esc(image)}">`,
      `<link rel="canonical" href="${esc(opts.url)}">`,
    ];
    if (opts.jsonLd) {
      const json = JSON.stringify(opts.jsonLd).replace(/</g, '\\u003c');
      tags.push(`<script type="application/ld+json" id="seo-jsonld">${json}</script>`);
    }
    return template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(titreComplet)}</title>`)
      .replace(/\s*<meta name="description"[^>]*>/g, '')
      .replace(/\s*<meta property="og:[^"]*"[^>]*>/g, '')
      .replace(/\s*<meta name="twitter:[^"]*"[^>]*>/g, '')
      .replace(/\s*<link rel="canonical"[^>]*>/g, '')
      .replace('</head>', `    ${tags.join('\n    ')}\n  </head>`);
  }

  let outDir = 'dist';
  return {
    name: 'portail-head-prerender',
    apply: 'build',
    enforce: 'post',
    configResolved(cfg) { outDir = cfg.build.outDir; },
    closeBundle() {
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;
      const template = fs.readFileSync(indexPath, 'utf8');
      let n = 0;
      const ecrire = (route: string, html: string) => {
        const dir = path.join(outDir, route);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
        n++;
      };
      // Pages statiques (hors accueil : dist/index.html reste géré par la PWA).
      for (const [route, meta] of Object.entries(META_STATIQUE)) {
        ecrire(route, page(template, { ...meta, url: SITE + route, type: 'website' }));
      }
      // Pages de contenu (seed), hors dépubliées.
      for (const c of CONTENUS_DEMO) {
        if (c.statut === 'depublie') continue;
        const prefixe = PREFIXE_TYPE[c.type];
        if (!prefixe) continue;
        const route = `${prefixe}/${c.slug}`;
        const url = SITE + route;
        ecrire(route, page(template, {
          titre: c.titre, description: c.resume, url, image: c.imageCouverture,
          type: c.type === 'article' ? 'article' : 'website', jsonLd: jsonLdContenu(c, url),
        }));
      }
      // eslint-disable-next-line no-console
      console.log(`[prerender] ${n} pages HTML statiques générées (head complet)`);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      sitemapPlugin(),
      prerenderPlugin(),
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
