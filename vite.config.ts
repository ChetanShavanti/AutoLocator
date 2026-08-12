import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Service worker — single ES module bundle, no shared chunks. */
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/background/serviceWorker.ts'),
      output: {
        entryFileNames: 'background/serviceWorker.js',
        inlineDynamicImports: true,
      },
    },
  },
  publicDir: 'public',
});
