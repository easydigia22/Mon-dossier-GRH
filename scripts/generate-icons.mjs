import sharp from 'sharp';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SOURCE = "C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\ded8838d-4fc9-4d32-8f83-1a7c693ae16f\\grh_paie_app_icon_1792147338376.png";

// Sizes to generate
const sizes = [
  { name: 'favicon-16x16.png',      size: 16  },
  { name: 'favicon-32x32.png',      size: 32  },
  { name: 'favicon-48x48.png',      size: 48  },
  { name: 'apple-touch-icon.png',   size: 180 },
  { name: 'icon-192.png',           size: 192 },
  { name: 'icon-512.png',           size: 512 },
  { name: 'icon-maskable-512.png',  size: 512 },
  { name: 'app_icon.png',           size: 1024 },
];

console.log('🎨 Génération des icônes GRH & Paie...\n');

for (const { name, size } of sizes) {
  const output = join(PUBLIC, name);
  await sharp(SOURCE)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .png({ quality: 95 })
    .toFile(output);
  console.log(`✅ ${name.padEnd(30)} ${size}x${size}px  →  public/${name}`);
}

// Copy root favicon.ico equivalent (32px PNG renamed)
copyFileSync(join(PUBLIC, 'favicon-32x32.png'), join(ROOT, 'favicon.ico'));
console.log(`\n✅ favicon.ico copié à la racine du projet`);

console.log('\n🚀 Tous les formats générés avec succès !');
console.log(`📁 Dossier : ${PUBLIC}`);
