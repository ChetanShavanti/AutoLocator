import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

// Minimal valid 16x16 blue PNG
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAHUlEQVR42mNk+M9Qz0AEYBxVSF+F' +
    'ApjRMKoAAABJRU5ErkJggg==',
  'base64',
);

for (const size of [16, 48, 128]) {
  writeFileSync(join(iconsDir, `icon${size}.png`), png);
}

console.log('Icons generated.');
