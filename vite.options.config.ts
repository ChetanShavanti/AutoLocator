import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const optionsRoot = resolve(__dirname, 'src/options');

/** Options page — single script bundle, no code-split chunks. */
export default defineConfig({
  root: optionsRoot,
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/src/options'),
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: resolve(optionsRoot, 'options.html'),
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        inlineDynamicImports: true,
      },
    },
  },
});
