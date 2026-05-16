import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'icon.svg');
const svg = readFileSync(svgPath);

// Maskable: safe inner zone — render at 80% on a solid gold background.
const maskableSvg = Buffer.from(`<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#D97706"/>
  <g transform="translate(51, 51) scale(0.8)">
    <path d="M112 368 V144 L192 224 L256 160 L320 224 L400 144 V368"
          fill="none" stroke="#FFFBEB" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`);

const targets = [
  { name: 'icon-192.png', size: 192, src: svg },
  { name: 'icon-512.png', size: 512, src: svg },
  { name: 'icon-512-maskable.png', size: 512, src: maskableSvg },
  { name: 'apple-touch-icon.png', size: 180, src: svg },
  { name: 'favicon-32.png', size: 32, src: svg }
];

for (const t of targets) {
  const out = join(root, 'public', t.name);
  const buf = await sharp(t.src).resize(t.size, t.size).png().toBuffer();
  writeFileSync(out, buf);
  console.log(`✓ ${t.name} (${t.size}×${t.size})`);
}

console.log('\nDone.');
