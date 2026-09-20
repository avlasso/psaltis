/// <reference types="vitest/config" />
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** GitHub Pages serves the site under this path; the router and every link must agree. */
const PAGES_BASE = '/psaltis/';

/**
 * GitHub Pages knows nothing about client-side routes. A deep link such as
 * `/psaltis/scales` is served `404.html`; making that file a copy of `index.html`
 * lets the app boot and route itself. (Pages still returns HTTP 404 for it, which
 * browsers render normally.)
 */
function spaFallback(): Plugin {
  let outDir = 'dist';
  return {
    name: 'psaltis:spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
}

export default defineConfig({
  base: PAGES_BASE,
  plugins: [spaFallback()],
  // Vite 8 transforms with oxc; tsconfig says the same, this makes it explicit.
  oxc: {
    jsx: { runtime: 'automatic', importSource: 'preact' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    // Vitest ignores `base` for import.meta.env.BASE_URL; tests should see the real one.
    env: { BASE_URL: PAGES_BASE },
  },
});
