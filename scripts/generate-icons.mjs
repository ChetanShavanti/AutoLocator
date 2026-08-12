/**
 * Validates that required extension icons exist in src/icons.
 * Run: npm run icons
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'src', 'icons');

const required = ['icon_16x16.png', 'icon_32x32.png', 'icon_48x48.png', 'icon_128x128.png'];

if (!existsSync(iconsDir)) {
  console.error('Missing directory: src/icons');
  process.exit(1);
}

const missing = required.filter((name) => !existsSync(join(iconsDir, name)));
if (missing.length > 0) {
  console.error(`Missing required icons in src/icons: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Required extension icons found in src/icons.');
