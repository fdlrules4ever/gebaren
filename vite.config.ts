import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// The app is a plain single-page app (no SvelteKit). In development, API and media requests
// go to `pnpm dev:api` (wrangler dev on port 8787).
const api = 'http://localhost:8787';

export default defineConfig({
  plugins: [svelte()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 0,
  },
  server: {
    proxy: { '/api': api, '/video': api, '/poster': api },
  },
});
