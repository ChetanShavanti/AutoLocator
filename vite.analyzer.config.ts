import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Builds the page analyzer as a single self-contained IIFE script
 * for injection via chrome.scripting.executeScript.
 */
export default defineConfig({
  build: {
    outDir: 'dist/content',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/content/pageAnalyzer.ts'),
      formats: ['iife'],
      name: 'AutoLocatorAnalyzer',
      fileName: () => 'pageAnalyzer.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
