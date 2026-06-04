import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // produce self-contained build for direct HTML opening
    rollupOptions: {
      input: {
        main: 'index.html',
        tower: 'old-index.html',
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
