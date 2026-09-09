import { defineConfig } from 'vite';
import { solidStart } from '@solidjs/start/config';
import { nitro } from 'nitro/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), solidStart(), nitro()],
  optimizeDeps: {
    entries: ['src/**/*.{ts,tsx}'],
    include: ['@solidjs/start > @jridgewell/trace-mapping'],
  },
  nitro: {
    preset: 'cloudflare_pages',
    devServer: {
      // env-runner 0.2.1's Miniflare runner drops request headers and bodies.
      runner: 'node-worker',
    },
  },
  server: {
    port: 3000,
    allowedHosts: true,
  },
});
