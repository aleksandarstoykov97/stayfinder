import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const pages = ['index', 'stays', 'property', 'booking', 'trips', 'login', 'admin'];

export default defineConfig({
  build: {
    rollupOptions: {
      input: Object.fromEntries(pages.map((page) => [page, fileURLToPath(new URL(`./${page}.html`, import.meta.url))])),
    },
  },
});