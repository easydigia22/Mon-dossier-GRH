import sharp from 'sharp';
import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

// Source unique de vérité du logo de la marque (icône « RH PAIE »)
const SOURCE = join(ROOT, 'brand', 'app-icon-master.png');

// Couleur de fond marine de la marque (pour l'icône maskable)
const BRAND_NAVY = '#1C2459';

// Formats « any » : recadrage plein cadre (l'icône est déjà carrée)
const coverSizes = [
  { name: 'favicon-16x16.png',    size: 16  },
  { name: 'favicon-32x32.png',    size: 32  },
  { name: 'favicon-48x48.png',    size: 48  },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png',         size: 192 },
  { name: 'icon-512.png',         size: 512 },
  { name: 'app-logo.png',         size: 256 }, // logo utilisé dans l'en-tête de l'app (AppLogo)
];

console.log('🎨 Génération des icônes « RH PAIE » depuis le master de marque...\n');
console.log(`📎 Source : ${SOURCE}\n`);

for (const { name, size } of coverSizes) {
  const output = join(PUBLIC, name);
  await sharp(SOURCE)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .png({ quality: 95 })
    .toFile(output);
  console.log(`✅ ${name.padEnd(30)} ${size}x${size}px  →  public/${name}`);
}

// Icône maskable : zone de sécurité (logo à ~78 %) sur fond marine plein cadre
const MASKABLE = 512;
const inner = Math.round(MASKABLE * 0.78);
const logo = await sharp(SOURCE)
  .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

await sharp({
  create: { width: MASKABLE, height: MASKABLE, channels: 4, background: BRAND_NAVY },
})
  .composite([{ input: logo, gravity: 'center' }])
  .png({ quality: 95 })
  .toFile(join(PUBLIC, 'icon-maskable-512.png'));
console.log(`✅ ${'icon-maskable-512.png'.padEnd(30)} ${MASKABLE}x${MASKABLE}px  →  public/icon-maskable-512.png (zone de sécurité)`);

// favicon.ico (PNG 32px renommé) à la racine du projet
copyFileSync(join(PUBLIC, 'favicon-32x32.png'), join(ROOT, 'favicon.ico'));
console.log(`\n✅ favicon.ico copié à la racine du projet`);

console.log('\n🚀 Tous les formats générés avec succès !');
console.log(`📁 Dossier : ${PUBLIC}`);
