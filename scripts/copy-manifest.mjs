import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

const REQUIRED_ICONS = [
  'icon_16x16.png',
  'icon_32x32.png',
  'icon_48x48.png',
  'icon_128x128.png',
];

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

writeFileSync(join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));

const iconsSrc = join(root, 'src', 'icons');
const iconsDist = join(dist, 'icons');
mkdirSync(iconsDist, { recursive: true });

for (const iconName of REQUIRED_ICONS) {
  const srcPath = join(iconsSrc, iconName);
  if (!existsSync(srcPath)) {
    console.warn(`Warning: missing required icon ${iconName}`);
    continue;
  }
  copyFileSync(srcPath, join(iconsDist, iconName));
}

console.log('Manifest and required icons copied to dist/');
