import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const popupRoot = resolve(__dirname, 'src/popup');

/** Popup UI — single script bundle, no code-split chunks. */
export default defineConfig({
  root: popupRoot,
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/src/popup'),
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: resolve(popupRoot, 'popup.html'),
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        inlineDynamicImports: true,
      },
    },
  },
});
