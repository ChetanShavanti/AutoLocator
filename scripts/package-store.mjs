/**
 * Creates a Chrome Web Store upload zip from dist/.
 * Run: npm run package:store
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const releaseDir = join(root, 'release');
const zipPath = join(releaseDir, 'autolocator-store.zip');

if (!existsSync(dist)) {
  console.error('dist/ not found. Run npm run build first.');
  process.exit(1);
}

if (!existsSync(join(dist, 'manifest.json'))) {
  console.error('dist/manifest.json missing. Run npm run build first.');
  process.exit(1);
}

mkdirSync(releaseDir, { recursive: true });
if (existsSync(zipPath)) {
  rmSync(zipPath);
}

const isWindows = process.platform === 'win32';
if (isWindows) {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${dist}\\*' -DestinationPath '${zipPath}' -Force"`,
    { stdio: 'inherit' },
  );
} else {
  execSync(`cd "${dist}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
}

console.log(`Store package ready: ${zipPath}`);
