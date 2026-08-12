import { copyFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

mkdirSync(dist, { recursive: true });

const manifest = {
  manifest_version: 3,
  name: 'AutoLocator',
  version: '0.1.0',
  description:
    'Analyze visible web UI and generate automation-ready locators for QA engineers.',
  permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
  side_panel: {
    default_path: 'src/sidepanel/sidepanel.html',
  },
  action: {
    default_popup: 'src/popup/popup.html',
    default_title: 'AutoLocator',
    default_icon: {
      16: 'icons/icon_16x16.png',
      32: 'icons/icon_32x32.png',
      48: 'icons/icon_48x48.png',
      128: 'icons/icon_128x128.png',
    },
  },
  background: {
    service_worker: 'background/serviceWorker.js',
    type: 'module',
  },
  options_page: 'src/options/options.html',
  icons: {
    16: 'icons/icon_16x16.png',
    32: 'icons/icon_32x32.png',
    48: 'icons/icon_48x48.png',
    128: 'icons/icon_128x128.png',
  },
};

copyFileSync(join(root, 'manifest.json'), join(dist, 'manifest.json.backup'));

import { writeFileSync } from 'node:fs';
writeFileSync(join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));

if (existsSync(join(root, 'src', 'icons'))) {
  cpSync(join(root, 'src', 'icons'), join(dist, 'icons'), { recursive: true });
} else {
  console.warn('Warning: src/icons not found — extension icons will be missing from dist/.');
}

console.log('Manifest and icons copied to dist/');
