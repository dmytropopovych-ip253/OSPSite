import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index:     resolve(__dirname, 'index.html'),
        search:    resolve(__dirname, 'search.html'),
        apartment: resolve(__dirname, 'apartment.html'),
        admin:     resolve(__dirname, 'admin.html'),
        profile:   resolve(__dirname, 'profile.html'),
        settings:  resolve(__dirname, 'settings.html'),
      },
    },
  },
});