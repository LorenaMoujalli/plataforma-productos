import { defineConfig } from 'astro/config';

export default defineConfig({
  server: {
    host: true,
    allowedHosts: true
  },

  vite: {
    server: {
      allowedHosts: true
    },
    preview: {
      allowedHosts: true
    }
  }
});