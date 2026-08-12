import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sidepanelRoot = resolve(__dirname, 'src/sidepanel');

/** Side panel UI — single script bundle, no code-split chunks. */
export default defineConfig({
  root: sidepanelRoot,
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/src/sidepanel'),
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: resolve(sidepanelRoot, 'sidepanel.html'),
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        inlineDynamicImports: true,
      },
    },
  },
});
