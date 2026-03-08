import { defineConfig } from '@solidjs/start/config';

export default defineConfig({
  server: {
    preset: 'cloudflare-pages',
  },
  vite: {
    server: {
      allowedHosts: true,
    },
  },
});
